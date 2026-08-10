declare global {
    interface Fbq {
        (...args: any[]): void;
        callMethod?: (...args: any[]) => void;
        queue?: IArguments[];
        version?: string;
        loaded?: boolean;
    }
    interface Window {
        fbq: Fbq;
    }
}
export declare function initFacebookPixel(pixelId: string): void;
export declare function setActiveFacebookPixelIds(ids: readonly string[]): void;
export declare function getActiveFacebookPixelIds(): string[];
export declare function trackToFBPixel(eventName: string, isCustom: boolean, properties?: Record<string, unknown>, eventID?: string, targetIds?: readonly string[]): string[];
export declare function isFBPixelInitialized(): boolean;
/** Internal test helper; not re-exported from the package root. */
export declare function __resetFacebookForTests(): void;
//# sourceMappingURL=facebook.d.ts.map