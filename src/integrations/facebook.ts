// ============================================================================
// FACEBOOK PIXEL INTEGRATION
// ============================================================================

import { trackLog, injectScriptOnce, addIntegration } from './types';

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

// ============================================================================
// STATE
// ============================================================================

let fbPixelInitialized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initFacebookPixel(pixelId: string) {
    if (!window.fbq || !window.fbq.loaded) {
        const fbq: Fbq = function () {
            if (fbq.callMethod) {
                fbq.callMethod.apply(null, arguments as any);
            } else {
                (fbq.queue = fbq.queue || []).push(arguments);
            }
        } as Fbq;

        fbq.version = "2.0";
        fbq.loaded = true;
        fbq.queue = [];

        window.fbq = fbq;
        injectScriptOnce("https://connect.facebook.net/en_US/fbevents.js");
    }

    window.fbq("init", pixelId);
    fbPixelInitialized = true;
    trackLog(`Added Facebook Pixel with Id: ${pixelId}`);
    window.fbq("track", "PageView");

    addIntegration((event, data) => {
        trackLog(`Sending event to Pixel ${event}`);
        if (event === 'Custom') {
            window.fbq("trackCustom", event, data);
        } else {
            window.fbq('track', event, data);
        }
    });
}

// ============================================================================
// DIRECT TRACKING (for unified dineoutTrack)
// ============================================================================

/**
 * Send an event directly to Facebook Pixel with already-mapped event name
 * @param eventName - The FB event name (e.g., 'Purchase', 'AddToCart')
 * @param isCustom - If true, uses trackCustom; if false, uses track
 * @param properties - Event properties
 */
export function trackToFBPixel(eventName: string, isCustom: boolean, properties?: Record<string, any>): void {
    if (!fbPixelInitialized || !window.fbq) {
        return;
    }
    
    if (isCustom) {
        trackLog(`Sending custom event to FB Pixel: ${eventName}`);
        window.fbq("trackCustom", eventName, properties);
    } else {
        trackLog(`Sending standard event to FB Pixel: ${eventName}`);
        window.fbq("track", eventName, properties);
    }
}

/**
 * Check if Facebook Pixel is initialized
 */
export function isFBPixelInitialized(): boolean {
    return fbPixelInitialized;
}

