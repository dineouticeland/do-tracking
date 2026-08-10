import { describe, expect, it } from 'vitest';

import { mapEventName } from '../src/integrations/types.js';

describe('v2 event map', () => {
    it.each([
        ['Takeaway Menu Viewed', 'view_item_list', 'ViewMenu', true],
        ['Takeaway Item Selected', 'select_item', null, true],
        ['Takeaway Item Viewed', 'view_item', 'ViewContent', false],
        ['Takeaway Item Added', 'add_to_cart', 'AddToCart', false],
        ['Takeaway Item Removed', 'remove_from_cart', 'RemoveFromCart', true],
        ['Takeaway Cart Viewed', 'view_cart', 'ViewCart', true],
        ['Takeaway Promo Applied', 'takeaway_promo_applied', 'TakeawayPromoApplied', true],
        ['Takeaway Promo Rejected', 'takeaway_promo_rejected', 'TakeawayPromoRejected', true],
        ['Takeaway Gift Card Applied', 'takeaway_gift_card_applied', 'TakeawayGiftCardApplied', true],
        ['Takeaway Gift Card Rejected', 'takeaway_gift_card_rejected', 'TakeawayGiftCardRejected', true],
        ['Takeaway Checkout Started', 'begin_checkout', 'InitiateCheckout', false],
        ['Takeaway Payment Submitted', 'add_payment_info', 'AddPaymentInfo', false],
        ['Takeaway Payment Succeeded', 'takeaway_payment_succeeded', 'TakeawayPaymentSucceeded', true],
        ['Takeaway Payment Failed', 'takeaway_payment_failed', 'TakeawayPaymentFailed', true],
        ['Takeaway Order Completed', 'purchase', 'Purchase', false],
    ] as const)('maps %s to destination-specific names', (event, ga4, fb, fbCustom) => {
        expect(mapEventName(event)).toEqual({ ga4, fb, fbCustom });
    });

    it.each([
        ['Reservation Flow Started', 'reservation_flow_started', 'ReservationFlowStarted', true],
        ['Reservation Step Viewed', 'reservation_step_viewed', 'ReservationStepViewed', true],
        ['Reservation Date Selected', 'reservation_date_selected', 'ReservationDateSelected', true],
        ['Reservation Guests Selected', 'reservation_guests_selected', 'ReservationGuestsSelected', true],
        ['Reservation Time Selected', 'reservation_time_selected', 'ReservationTimeSelected', true],
        ['Reservation Redirected To Checkout', 'reservation_redirected', 'ReservationRedirected', true],
        ['Reservation Checkout Loaded', 'reservation_checkout_loaded', 'ReservationCheckoutLoaded', true],
        ['Reservation Hold Started', 'reservation_hold_started', 'ReservationHoldStarted', true],
        ['Customer Details Submitted', 'reservation_customer_details_submitted', 'ReservationCustomerDetailsSubmitted', true],
        ['Payment Required Shown', 'payment_required_shown', 'PaymentRequiredShown', true],
        ['Reservation Payment Started', 'reservation_payment_started', 'ReservationPaymentStarted', true],
        ['Reservation Payment Failed', 'payment_failed', 'PaymentFailed', true],
        ['Reservation Payment Redirect', 'payment_redirect', 'PaymentRedirect', true],
        ['Reservation Verification Needed', 'verification_needed', 'VerificationNeeded', true],
        ['Reservation Hold Expired', 'reservation_hold_expired', 'ReservationHoldExpired', true],
        ['Reservation Failed', 'reservation_failed', 'ReservationFailed', true],
        ['Quick Book Clicked', 'quick_book_clicked', 'QuickBookClicked', true],
        ['Reservation Completed', 'generate_lead', 'Lead', false],
        ['Reservation Deposit Paid', 'purchase', 'Purchase', false],
    ] as const)('maps %s without reusing ecommerce funnel semantics', (event, ga4, fb, fbCustom) => {
        expect(mapEventName(event)).toEqual({ ga4, fb, fbCustom });
    });

    it('keeps Sinna booking purchase semantics unchanged', () => {
        expect(mapEventName('Booking Flow Started')).toEqual({
            ga4: 'begin_checkout',
            fb: 'InitiateCheckout',
            fbCustom: false,
        });
        expect(mapEventName('Booking Completed')).toEqual({
            ga4: 'purchase',
            fb: 'Purchase',
            fbCustom: false,
        });
    });
});
