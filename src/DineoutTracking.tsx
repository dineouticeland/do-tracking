'use client';

import { useEffect, useState } from "react";
import {
    Platform,
    TrackingConfig,
    TrackingEventFunction,
    TrackableEvent,
    TrackableEventMap,
    trackLog,
    detectPlatform,
    clearIntegrations,
    DO_TRACKING_INTEGRATIONS,
    mapEventName,
    initFacebookPixel,
    initGA4,
    initGTM,
    initMixpanel,
    trackToMixpanel,
    trackToGA4,
    trackToGTM,
    trackToFBPixel,
    identifyUser as identifyMixpanelUser,
    resetMixpanel,
} from './integrations';

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type { Platform, TrackableEvent } from './integrations';

export type DineoutTrackingProps = {
    companyIdentifier: string;
    platform?: Platform;
    userId?: string;
};

// ============================================================================
// GLOBAL WINDOW AUGMENTATION
// ============================================================================

type DineoutTrackFunction = <T extends TrackableEvent['event']>(
    event: T,
    ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]
) => void;

declare global {
    interface Window {
        dineoutTrack?: DineoutTrackFunction;
        /** @deprecated Use dineoutTrack instead */
        sendDineoutEvent?: TrackingEventFunction;
    }
}

// ============================================================================
// UNIFIED TRACKING FUNCTION
// ============================================================================

/**
 * Track an event across all platforms (Mixpanel, GA4, GTM, FB Pixel).
 * 
 * - Mixpanel receives the descriptive event name (e.g., "Service Selected")
 * - GA4/GTM receive the mapped event name (e.g., "add_to_cart")
 * - FB Pixel receives the mapped event name with standard/custom handling
 * 
 * @example
 * dineoutTrack('Booking Flow Started');
 * dineoutTrack('Service Selected', { serviceId: 'svc-1', serviceName: 'Haircut', price: 4500 });
 * dineoutTrack('Booking Completed', { bookingId: 'b-123', totalAmount: 4500, currency: 'ISK' });
 */
export function dineoutTrack<T extends TrackableEvent['event']>(
    event: T,
    ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]
): void {
    const properties = args[0] as Record<string, any> | undefined;
    
    trackLog(`dineoutTrack: ${event}`);
    
    // Get mapped event names for GA4/FB
    const mapped = mapEventName(event);
    
    // Send descriptive name to Mixpanel
    trackToMixpanel(event, properties);
    
    // Send mapped name to GA4
    trackToGA4(mapped.ga4, properties);
    
    // Send mapped name to GTM
    trackToGTM(mapped.ga4, properties);
    
    // Send mapped name to FB Pixel (standard or custom)
    trackToFBPixel(mapped.fb, mapped.fbCustom, properties);
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

/**
 * Identify a user for tracking.
 * Call this after the user enters their contact info or logs in.
 * @param userId - Unique identifier for the user (e.g., phone, email, or user ID)
 */
export function identifyUser(userId: string): void {
    trackLog(`identifyUser: ${userId}`);
    identifyMixpanelUser(userId);
}

/**
 * Reset tracking state (useful for logout).
 * Clears the current user identity and generates a new anonymous ID.
 */
export function reset(): void {
    trackLog('reset');
    resetMixpanel();
}

// ============================================================================
// LEGACY SEND EVENT FUNCTION
// ============================================================================

/**
 * @deprecated Use dineoutTrack instead
 * Sends an event to all the added integrations via this package.
 */
export const sendDineoutEvent: TrackingEventFunction = (event, data) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};

// ============================================================================
// API
// ============================================================================

const BASE_API_URL = () => {
    try {
        const isDev =
            // @ts-ignore
            (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
            (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

            console.log('isDev', isDev);

        if (isDev) {
            console.info("[Tracking]", "Running in development mode");
            return "http://localhost:9876";
        }

        return "https://api.dineout.is";
    } catch {
        return "https://api.dineout.is";
    }
};

async function fetchTrackingConfig(companyIdentifier: string): Promise<TrackingConfig> {
    const res = await fetch(`${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`);
    if (!res.ok) return {};
    return res.json();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DineoutTracking({ companyIdentifier, platform, userId }: DineoutTrackingProps) {
    const [init, setInit] = useState(false);

    useEffect(() => {
        if (init) return;
        if (companyIdentifier?.length > 0) {
            setInit(true);
            fetchTrackingConfig(companyIdentifier).then((config) => {
                trackLog('Clearing integrations');
                clearIntegrations();

                // Initialize Google integrations
                config.gaTrackingId?.split(',').map(id => id.trim()).forEach(initGA4);
                config.gTagId?.split(',').map(id => id.trim()).forEach(initGTM);

                // Initialize Facebook Pixel
                config.fbPixelId?.split(',').map(id => id.trim()).forEach(initFacebookPixel);

                // Initialize Mixpanel if token is present
                if (config.mixpanelToken && config.companyId) {
                    const resolvedPlatform = platform ?? detectPlatform();
                    initMixpanel({
                        token: config.mixpanelToken,
                        companyId: config.companyId,
                        platform: resolvedPlatform,
                        userId,
                    });
                }
            });
        }
        
        // Expose functions globally
        window.dineoutTrack = dineoutTrack;
        window.sendDineoutEvent = sendDineoutEvent;
    }, [init, companyIdentifier, platform, userId]);

    return null;
}
