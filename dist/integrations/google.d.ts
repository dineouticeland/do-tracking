type DataLayerEntry = Record<string, unknown> | IArguments;
declare global {
    interface Window {
        dataLayer: DataLayerEntry[];
        gtag: Gtag.Gtag;
        [key: string]: unknown;
    }
}
export declare function initGA4(measurementId: string): void;
export declare function initGTM(containerId: string): void;
export declare function setActiveGA4MeasurementIds(ids: readonly string[]): void;
export declare function setActiveGTMContainerIds(ids: readonly string[]): void;
export declare function getActiveGA4MeasurementIds(): string[];
export declare function getActiveGTMContainerIds(): string[];
export declare function trackToGA4(eventName: string, properties?: Record<string, unknown>, targetIds?: readonly string[]): string[];
export declare function trackToGTM(payload: Record<string, unknown>, targetIds?: readonly string[]): string[];
/** @deprecated Prefer passing the complete dataLayer payload produced by toGTMEvent. */
export declare function trackToGTM(eventName: string, properties?: Record<string, unknown>, targetIds?: readonly string[]): string[];
export declare function isGA4Initialized(): boolean;
export declare function isGTMInitialized(): boolean;
/** Internal test helper; not re-exported from the package root. */
export declare function __resetGoogleForTests(): void;
export {};
//# sourceMappingURL=google.d.ts.map