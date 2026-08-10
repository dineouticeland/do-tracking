export declare const verbose = true;
export declare const currentVersion = "2.0.0";
export declare const trackLog: (info: string) => void;
export type Platform = 'dineout' | 'sinna';
export declare function detectPlatform(): Platform;
export type TrackingConfig = {
    companyFbPixelId?: string | null;
    companyGTagId?: string | null;
    companyGATrackingId?: string | null;
    dineoutFbPixelId?: string | null;
    dineoutGATrackingId?: string | null;
    sinnaFbPixelId?: string | null;
    sinnaGATrackingId?: string | null;
    dineoutMixpanelToken?: string | null;
    companyId?: string | null;
};
export type BaseTrackEvent = {
    event: 'Custom';
    payload: Record<string, any>;
};
export type SinnaBookingEvent = {
    event: 'Booking Flow Started';
} | {
    event: 'Booking Step Viewed';
    payload: {
        type: 'scheduled' | 'service';
        step: 'service_category' | 'service' | 'variation' | 'employee' | 'time_slot' | 'checkout' | 'reciept' | 'waiting_list';
        subType?: string;
    };
} | {
    event: 'Service Category Selected';
    payload: {
        categoryId?: string;
        categoryName?: string;
    };
} | {
    event: 'Service Selected';
    payload: {
        serviceId?: string;
        serviceName?: string;
        price?: number;
    };
} | {
    event: 'Service Variation Selected';
    payload: {
        variationId?: string;
        variationName?: string;
    };
} | {
    event: 'Employee Selected';
    payload: {
        employeeId?: string;
        employeeName?: string;
    };
} | {
    event: 'Time Slot Selected';
    payload: {
        date?: string;
        time?: string;
    };
} | {
    event: 'Customer Info Submitted';
    payload: {
        hasEmail?: boolean;
        hasPhone?: boolean;
    };
} | {
    event: 'Waiting List Completed';
    payload: {};
} | {
    event: 'Waiting List Failed';
    payload: {
        reason?: string;
    };
} | {
    event: 'Booking Payment Started';
    payload: {
        amount?: number;
        currency?: string;
        card_provider?: string;
        card_type?: string;
    };
} | {
    event: 'Booking Payment Failed';
    payload: {
        provider?: string;
        reason?: string;
        card_provider?: string;
        card_type?: string;
    };
} | {
    event: 'Booking Completed';
    payload: {
        bookingId?: string;
        totalAmount?: number;
        currency?: string;
        type?: 'redirect' | 'normal' | 'waiting_list';
    };
} | {
    event: 'Booking Failed';
    payload: {
        bookingId?: string;
        totalAmount?: number;
        currency?: string;
        type?: string;
        reason?: string;
    };
} | {
    event: 'Custom';
    payload: {
        eventName: string;
        [key: string]: any;
    };
};
export type SinnaBookingEventMap = {
    [T in SinnaBookingEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type DineoutReservationEvent = {
    event: 'Reservation Checkout Loaded';
    payload: {
        restaurant_id: string;
        dateTime: string;
        guests: number;
        lng?: string;
    };
} | {
    event: 'Reservation Hold Started';
    payload: {
        hold_seconds?: number;
    };
} | {
    event: 'Customer Details Submitted';
    payload: {
        has_email: boolean;
        has_phone: boolean;
        has_special_request: boolean;
    };
} | {
    event: 'Payment Required Shown';
    payload: {
        required: boolean;
        amount?: number;
        currency?: string;
        reason?: string;
    };
} | {
    event: 'Reservation Payment Started';
    payload: {
        amount: number;
        currency: string;
        provider?: string;
    };
} | {
    event: 'Reservation Payment Failed';
    payload: {
        provider?: string;
        error_code?: string;
        card_provider?: string;
    };
} | {
    event: 'Reservation Payment Redirect';
    payload: {
        provider?: string;
        redirect_type: '3ds' | 'other';
        amount?: number;
        currency?: string;
    };
} | {
    event: 'Reservation Verification Needed';
    payload: {
        verification_type: 'email' | 'phone' | 'other';
        reservation_id?: string;
    };
} | {
    event: 'Reservation Completed';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
        reservation_id: string;
        payment_required: boolean;
    };
} | {
    event: 'Reservation Deposit Paid';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
        reservation_id: string;
        payment_transaction_id: string;
        value: number;
        currency: string;
    };
} | {
    event: 'Reservation Failed';
    payload: {
        reservation_id?: string;
        type?: string;
        reason?: string;
    };
} | {
    event: 'Reservation Hold Expired';
} | {
    event: 'Custom';
    payload: {
        eventName: string;
        [key: string]: any;
    };
};
export type DineoutReservationEventMap = {
    [T in DineoutReservationEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type DineoutDiscoveryEvent = {
    event: 'Restaurant Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
        source: 'frontpage' | 'search' | 'category' | 'book_table';
    };
} | {
    event: 'CTA Button Clicked';
    payload: {
        cta_name: string;
        cta_position?: string;
        destination_url?: string;
    };
} | {
    event: 'Event Clicked';
    payload: {
        event_id: string;
        event_name?: string;
    };
} | {
    event: 'Takeaway Category Clicked';
    payload: {
        category_id: string;
        category_name?: string;
    };
} | {
    event: 'Bottom Nav Clicked';
    payload: {
        nav_item: string;
        destination_url?: string;
        position?: number;
    };
} | {
    event: 'Top Nav Clicked';
    payload: {
        nav_item: string;
        destination_url?: string;
    };
} | {
    event: 'Navigation Box Clicked';
    payload: {
        box_name: string;
        destination_url?: string;
        position?: number;
    };
} | {
    event: 'Nav Search Clicked';
} | {
    event: 'Nav Search Result Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
        search_query?: string;
    };
} | {
    event: 'Takeaway Search';
    payload: {
        query?: string;
        categories?: string[];
        cityIds?: string[];
        [key: string]: any;
    };
} | {
    event: 'Takeaway Search Result Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
        search_query?: string;
    };
} | {
    event: 'Reservation Search';
    payload: {
        guests?: number;
        dateTime?: string;
        cityIds?: string[];
        categories?: string[];
        type?: string;
        customDateType?: string;
        [key: string]: any;
    };
} | {
    event: 'Reservation Search Result Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
    };
} | {
    event: 'Table Restaurant Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
    };
} | {
    event: 'Quick Book Clicked';
    payload: {
        restaurant_id: string;
        restaurant_name?: string;
    };
} | {
    event: 'Reservation Step Viewed';
    payload: {
        step: 'date' | 'guest' | 'time' | 'reserve' | 'upsell' | 'confirmation' | 'checkout' | 'reciept';
    };
} | {
    event: 'Reservation Flow Started';
    payload: {
        company_id: string;
        restaurant_id?: string;
        lng?: string;
        source?: string;
    };
} | {
    event: 'Reservation Date Selected';
    payload: {
        date: string;
    };
} | {
    event: 'Reservation Guests Selected';
    payload: {
        guests: number;
    };
} | {
    event: 'Reservation Time Selected';
    payload: {
        dateTime: string;
        guests: number;
    };
} | {
    event: 'Reservation Redirected To Checkout';
    payload: {
        target: string;
    };
} | {
    event: 'Custom';
    payload: {
        eventName: string;
        [key: string]: any;
    };
};
export type DineoutDiscoveryEventMap = {
    [T in DineoutDiscoveryEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
/**
 * A single takeaway line item in GA4-compatible naming.
 * `price` and `discount` are per-unit amounts in major currency units.
 */
export type TakeawayItem = {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    item_category?: string;
    item_variant?: string;
    item_list_id?: string;
    item_list_name?: string;
    discount?: number;
};
export type TakeawayFulfillmentType = 'pickup' | 'delivery';
export type TakeawayPaymentFailureCode = 'declined' | 'cancelled' | 'timeout' | 'provider_error' | 'unknown';
export type TakeawayRejectionReasonCode = 'invalid' | 'expired' | 'not_found' | 'not_applicable' | 'minimum_not_met' | 'already_redeemed' | 'usage_limit_reached' | 'insufficient_balance' | 'disabled' | 'provider_error' | 'unknown';
/**
 * The cart snapshot shared by takeaway ecommerce events.
 * Currency must be an uppercase three-letter ISO-4217 code at runtime.
 */
export type TakeawayCommercePayload = {
    restaurant_id: string;
    restaurant_name?: string;
    cart_id?: string;
    currency: string;
    fulfillment_type: TakeawayFulfillmentType;
    items: TakeawayItem[];
    value: number;
    coupon?: string;
    tax?: number;
    shipping?: number;
};
export type TakeawayPromoAppliedPayload = TakeawayCommercePayload & {
    coupon: string;
};
/** An attempted promo code must not be included in a rejection event. */
export type TakeawayPromoRejectedPayload = Omit<TakeawayCommercePayload, 'coupon'> & {
    reason_code?: TakeawayRejectionReasonCode;
};
/** A redeemed gift-card code must never be included in tracking. */
export type TakeawayGiftCardAppliedPayload = Omit<TakeawayCommercePayload, 'coupon'> & {
    gift_card_value?: number;
};
export type TakeawayGiftCardRejectedPayload = Omit<TakeawayCommercePayload, 'coupon'> & {
    reason_code?: TakeawayRejectionReasonCode;
};
export type TakeawayPaymentSubmittedPayload = TakeawayCommercePayload & {
    payment_type?: string;
};
export type TakeawayPaymentSucceededPayload = TakeawayCommercePayload & {
    order_id?: string | number;
    payment_transaction_id?: string;
};
export type TakeawayPaymentFailedPayload = TakeawayCommercePayload & {
    failure_code: TakeawayPaymentFailureCode;
};
export type TakeawayOrderCompletedPayload = TakeawayCommercePayload & {
    /** Stable backend order identifier. Do not use a route/confirmation GUID. */
    order_id: string | number;
};
export type DineoutTakeawayEvent = {
    event: 'Takeaway Menu Viewed';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Item Selected';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Item Viewed';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Item Added';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Item Removed';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Cart Viewed';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Promo Applied';
    payload: TakeawayPromoAppliedPayload;
} | {
    event: 'Takeaway Promo Rejected';
    payload: TakeawayPromoRejectedPayload;
} | {
    event: 'Takeaway Gift Card Applied';
    payload: TakeawayGiftCardAppliedPayload;
} | {
    event: 'Takeaway Gift Card Rejected';
    payload: TakeawayGiftCardRejectedPayload;
} | {
    event: 'Takeaway Checkout Started';
    payload: TakeawayCommercePayload;
} | {
    event: 'Takeaway Payment Submitted';
    payload: TakeawayPaymentSubmittedPayload;
} | {
    event: 'Takeaway Payment Succeeded';
    payload: TakeawayPaymentSucceededPayload;
} | {
    event: 'Takeaway Payment Failed';
    payload: TakeawayPaymentFailedPayload;
} | {
    event: 'Takeaway Order Completed';
    payload: TakeawayOrderCompletedPayload;
} | {
    event: 'Custom';
    payload: {
        eventName: string;
        [key: string]: any;
    };
};
export type DineoutTakeawayEventMap = {
    [T in DineoutTakeawayEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type TrackableEvent = SinnaBookingEvent | DineoutReservationEvent | DineoutDiscoveryEvent | DineoutTakeawayEvent | BaseTrackEvent;
export type TrackableEventMap = {
    [T in TrackableEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type EventMapping = {
    ga4: string;
    fb: string | null;
    fbCustom: boolean;
};
export declare const EVENT_MAP: Record<TrackableEvent['event'], EventMapping>;
export declare function mapEventName(event: TrackableEvent['event'] | string): EventMapping;
/** @deprecated Use TrackableEvent instead */
export type TrackMethod = {
    event: 'AddPaymentInfo';
} | {
    event: 'AddToCart';
} | {
    event: 'AddToWishlist';
} | {
    event: 'CompleteRegistration';
} | {
    event: 'Contact';
} | {
    event: 'CustomizeProduct';
} | {
    event: 'Donate';
} | {
    event: 'FindLocation';
} | {
    event: 'InitiateCheckout';
} | {
    event: 'Lead';
} | {
    event: 'Purchase';
    payload: {
        value: number;
        currency: string;
    };
} | {
    event: 'Search';
} | {
    event: 'StartTrial';
    payload: {
        value: number;
        currency: string;
        predicted_ltv: number;
    };
} | {
    event: 'SubmitApplication';
} | {
    event: 'Subscribe';
    payload: {
        value: number;
        currency: string;
        predicted_ltv: number;
    };
} | {
    event: 'ViewContent';
} | {
    event: 'Custom';
    payload: Record<string, any>;
};
/** @deprecated Use TrackableEventMap instead */
export type EventMap = {
    [T in TrackMethod as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
/** @deprecated Use dineoutTrack instead */
export type TrackingEventFunction = <T extends keyof EventMap>(event: T, data: EventMap[T] extends undefined ? undefined : EventMap[T]) => void;
export declare let DO_TRACKING_INTEGRATIONS: TrackingEventFunction[];
export declare function clearIntegrations(): void;
export declare function addIntegration(fn: TrackingEventFunction): void;
export declare function injectScriptOnce(src: string, async?: boolean): boolean;
export declare function mapFacebookToGA4(event: TrackMethod['event'], data: any): {
    event: string;
    data?: Record<string, any>;
};
//# sourceMappingURL=types.d.ts.map