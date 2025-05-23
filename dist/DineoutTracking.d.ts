export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
};
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
type EventMap = {
    [T in TrackMethod as T['event']]: T extends {
        payload: infer P;
    } ? P : undefined;
};
type TrackingEventFunction = <T extends keyof EventMap>(event: T, data: EventMap[T] extends undefined ? undefined : EventMap[T]) => void;
declare global {
    interface Fbq {
        (...args: any[]): void;
        callMethod?: (...args: any[]) => void;
        queue?: any[];
        version?: string;
        loaded?: boolean;
    }
    interface Window {
        dataLayer: Record<string, any>[];
        gtag: Gtag.Gtag;
        dineoutTrackingIntegrations?: TrackingEventFunction[];
        sendDineoutEvent?: TrackingEventFunction;
        fbq: Fbq;
    }
}
export declare const sendDineoutEvent: TrackingEventFunction;
export declare function DineoutTracking({ companyIdentifier }: {
    companyIdentifier: string;
}): null;
export {};
//# sourceMappingURL=DineoutTracking.d.ts.map