export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
};
export type TrackingEventFunction = (event: string, data?: Record<string, any>) => void;
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
export declare const sendDineoutEvent: (event: string, data?: Record<string, any>) => void;
export declare function DineoutTracking({ companyIdentifier }: {
    companyIdentifier: string;
}): null;
//# sourceMappingURL=DineoutTracking.d.ts.map