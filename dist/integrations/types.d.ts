export declare const verbose = true;
export declare const currentVersion = "1.5.8";
export declare const trackLog: (info: string) => void;
export type Platform = 'dineout' | 'sinna';
export declare function detectPlatform(): Platform;
export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
    dineoutFbPixelId?: string | null;
    dineoutGATrackingId?: string | null;
    sinnaFbPixelId?: string | null;
    sinnaGaTrackingId?: string | null;
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
        reservation_id: string;
        amount_paid?: number;
        currency?: string;
        payment_required: boolean;
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
export type TrackableEvent = SinnaBookingEvent | DineoutReservationEvent | DineoutDiscoveryEvent | BaseTrackEvent;
export type TrackableEventMap = {
    [T in TrackableEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type EventMapping = {
    ga4: string;
    fb: string;
    fbCustom: boolean;
};
export declare const EVENT_MAP: Record<TrackableEvent['event'], EventMapping>;
export declare function mapEventName(event: TrackableEvent['event']): EventMapping;
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