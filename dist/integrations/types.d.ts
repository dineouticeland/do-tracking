export declare const verbose = true;
export declare const currentVersion = "1.3.0";
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
export type TrackableEvent = {
    event: 'Booking Flow Started';
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
        email?: string;
        phone?: string;
    };
} | {
    event: 'Payment Started';
    payload: {
        amount?: number;
        currency?: string;
    };
} | {
    event: 'Booking Completed';
    payload: {
        bookingId?: string;
        totalAmount?: number;
        currency?: string;
    };
} | {
    event: 'Custom';
    payload: Record<string, any>;
};
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