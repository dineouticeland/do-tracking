export declare const verbose = true;
export declare const currentVersion = "1.3.4";
export declare const trackLog: (info: string) => void;
export type Platform = 'dineout' | 'sinna';
export declare function detectPlatform(): Platform;
export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
    mixpanelToken?: string | null;
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
    event: 'Payment Started';
    payload: {
        amount?: number;
        currency?: string;
    };
} | {
    event: 'Payment Failed';
    payload: {
        provider?: string;
        error_code?: string;
        card_provider?: string;
    };
} | {
    event: 'Booking Completed';
    payload: {
        bookingId?: string;
        totalAmount?: number;
        currency?: string;
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
};
export type SinnaBookingEventMap = {
    [T in SinnaBookingEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type DineoutReservationEvent = {
    event: 'Reservation Step Viewed';
    payload: {
        step: 'date' | 'guest' | 'time' | 'checkout' | 'reciept' | 'checkout' | 'reciept';
    };
} | {
    event: 'Reservation Flow Started';
    payload: {
        flow_id: string;
        company_id: string;
        restaurant_id?: string;
        lng?: string;
        source?: string;
    };
} | {
    event: 'Reservation Date Selected';
    payload: {
        flow_id: string;
        date: string;
    };
} | {
    event: 'Reservation Guests Selected';
    payload: {
        flow_id: string;
        guests: number;
    };
} | {
    event: 'Reservation Time Selected';
    payload: {
        flow_id: string;
        dateTime: string;
        guests: number;
    };
} | {
    event: 'Reservation Redirected To Checkout';
    payload: {
        flow_id: string;
        target: string;
    };
} | {
    event: 'Reservation Checkout Loaded';
    payload: {
        flow_id: string;
        restaurant_id: string;
        dateTime: string;
        guests: number;
        lng?: string;
    };
} | {
    event: 'Reservation Hold Started';
    payload: {
        flow_id: string;
        hold_seconds?: number;
    };
} | {
    event: 'Customer Details Submitted';
    payload: {
        flow_id: string;
        has_email: boolean;
        has_phone: boolean;
        has_special_request: boolean;
    };
} | {
    event: 'Payment Required Shown';
    payload: {
        flow_id: string;
        required: boolean;
        amount?: number;
        currency?: string;
        reason?: string;
    };
} | {
    event: 'Reservation Payment Started';
    payload: {
        flow_id: string;
        amount: number;
        currency: string;
        provider?: string;
    };
} | {
    event: 'Payment Failed';
    payload: {
        flow_id: string;
        provider?: string;
        error_code?: string;
        card_provider?: string;
    };
} | {
    event: 'Reservation Completed';
    payload: {
        flow_id: string;
        reservation_id: string;
        amount_paid?: number;
        currency?: string;
        payment_required: boolean;
    };
} | {
    event: 'Reservation Failed';
    payload: {
        flow_id: string;
        reservation_id: string;
        type?: string;
        reason?: string;
    };
} | {
    event: 'Reservation Hold Expired';
    payload: {
        flow_id: string;
    };
};
export type DineoutReservationEventMap = {
    [T in DineoutReservationEvent as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
export type TrackableEvent = SinnaBookingEvent | DineoutReservationEvent | BaseTrackEvent;
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