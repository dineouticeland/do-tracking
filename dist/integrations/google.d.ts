declare global {
    interface Window {
        dataLayer: Record<string, any>[];
        gtag: Gtag.Gtag;
    }
}
export declare function initGA4(measurementId: string): void;
export declare function initGTM(containerId: string): void;
/**
 * Send an event directly to GA4 with already-mapped event name
 */
export declare function trackToGA4(eventName: string, properties?: Record<string, any>): void;
/**
 * Send an event directly to GTM with already-mapped event name
 */
export declare function trackToGTM(eventName: string, properties?: Record<string, any>): void;
/**
 * Check if GA4 is initialized
 */
export declare function isGA4Initialized(): boolean;
/**
 * Check if GTM is initialized
 */
export declare function isGTMInitialized(): boolean;
//# sourceMappingURL=google.d.ts.map