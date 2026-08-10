import { describe, expect, it } from 'vitest';

import {
    adaptEvent,
    toGA4Event,
    toGTMEvent,
    toMetaEvent,
    toMixpanelEvent,
    TrackingValidationError,
    validateEventPayload,
} from '../src/integrations/adapters.js';

const item = {
    item_id: 'burger-101',
    item_name: 'Funky Burger',
    item_category: 'Burgers',
    item_variant: 'burger-101|patty:double|sauce:chili',
    item_list_id: 'main-menu',
    item_list_name: 'Main menu',
    price: 3290,
    quantity: 1,
    discount: 500,
};

const commerce = {
    restaurant_id: 'funkybhangra',
    restaurant_name: 'Funky Bhangra',
    cart_id: 'cart-4821',
    currency: 'ISK',
    fulfillment_type: 'pickup',
    items: [item],
    value: 3290,
    coupon: 'SUMMER',
    tax: 783,
    shipping: 0,
};

const commerceWithoutCoupon = (() => {
    const { coupon: _coupon, ...rest } = commerce;
    return rest;
})();

const metaCommerce = {
    content_type: 'product',
    content_ids: ['burger-101'],
    contents: [{ id: 'burger-101', quantity: 1, item_price: 3290 }],
    num_items: 1,
    value: 3290,
    currency: 'ISK',
    restaurant_id: 'funkybhangra',
    restaurant_name: 'Funky Bhangra',
    cart_id: 'cart-4821',
    fulfillment_type: 'pickup',
    coupon: 'SUMMER',
    tax: 783,
    shipping: 0,
    content_name: 'Funky Burger',
    content_category: 'Burgers',
};

function expectedMetaParams(payload: Record<string, any>): Record<string, unknown> {
    const expected: Record<string, unknown> = {
        content_type: 'product',
        content_ids: payload.items.map((entry: typeof item) => entry.item_id),
        contents: payload.items.map((entry: typeof item) => ({
            id: entry.item_id,
            quantity: entry.quantity,
            item_price: entry.price,
        })),
        num_items: payload.items.reduce((total: number, entry: typeof item) => total + entry.quantity, 0),
    };
    for (const field of [
        'value',
        'currency',
        'restaurant_id',
        'restaurant_name',
        'cart_id',
        'fulfillment_type',
        'coupon',
        'tax',
        'shipping',
        'reason_code',
        'gift_card_value',
        'payment_type',
        'failure_code',
    ]) {
        if (payload[field] !== undefined) expected[field] = payload[field];
    }
    if (payload.items.length === 1) {
        expected.content_name = payload.items[0].item_name;
        if (payload.items[0].item_category !== undefined) {
            expected.content_category = payload.items[0].item_category;
        }
    }
    return expected;
}

describe('takeaway destination adapters', () => {
    it.each([
        ['Takeaway Menu Viewed', commerce, 'view_item_list', 'ViewMenu', true],
        ['Takeaway Item Selected', commerce, 'select_item', null, true],
        ['Takeaway Item Viewed', commerce, 'view_item', 'ViewContent', false],
        ['Takeaway Item Added', commerce, 'add_to_cart', 'AddToCart', false],
        ['Takeaway Item Removed', commerce, 'remove_from_cart', 'RemoveFromCart', true],
        ['Takeaway Cart Viewed', commerce, 'view_cart', 'ViewCart', true],
        ['Takeaway Promo Applied', commerce, 'takeaway_promo_applied', 'TakeawayPromoApplied', true],
        [
            'Takeaway Promo Rejected',
            { ...commerceWithoutCoupon, reason_code: 'not_applicable' },
            'takeaway_promo_rejected',
            'TakeawayPromoRejected',
            true,
        ],
        [
            'Takeaway Gift Card Applied',
            { ...commerceWithoutCoupon, gift_card_value: 1000 },
            'takeaway_gift_card_applied',
            'TakeawayGiftCardApplied',
            true,
        ],
        [
            'Takeaway Gift Card Rejected',
            { ...commerceWithoutCoupon, reason_code: 'not_found' },
            'takeaway_gift_card_rejected',
            'TakeawayGiftCardRejected',
            true,
        ],
        ['Takeaway Checkout Started', commerce, 'begin_checkout', 'InitiateCheckout', false],
        [
            'Takeaway Payment Submitted',
            { ...commerce, payment_type: 'card' },
            'add_payment_info',
            'AddPaymentInfo',
            false,
        ],
        [
            'Takeaway Payment Succeeded',
            { ...commerce, order_id: '104582', payment_transaction_id: 'pay-789' },
            'takeaway_payment_succeeded',
            'TakeawayPaymentSucceeded',
            true,
        ],
        [
            'Takeaway Payment Failed',
            { ...commerce, failure_code: 'declined' },
            'takeaway_payment_failed',
            'TakeawayPaymentFailed',
            true,
        ],
        ['Takeaway Order Completed', { ...commerce, order_id: '104582' }, 'purchase', 'Purchase', false],
    ] as const)(
        'maps %s for GA4, GTM, Meta, and Mixpanel',
        (eventName, payload, ga4Name, metaName, metaCustom) => {
            const adapted = adaptEvent(eventName, payload);
            const expectedGA4Params: Record<string, unknown> = { ...payload };
            if (eventName === 'Takeaway Order Completed') {
                expectedGA4Params.transaction_id = String(expectedGA4Params.order_id);
                delete expectedGA4Params.order_id;
            }

            expect(adapted.ga4).toEqual({ eventName: ga4Name, params: expectedGA4Params });
            expect(adapted.gtm).toEqual({ event: ga4Name, ecommerce: expectedGA4Params });
            expect(adapted.mixpanel).toEqual({ eventName, properties: payload });
            if (metaName === null) {
                expect(adapted.meta).toBeNull();
            } else {
                expect(adapted.meta).toEqual({
                    eventName: metaName,
                    custom: metaCustom,
                    params: expectedMetaParams(payload),
                    ...(eventName === 'Takeaway Order Completed'
                        ? { eventID: `takeaway_purchase:${String(payload.order_id)}` }
                        : {}),
                });
            }
        },
    );

    it('produces exact item payloads for every destination', () => {
        const ga4 = { eventName: 'add_to_cart', params: commerce };

        expect(toGA4Event('Takeaway Item Added', commerce)).toEqual(ga4);
        expect(toGTMEvent('Takeaway Item Added', commerce)).toEqual({
            event: 'add_to_cart',
            ecommerce: commerce,
        });
        expect(toMetaEvent('Takeaway Item Added', commerce)).toEqual({
            eventName: 'AddToCart',
            custom: false,
            params: metaCommerce,
        });
        expect(toMixpanelEvent('Takeaway Item Added', commerce)).toEqual({
            eventName: 'Takeaway Item Added',
            properties: commerce,
        });
    });

    it('turns a completed order into a deduplicatable Purchase without forwarding order_id twice', () => {
        const payload = { ...commerce, order_id: '104582' };
        const purchaseProperties = { ...commerce, transaction_id: '104582' };

        expect(adaptEvent('Takeaway Order Completed', payload)).toEqual({
            ga4: { eventName: 'purchase', params: purchaseProperties },
            gtm: { event: 'purchase', ecommerce: purchaseProperties },
            meta: {
                eventName: 'Purchase',
                custom: false,
                params: metaCommerce,
                eventID: 'takeaway_purchase:104582',
            },
            mixpanel: {
                eventName: 'Takeaway Order Completed',
                properties: payload,
            },
            conversion: { kind: 'purchase', eventId: 'takeaway_purchase:104582' },
        });
    });

    it('keeps normalized payment failures low-cardinality', () => {
        const payload = { ...commerce, failure_code: 'provider_error' };

        expect(toGA4Event('Takeaway Payment Failed', payload)).toEqual({
            eventName: 'takeaway_payment_failed',
            params: payload,
        });
        expect(toMetaEvent('Takeaway Payment Failed', payload)).toEqual({
            eventName: 'TakeawayPaymentFailed',
            custom: true,
            params: { ...metaCommerce, failure_code: 'provider_error' },
        });
    });

    it('shapes multi-item carts without inventing a single content name', () => {
        const secondItem = {
            item_id: 'fries-201',
            item_name: 'Chili Fries',
            item_category: 'Sides',
            price: 1290,
            quantity: 3,
        };
        const payload = {
            ...commerceWithoutCoupon,
            items: [{ ...item, quantity: 2 }, secondItem],
            value: 10450,
        };

        expect(toMetaEvent('Takeaway Cart Viewed', payload)).toEqual({
            eventName: 'ViewCart',
            custom: true,
            params: {
                content_type: 'product',
                content_ids: ['burger-101', 'fries-201'],
                contents: [
                    { id: 'burger-101', quantity: 2, item_price: 3290 },
                    { id: 'fries-201', quantity: 3, item_price: 1290 },
                ],
                num_items: 5,
                value: 10450,
                currency: 'ISK',
                restaurant_id: 'funkybhangra',
                restaurant_name: 'Funky Bhangra',
                cart_id: 'cart-4821',
                fulfillment_type: 'pickup',
                tax: 783,
                shipping: 0,
            },
        });
    });
});

describe('reservation destination adapters', () => {
    it.each([
        [
            'Reservation Flow Started',
            { company_id: 'company-1', restaurant_id: 'restaurant-1', source: 'frontpage' },
            'reservation_flow_started',
            'ReservationFlowStarted',
        ],
        [
            'Reservation Step Viewed',
            { step: 'date' },
            'reservation_step_viewed',
            'ReservationStepViewed',
        ],
        [
            'Reservation Date Selected',
            { date: '2026-08-06' },
            'reservation_date_selected',
            'ReservationDateSelected',
        ],
        [
            'Reservation Guests Selected',
            { guests: 4 },
            'reservation_guests_selected',
            'ReservationGuestsSelected',
        ],
        [
            'Reservation Time Selected',
            { dateTime: '2026-08-06T19:00:00Z', guests: 4 },
            'reservation_time_selected',
            'ReservationTimeSelected',
        ],
        [
            'Reservation Redirected To Checkout',
            { target: 'https://booking.dineout.is/checkout' },
            'reservation_redirected',
            'ReservationRedirected',
        ],
        [
            'Reservation Checkout Loaded',
            { restaurant_id: 'restaurant-1', dateTime: '2026-08-06T19:00:00Z', guests: 4 },
            'reservation_checkout_loaded',
            'ReservationCheckoutLoaded',
        ],
        [
            'Reservation Hold Started',
            { hold_seconds: 300 },
            'reservation_hold_started',
            'ReservationHoldStarted',
        ],
        [
            'Customer Details Submitted',
            { has_email: true, has_phone: true, has_special_request: false },
            'reservation_customer_details_submitted',
            'ReservationCustomerDetailsSubmitted',
        ],
        [
            'Payment Required Shown',
            { required: true, amount: 2000, currency: 'ISK', reason: 'deposit' },
            'payment_required_shown',
            'PaymentRequiredShown',
        ],
        [
            'Reservation Payment Started',
            { amount: 2000, currency: 'ISK', provider: 'rapyd' },
            'reservation_payment_started',
            'ReservationPaymentStarted',
        ],
        [
            'Reservation Payment Failed',
            { provider: 'rapyd', error_code: 'declined', card_provider: 'visa' },
            'payment_failed',
            'PaymentFailed',
        ],
        [
            'Reservation Payment Redirect',
            { provider: 'rapyd', redirect_type: '3ds', amount: 2000, currency: 'ISK' },
            'payment_redirect',
            'PaymentRedirect',
        ],
        [
            'Reservation Verification Needed',
            { verification_type: 'email', reservation_id: 'reservation-1' },
            'verification_needed',
            'VerificationNeeded',
        ],
        [
            'Reservation Failed',
            { reservation_id: 'reservation-1', type: 'availability', reason: 'slot_unavailable' },
            'reservation_failed',
            'ReservationFailed',
        ],
        [
            'Reservation Search',
            {
                guests: 4,
                dateTime: '2026-08-06T19:00:00Z',
                cityIds: ['reykjavik'],
                categories: ['indian'],
                type: 'dinner',
                customDateType: 'exact',
            },
            'search',
            'Search',
            false,
        ],
        [
            'Reservation Search Result Clicked',
            { restaurant_id: 'restaurant-1', restaurant_name: 'Restaurant' },
            'select_item',
            'ViewContent',
            false,
        ],
        [
            'Table Restaurant Clicked',
            { restaurant_id: 'restaurant-1', restaurant_name: 'Restaurant' },
            'select_item',
            'ViewContent',
            false,
        ],
        [
            'Quick Book Clicked',
            { restaurant_id: 'restaurant-1', restaurant_name: 'Restaurant' },
            'quick_book_clicked',
            'QuickBookClicked',
            true,
        ],
    ] as const)(
        'adapts %s with exact GA4, GTM, Meta, and Mixpanel payloads',
        (eventName, payload, ga4Name, metaName, metaCustom = true) => {
            expect(adaptEvent(eventName, payload)).toEqual({
                ga4: { eventName: ga4Name, params: payload },
                gtm: { event: ga4Name, ...payload },
                meta: { eventName: metaName, custom: metaCustom, params: payload },
                mixpanel: { eventName, properties: payload },
                conversion: undefined,
            });
        },
    );

    it('adapts the payload-less reservation hold expiry exactly', () => {
        expect(adaptEvent('Reservation Hold Expired')).toEqual({
            ga4: { eventName: 'reservation_hold_expired', params: {} },
            gtm: { event: 'reservation_hold_expired' },
            meta: {
                eventName: 'ReservationHoldExpired',
                custom: true,
                params: {},
            },
            mixpanel: { eventName: 'Reservation Hold Expired', properties: {} },
            conversion: undefined,
        });
    });

    it('maps a completed reservation to Lead with no ecommerce revenue', () => {
        const input = {
            restaurant_id: 'rest-123',
            restaurant_name: 'Funky Bhangra',
            reservation_id: 'res-456',
            payment_required: true,
        };
        const safeProperties = {
            restaurant_id: 'rest-123',
            restaurant_name: 'Funky Bhangra',
            reservation_id: 'res-456',
            payment_required: true,
        };

        expect(adaptEvent('Reservation Completed', input)).toEqual({
            ga4: { eventName: 'generate_lead', params: safeProperties },
            gtm: { event: 'generate_lead', ...safeProperties },
            meta: {
                eventName: 'Lead',
                custom: false,
                params: safeProperties,
                eventID: 'reservation_lead:res-456',
            },
            mixpanel: { eventName: 'Reservation Completed', properties: safeProperties },
            conversion: { kind: 'lead', eventId: 'reservation_lead:res-456' },
        });
        expect(adaptEvent('Reservation Completed', input).ga4.params).not.toHaveProperty('value');
        expect(adaptEvent('Reservation Completed', input).gtm).not.toHaveProperty('ecommerce');
    });

    it('maps a captured deposit to a separate Purchase with one synthetic item', () => {
        const input = {
            restaurant_id: 'rest-123',
            restaurant_name: 'Funky Bhangra',
            reservation_id: 'res-456',
            payment_transaction_id: 'pay-789',
            value: 2000,
            currency: 'ISK',
        };
        const gaProperties = {
            restaurant_id: 'rest-123',
            restaurant_name: 'Funky Bhangra',
            reservation_id: 'res-456',
            currency: 'ISK',
            value: 2000,
            transaction_id: 'pay-789',
            items: [{
                item_id: 'reservation_deposit',
                item_name: 'Reservation deposit',
                price: 2000,
                quantity: 1,
            }],
        };
        const metaProperties = {
            content_type: 'product',
            content_ids: ['reservation_deposit'],
            contents: [{ id: 'reservation_deposit', quantity: 1, item_price: 2000 }],
            num_items: 1,
            value: 2000,
            currency: 'ISK',
            restaurant_id: 'rest-123',
            restaurant_name: 'Funky Bhangra',
            reservation_id: 'res-456',
        };

        expect(adaptEvent('Reservation Deposit Paid', input)).toEqual({
            ga4: { eventName: 'purchase', params: gaProperties },
            gtm: { event: 'purchase', ecommerce: gaProperties },
            meta: {
                eventName: 'Purchase',
                custom: false,
                params: metaProperties,
                eventID: 'reservation_deposit:pay-789',
            },
            mixpanel: { eventName: 'Reservation Deposit Paid', properties: input },
            conversion: { kind: 'purchase', eventId: 'reservation_deposit:pay-789' },
        });
    });
});

describe('v2 runtime validation and privacy', () => {
    it('accepts uppercase currencies, numeric major-unit values, and stable modifiers', () => {
        expect(() => validateEventPayload('Takeaway Item Added', commerce)).not.toThrow();
    });

    it('allows an empty rendered menu and a backend-accepted zero-value order', () => {
        expect(() => validateEventPayload('Takeaway Menu Viewed', {
            ...commerce,
            items: [],
            value: 0,
        })).not.toThrow();
        expect(toGA4Event('Takeaway Order Completed', {
            ...commerceWithoutCoupon,
            order_id: '104582',
            value: 0,
        })).toEqual(expect.objectContaining({
            eventName: 'purchase',
            params: expect.objectContaining({ transaction_id: '104582', value: 0 }),
        }));
    });

    it('rejects unknown takeaway event names instead of silently creating a custom event', () => {
        expect(() => validateEventPayload('Takeaway Order Maybe Completed', commerce)).toThrow(/unknown takeaway event/);
    });

    it.each([
        ['missing restaurant ID', { ...commerce, restaurant_id: '' }, /restaurant_id/],
        ['lowercase currency', { ...commerce, currency: 'isk' }, /uppercase three-letter/],
        ['negative value', { ...commerce, value: -1 }, /value/],
        ['non-finite value', { ...commerce, value: Number.NaN }, /value/],
        ['negative tax', { ...commerce, tax: -1 }, /tax/],
        ['non-finite shipping', { ...commerce, shipping: Number.POSITIVE_INFINITY }, /shipping/],
        ['invalid fulfillment', { ...commerce, fulfillment_type: 'table' }, /fulfillment_type/],
        ['missing items', { ...commerce, items: undefined }, /items must be an array/],
        ['empty cart event', { ...commerce, items: [] }, /at least one item/],
        ['multiple item delta', { ...commerce, items: [item, item] }, /exactly one item/],
        ['negative item price', { ...commerce, items: [{ ...item, price: -1 }] }, /price/],
        ['zero item quantity', { ...commerce, items: [{ ...item, quantity: 0 }] }, /positive integer/],
        ['fractional item quantity', { ...commerce, items: [{ ...item, quantity: 1.5 }] }, /positive integer/],
        ['negative item discount', { ...commerce, items: [{ ...item, discount: -1 }] }, /discount/],
        ['unexpected item field', { ...commerce, items: [{ ...item, email: 'private@example.com' }] }, /not an allowed/],
    ] as const)('rejects %s', (_label, payload, message) => {
        expect(() => validateEventPayload('Takeaway Item Added', payload)).toThrow(message);
    });

    it.each(['raw_gateway_message', 'do_not_honor', '', undefined])(
        'rejects non-normalized payment failure code %s',
        (failureCode) => {
            expect(() => validateEventPayload('Takeaway Payment Failed', {
                ...commerce,
                failure_code: failureCode,
            })).toThrow(/failure_code is not normalized/);
        },
    );

    it.each([
        ['Takeaway Promo Rejected', 'private@example.com'],
        ['Takeaway Promo Rejected', 'Coupon SUMMER was rejected by gateway'],
        ['Takeaway Gift Card Rejected', 'card 4111111111111111 has no balance'],
        ['Takeaway Gift Card Rejected', 'raw-provider-message'],
    ] as const)('rejects non-normalized or private reason text on %s', (eventName, reasonCode) => {
        expect(() => validateEventPayload(eventName, {
            ...commerceWithoutCoupon,
            reason_code: reasonCode,
        })).toThrow(/reason_code is not normalized/);
    });

    it('requires a backend order ID and refuses confirmation-route GUIDs', () => {
        expect(() => validateEventPayload('Takeaway Order Completed', commerce)).toThrow(/order_id/);
        expect(() => validateEventPayload('Takeaway Order Completed', {
            ...commerce,
            order_id: '110e8400-e29b-41d4-a716-446655440000',
        })).toThrow(/GUID/);
        expect(() => validateEventPayload('Takeaway Order Completed', {
            ...commerce,
            order_id: '018f3f17-7a4b-7cc8-98c4-2af0c1a2b3c4',
        })).toThrow(/GUID/);
    });

    it('requires a backend-confirmed coupon on promo-applied events', () => {
        expect(() => validateEventPayload('Takeaway Promo Applied', commerceWithoutCoupon)).toThrow(/coupon/);
    });

    it.each([
        ['Takeaway Promo Rejected', { ...commerceWithoutCoupon, promo_code: 'SECRET' }],
        ['Takeaway Promo Rejected', { ...commerceWithoutCoupon, coupon: 'SECRET' }],
        ['Takeaway Gift Card Applied', { ...commerceWithoutCoupon, gift_card_code: 'SECRET' }],
        ['Takeaway Gift Card Rejected', { ...commerceWithoutCoupon, clip_card_code: 'SECRET' }],
        ['Takeaway Payment Submitted', { ...commerce, card_number: '4111111111111111' }],
        ['Takeaway Order Completed', { ...commerce, order_id: '104582', confirmation_guid: 'SECRET' }],
        [
            'Reservation Completed',
            { restaurant_id: 'rest', reservation_id: 'res', payment_required: false, email: 'private@example.com' },
        ],
        [
            'Reservation Deposit Paid',
            {
                restaurant_id: 'rest',
                reservation_id: 'res',
                payment_transaction_id: 'pay',
                value: 2000,
                currency: 'ISK',
                card_number: '4111111111111111',
            },
        ],
    ] as const)('rejects private or unexpected fields on %s before adaptation', (eventName, payload) => {
        expect(() => adaptEvent(eventName, payload)).toThrow(TrackingValidationError);
        expect(() => adaptEvent(eventName, payload)).toThrow(/not an allowed|must not be sent/);
    });

    it.each([
        [{ restaurant_id: 'rest', reservation_id: 'res', payment_required: 'yes' }, /payment_required/],
        [{ restaurant_id: 'rest', reservation_id: '', payment_required: false }, /reservation_id/],
    ])('rejects malformed reservation lead payloads', (payload, message) => {
        expect(() => validateEventPayload('Reservation Completed', payload)).toThrow(message);
    });

    it.each([
        [
            { restaurant_id: 'rest', reservation_id: 'res', payment_transaction_id: '', value: 2000, currency: 'ISK' },
            /payment_transaction_id/,
        ],
        [
            { restaurant_id: 'rest', reservation_id: 'res', payment_transaction_id: 'pay', value: -1, currency: 'ISK' },
            /value/,
        ],
        [
            { restaurant_id: 'rest', reservation_id: 'res', payment_transaction_id: 'pay', value: 2000, currency: 'isk' },
            /uppercase three-letter/,
        ],
    ])('rejects malformed reservation deposit payloads', (payload, message) => {
        expect(() => validateEventPayload('Reservation Deposit Paid', payload)).toThrow(message);
    });
});
