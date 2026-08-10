import type {
    DineoutTakeawayEvent,
    EventMapping,
    TakeawayItem,
    TakeawayPaymentFailureCode,
    TakeawayRejectionReasonCode,
    TrackableEvent,
} from './types.js';
import { mapEventName } from './types.js';

export type TrackingProperties = Record<string, unknown>;

export type GA4AdapterEvent = {
    eventName: string;
    params: TrackingProperties;
};

/** A complete object ready to push to GTM's dataLayer. */
export type GTMAdapterEvent = {
    event: string;
    ecommerce?: TrackingProperties;
    [key: string]: unknown;
};

export type MetaAdapterEvent = {
    eventName: string;
    custom: boolean;
    params: TrackingProperties;
    /** Passed as Meta Pixel's fourth options argument: `{ eventID }`. */
    eventID?: string;
};

export type MixpanelAdapterEvent = {
    eventName: string;
    properties: TrackingProperties;
};

export type ConversionDescriptor = {
    kind: 'lead' | 'purchase';
    /** Stable logical ID used to deduplicate once per destination. */
    eventId: string;
};

export type AdaptedTrackingEvent = {
    ga4: GA4AdapterEvent;
    gtm: GTMAdapterEvent;
    meta: MetaAdapterEvent | null;
    mixpanel: MixpanelAdapterEvent;
    conversion?: ConversionDescriptor;
};

type KnownEventName = TrackableEvent['event'];
type TakeawayEventName = Exclude<DineoutTakeawayEvent['event'], 'Custom'>;

const TAKEAWAY_EVENTS: ReadonlySet<string> = new Set<TakeawayEventName>([
    'Takeaway Menu Viewed',
    'Takeaway Item Selected',
    'Takeaway Item Viewed',
    'Takeaway Item Added',
    'Takeaway Item Removed',
    'Takeaway Cart Viewed',
    'Takeaway Promo Applied',
    'Takeaway Promo Rejected',
    'Takeaway Gift Card Applied',
    'Takeaway Gift Card Rejected',
    'Takeaway Checkout Started',
    'Takeaway Payment Submitted',
    'Takeaway Payment Succeeded',
    'Takeaway Payment Failed',
    'Takeaway Order Completed',
]);

const SINGLE_ITEM_EVENTS: ReadonlySet<string> = new Set([
    'Takeaway Item Selected',
    'Takeaway Item Viewed',
    'Takeaway Item Added',
    'Takeaway Item Removed',
]);

const PAYMENT_FAILURE_CODES: ReadonlySet<TakeawayPaymentFailureCode> = new Set([
    'declined',
    'cancelled',
    'timeout',
    'provider_error',
    'unknown',
]);

const REJECTION_REASON_CODES: ReadonlySet<TakeawayRejectionReasonCode> = new Set([
    'invalid',
    'expired',
    'not_found',
    'not_applicable',
    'minimum_not_met',
    'already_redeemed',
    'usage_limit_reached',
    'insufficient_balance',
    'disabled',
    'provider_error',
    'unknown',
]);

const TAKEAWAY_BASE_FIELDS = [
    'restaurant_id',
    'restaurant_name',
    'cart_id',
    'currency',
    'fulfillment_type',
    'items',
    'value',
    'coupon',
    'tax',
    'shipping',
] as const;

const TAKEAWAY_ITEM_FIELDS = [
    'item_id',
    'item_name',
    'price',
    'quantity',
    'item_category',
    'item_variant',
    'item_list_id',
    'item_list_name',
    'discount',
] as const;

export class TrackingValidationError extends Error {
    readonly eventName: string;

    constructor(eventName: string, message: string) {
        super(`${eventName}: ${message}`);
        this.name = 'TrackingValidationError';
        this.eventName = eventName;
    }
}

function isObject(value: unknown): value is TrackingProperties {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertObject(eventName: string, value: unknown): asserts value is TrackingProperties {
    if (!isObject(value)) {
        throw new TrackingValidationError(eventName, 'payload must be an object');
    }
}

function assertNonEmptyString(eventName: string, field: string, value: unknown): asserts value is string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new TrackingValidationError(eventName, `${field} must be a non-empty string`);
    }
}

function assertNonNegativeNumber(eventName: string, field: string, value: unknown): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new TrackingValidationError(eventName, `${field} must be a finite, non-negative number`);
    }
}

function assertAllowedFields(
    eventName: string,
    value: TrackingProperties,
    fields: readonly string[],
    location = 'payload',
): void {
    const allowed = new Set(fields);
    const unexpected = Object.keys(value).find((key) => !allowed.has(key));
    if (unexpected) {
        throw new TrackingValidationError(eventName, `${location}.${unexpected} is not an allowed tracking field`);
    }
}

function validateTakeawayItem(eventName: string, item: unknown, index: number): asserts item is TakeawayItem {
    assertObject(eventName, item);
    assertAllowedFields(eventName, item, TAKEAWAY_ITEM_FIELDS, `items[${index}]`);
    assertNonEmptyString(eventName, `items[${index}].item_id`, item.item_id);
    assertNonEmptyString(eventName, `items[${index}].item_name`, item.item_name);
    assertNonNegativeNumber(eventName, `items[${index}].price`, item.price);
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new TrackingValidationError(eventName, `items[${index}].quantity must be a positive integer`);
    }
    if (item.discount !== undefined) {
        assertNonNegativeNumber(eventName, `items[${index}].discount`, item.discount);
    }

    for (const field of ['item_category', 'item_variant', 'item_list_id', 'item_list_name'] as const) {
        if (item[field] !== undefined) {
            assertNonEmptyString(eventName, `items[${index}].${field}`, item[field]);
        }
    }
}

function takeawayExtraFields(eventName: TakeawayEventName): readonly string[] {
    switch (eventName) {
        case 'Takeaway Promo Rejected':
        case 'Takeaway Gift Card Rejected':
            return ['reason_code'];
        case 'Takeaway Gift Card Applied':
            return ['gift_card_value'];
        case 'Takeaway Payment Submitted':
            return ['payment_type'];
        case 'Takeaway Payment Succeeded':
            return ['order_id', 'payment_transaction_id'];
        case 'Takeaway Payment Failed':
            return ['failure_code'];
        case 'Takeaway Order Completed':
            return ['order_id'];
        default:
            return [];
    }
}

function validateOrderId(eventName: string, value: unknown): void {
    const validNumber = typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
    const validString = typeof value === 'string' && value.trim().length > 0;
    if (!validNumber && !validString) {
        throw new TrackingValidationError(eventName, 'order_id must be a stable backend identifier');
    }

    // Confirmation-route GUIDs are deliberately excluded from analytics payloads.
    if (typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) {
        throw new TrackingValidationError(eventName, 'order_id must not be a confirmation or route GUID');
    }
}

function validateTakeawayPayload(eventName: TakeawayEventName, properties: unknown): void {
    assertObject(eventName, properties);
    const extraFields = takeawayExtraFields(eventName);
    const baseFields = (
        eventName === 'Takeaway Promo Rejected'
        || eventName === 'Takeaway Gift Card Applied'
        || eventName === 'Takeaway Gift Card Rejected'
    )
        ? TAKEAWAY_BASE_FIELDS.filter((field) => field !== 'coupon')
        : TAKEAWAY_BASE_FIELDS;
    assertAllowedFields(eventName, properties, [...baseFields, ...extraFields]);

    assertNonEmptyString(eventName, 'restaurant_id', properties.restaurant_id);
    assertNonEmptyString(eventName, 'currency', properties.currency);
    if (!/^[A-Z]{3}$/.test(properties.currency)) {
        throw new TrackingValidationError(eventName, 'currency must be an uppercase three-letter ISO-4217 code');
    }
    if (properties.fulfillment_type !== 'pickup' && properties.fulfillment_type !== 'delivery') {
        throw new TrackingValidationError(eventName, 'fulfillment_type must be pickup or delivery');
    }
    assertNonNegativeNumber(eventName, 'value', properties.value);
    if (!Array.isArray(properties.items)) {
        throw new TrackingValidationError(eventName, 'items must be an array');
    }
    if (eventName !== 'Takeaway Menu Viewed' && properties.items.length === 0) {
        throw new TrackingValidationError(eventName, 'items must contain at least one item');
    }
    if (SINGLE_ITEM_EVENTS.has(eventName) && properties.items.length !== 1) {
        throw new TrackingValidationError(eventName, 'item interaction events must contain exactly one item');
    }
    properties.items.forEach((item, index) => validateTakeawayItem(eventName, item, index));

    for (const field of ['restaurant_name', 'cart_id'] as const) {
        if (properties[field] !== undefined) {
            assertNonEmptyString(eventName, field, properties[field]);
        }
    }
    for (const field of ['tax', 'shipping'] as const) {
        if (properties[field] !== undefined) {
            assertNonNegativeNumber(eventName, field, properties[field]);
        }
    }
    if (properties.coupon !== undefined) {
        assertNonEmptyString(eventName, 'coupon', properties.coupon);
    }

    switch (eventName) {
        case 'Takeaway Promo Applied':
            assertNonEmptyString(eventName, 'coupon', properties.coupon);
            break;
        case 'Takeaway Promo Rejected':
        case 'Takeaway Gift Card Applied':
        case 'Takeaway Gift Card Rejected':
            if ('coupon' in properties) {
                throw new TrackingValidationError(eventName, 'coupon/code values must not be sent for this event');
            }
            break;
        case 'Takeaway Payment Failed':
            if (!PAYMENT_FAILURE_CODES.has(properties.failure_code as TakeawayPaymentFailureCode)) {
                throw new TrackingValidationError(eventName, 'failure_code is not normalized');
            }
            break;
        case 'Takeaway Order Completed':
            validateOrderId(eventName, properties.order_id);
            break;
    }

    if (properties.reason_code !== undefined) {
        if (!REJECTION_REASON_CODES.has(properties.reason_code as TakeawayRejectionReasonCode)) {
            throw new TrackingValidationError(eventName, 'reason_code is not normalized');
        }
    }
    if (properties.gift_card_value !== undefined) {
        assertNonNegativeNumber(eventName, 'gift_card_value', properties.gift_card_value);
    }
    if (properties.payment_type !== undefined) {
        assertNonEmptyString(eventName, 'payment_type', properties.payment_type);
    }
    if (properties.payment_transaction_id !== undefined) {
        assertNonEmptyString(eventName, 'payment_transaction_id', properties.payment_transaction_id);
    }
    if (properties.order_id !== undefined && eventName === 'Takeaway Payment Succeeded') {
        validateOrderId(eventName, properties.order_id);
    }
}

function validateReservationCompleted(properties: unknown): void {
    const eventName = 'Reservation Completed';
    assertObject(eventName, properties);
    assertAllowedFields(eventName, properties, ['restaurant_id', 'restaurant_name', 'reservation_id', 'payment_required']);
    assertNonEmptyString(eventName, 'restaurant_id', properties.restaurant_id);
    assertNonEmptyString(eventName, 'reservation_id', properties.reservation_id);
    if (properties.restaurant_name !== undefined) {
        assertNonEmptyString(eventName, 'restaurant_name', properties.restaurant_name);
    }
    if (properties.payment_required !== true && properties.payment_required !== false) {
        throw new TrackingValidationError(eventName, 'payment_required must be a boolean');
    }
}

function validateReservationDeposit(properties: unknown): void {
    const eventName = 'Reservation Deposit Paid';
    assertObject(eventName, properties);
    assertAllowedFields(eventName, properties, [
        'restaurant_id',
        'restaurant_name',
        'reservation_id',
        'payment_transaction_id',
        'value',
        'currency',
    ]);
    assertNonEmptyString(eventName, 'restaurant_id', properties.restaurant_id);
    assertNonEmptyString(eventName, 'reservation_id', properties.reservation_id);
    assertNonEmptyString(eventName, 'payment_transaction_id', properties.payment_transaction_id);
    if (properties.restaurant_name !== undefined) {
        assertNonEmptyString(eventName, 'restaurant_name', properties.restaurant_name);
    }
    assertNonNegativeNumber(eventName, 'value', properties.value);
    assertNonEmptyString(eventName, 'currency', properties.currency);
    if (!/^[A-Z]{3}$/.test(properties.currency)) {
        throw new TrackingValidationError(eventName, 'currency must be an uppercase three-letter ISO-4217 code');
    }
}

/** Validate the v2 event contracts before any destination receives an event. */
export function validateEventPayload(eventName: string, properties?: TrackingProperties): void {
    if (isTakeawayEvent(eventName)) {
        validateTakeawayPayload(eventName, properties);
    } else if (eventName.startsWith('Takeaway ')) {
        throw new TrackingValidationError(eventName, 'unknown takeaway event');
    } else if (eventName === 'Reservation Completed') {
        validateReservationCompleted(properties);
    } else if (eventName === 'Reservation Deposit Paid') {
        validateReservationDeposit(properties);
    }
}

export function isTakeawayEvent(eventName: string): eventName is TakeawayEventName {
    return TAKEAWAY_EVENTS.has(eventName);
}

function copyDefined(properties?: TrackingProperties): TrackingProperties {
    if (!properties) return {};
    const copied: TrackingProperties = {};
    for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) copied[key] = value;
    }
    return copied;
}

function pickDefined(properties: TrackingProperties, fields: readonly string[]): TrackingProperties {
    const picked: TrackingProperties = {};
    for (const field of fields) {
        if (properties[field] !== undefined) picked[field] = properties[field];
    }
    return picked;
}

function normalizeItems(items: unknown): TakeawayItem[] {
    return (items as TakeawayItem[]).map((item) => pickDefined(item as unknown as TrackingProperties, TAKEAWAY_ITEM_FIELDS) as TakeawayItem);
}

function normalizeCustomEvent(
    eventName: string,
    properties?: TrackingProperties,
): { eventName: string; properties: TrackingProperties; mapping: EventMapping } {
    const copied = copyDefined(properties);
    if (eventName === 'Custom' && typeof copied.eventName === 'string' && copied.eventName.trim()) {
        const customName = copied.eventName;
        delete copied.eventName;
        return { eventName: customName, properties: copied, mapping: mapEventName(customName) };
    }
    return { eventName, properties: copied, mapping: mapEventName(eventName as KnownEventName) };
}

function takeawayProperties(eventName: TakeawayEventName, properties: TrackingProperties): TrackingProperties {
    const fields = [...TAKEAWAY_BASE_FIELDS, ...takeawayExtraFields(eventName)];
    const result = pickDefined(properties, fields);
    result.items = normalizeItems(properties.items);

    if (eventName === 'Takeaway Order Completed') {
        result.transaction_id = String(properties.order_id);
        delete result.order_id;
    }

    // Codes typed by a customer are never forwarded on rejection/tender events.
    if (
        eventName === 'Takeaway Promo Rejected'
        || eventName === 'Takeaway Gift Card Applied'
        || eventName === 'Takeaway Gift Card Rejected'
    ) {
        delete result.coupon;
    }
    return result;
}

function reservationLeadProperties(properties: TrackingProperties): TrackingProperties {
    return pickDefined(properties, ['restaurant_id', 'restaurant_name', 'reservation_id', 'payment_required']);
}

function reservationDepositProperties(properties: TrackingProperties): TrackingProperties {
    const value = properties.value as number;
    return {
        ...pickDefined(properties, ['restaurant_id', 'restaurant_name', 'reservation_id', 'currency', 'value']),
        transaction_id: properties.payment_transaction_id,
        items: [{
            item_id: 'reservation_deposit',
            item_name: 'Reservation deposit',
            price: value,
            quantity: 1,
        }],
    };
}

function ga4Properties(eventName: string, properties: TrackingProperties): TrackingProperties {
    if (isTakeawayEvent(eventName)) return takeawayProperties(eventName, properties);
    if (eventName === 'Reservation Completed') return reservationLeadProperties(properties);
    if (eventName === 'Reservation Deposit Paid') return reservationDepositProperties(properties);
    return copyDefined(properties);
}

function mixpanelProperties(eventName: string, properties: TrackingProperties): TrackingProperties {
    if (isTakeawayEvent(eventName)) {
        const result = pickDefined(properties, [...TAKEAWAY_BASE_FIELDS, ...takeawayExtraFields(eventName)]);
        result.items = normalizeItems(properties.items);
        if (
            eventName === 'Takeaway Promo Rejected'
            || eventName === 'Takeaway Gift Card Applied'
            || eventName === 'Takeaway Gift Card Rejected'
        ) {
            delete result.coupon;
        }
        return result;
    }
    if (eventName === 'Reservation Completed') return reservationLeadProperties(properties);
    if (eventName === 'Reservation Deposit Paid') {
        return pickDefined(properties, [
            'restaurant_id',
            'restaurant_name',
            'reservation_id',
            'payment_transaction_id',
            'value',
            'currency',
        ]);
    }
    return copyDefined(properties);
}

function conversionFor(eventName: string, properties: TrackingProperties): ConversionDescriptor | undefined {
    if (eventName === 'Takeaway Order Completed') {
        return { kind: 'purchase', eventId: `takeaway_purchase:${String(properties.order_id)}` };
    }
    if (eventName === 'Reservation Completed') {
        return { kind: 'lead', eventId: `reservation_lead:${String(properties.reservation_id)}` };
    }
    if (eventName === 'Reservation Deposit Paid') {
        return { kind: 'purchase', eventId: `reservation_deposit:${String(properties.payment_transaction_id)}` };
    }
    return undefined;
}

function metaCommerceProperties(eventName: TakeawayEventName, properties: TrackingProperties): TrackingProperties {
    const items = normalizeItems(properties.items);
    const result: TrackingProperties = {
        content_type: 'product',
        content_ids: items.map((item) => item.item_id),
        contents: items.map((item) => ({
            id: item.item_id,
            quantity: item.quantity,
            item_price: item.price,
        })),
        num_items: items.reduce((total, item) => total + item.quantity, 0),
        ...pickDefined(properties, [
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
        ]),
    };

    if (items.length === 1) {
        result.content_name = items[0].item_name;
        if (items[0].item_category !== undefined) result.content_category = items[0].item_category;
    }
    if (
        eventName === 'Takeaway Promo Rejected'
        || eventName === 'Takeaway Gift Card Applied'
        || eventName === 'Takeaway Gift Card Rejected'
    ) {
        delete result.coupon;
    }
    return result;
}

function metaReservationDepositProperties(properties: TrackingProperties): TrackingProperties {
    return {
        content_type: 'product',
        content_ids: ['reservation_deposit'],
        contents: [{ id: 'reservation_deposit', quantity: 1, item_price: properties.value }],
        num_items: 1,
        ...pickDefined(properties, ['value', 'currency', 'restaurant_id', 'restaurant_name', 'reservation_id']),
    };
}

/** Transform a descriptive event into GA4's event/parameter contract. */
export function toGA4Event(eventName: string, properties?: TrackingProperties): GA4AdapterEvent {
    validateEventPayload(eventName, properties);
    const normalized = normalizeCustomEvent(eventName, properties);
    return {
        eventName: normalized.mapping.ga4,
        params: ga4Properties(normalized.eventName, normalized.properties),
    };
}

/** Transform a descriptive event into a complete GTM dataLayer payload. */
export function toGTMEvent(eventName: string, properties?: TrackingProperties): GTMAdapterEvent {
    const ga4 = toGA4Event(eventName, properties);
    const normalized = normalizeCustomEvent(eventName, properties);
    if (isTakeawayEvent(normalized.eventName) || normalized.eventName === 'Reservation Deposit Paid') {
        return { event: ga4.eventName, ecommerce: ga4.params };
    }
    return { ...ga4.params, event: ga4.eventName };
}

/** Transform a descriptive event into a Meta Pixel event, or null when intentionally unsupported. */
export function toMetaEvent(eventName: string, properties?: TrackingProperties): MetaAdapterEvent | null {
    validateEventPayload(eventName, properties);
    const normalized = normalizeCustomEvent(eventName, properties);
    if (!normalized.mapping.fb) return null;

    let params: TrackingProperties;
    if (isTakeawayEvent(normalized.eventName)) {
        params = metaCommerceProperties(normalized.eventName, normalized.properties);
    } else if (normalized.eventName === 'Reservation Completed') {
        params = reservationLeadProperties(normalized.properties);
    } else if (normalized.eventName === 'Reservation Deposit Paid') {
        params = metaReservationDepositProperties(normalized.properties);
    } else {
        params = copyDefined(normalized.properties);
    }

    const conversion = conversionFor(normalized.eventName, normalized.properties);
    return {
        eventName: normalized.mapping.fb,
        custom: normalized.mapping.fbCustom,
        params,
        ...(conversion ? { eventID: conversion.eventId } : {}),
    };
}

/** Keep Mixpanel's readable event names while applying the same privacy-safe payload normalization. */
export function toMixpanelEvent(eventName: string, properties?: TrackingProperties): MixpanelAdapterEvent {
    validateEventPayload(eventName, properties);
    const normalized = normalizeCustomEvent(eventName, properties);
    return {
        eventName: normalized.eventName,
        properties: mixpanelProperties(normalized.eventName, normalized.properties),
    };
}

/** Build all destination payloads in one validated, side-effect-free operation. */
export function adaptEvent(eventName: string, properties?: TrackingProperties): AdaptedTrackingEvent {
    validateEventPayload(eventName, properties);
    const normalized = normalizeCustomEvent(eventName, properties);
    return {
        ga4: toGA4Event(eventName, properties),
        gtm: toGTMEvent(eventName, properties),
        meta: toMetaEvent(eventName, properties),
        mixpanel: toMixpanelEvent(eventName, properties),
        conversion: conversionFor(normalized.eventName, normalized.properties),
    };
}
