declare global {
    interface Fbq {
        (...args: any[]): void;
        callMethod?: (...args: any[]) => void;
        queue?: any[];
        version?: string;
        loaded?: boolean;
    }
    interface Window {
        fbq: Fbq;
    }
}
export declare function initFacebookPixel(pixelId: string): void;
/**
 * Send an event directly to Facebook Pixel with already-mapped event name
 * @param eventName - The FB event name (e.g., 'Purchase', 'AddToCart')
 * @param isCustom - If true, uses trackCustom; if false, uses track
 * @param properties - Event properties
 */
export declare function trackToFBPixel(eventName: string, isCustom: boolean, properties?: Record<string, any>): void;
/**
 * Check if Facebook Pixel is initialized
 */
export declare function isFBPixelInitialized(): boolean;
//# sourceMappingURL=facebook.d.ts.map