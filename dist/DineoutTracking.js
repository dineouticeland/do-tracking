'use client';
import { useEffect, useState } from "react";
import { trackLog, detectPlatform, clearIntegrations, DO_TRACKING_INTEGRATIONS, mapEventName, initFacebookPixel, initGA4, initGTM, initMixpanel, trackToMixpanel, trackToGA4, trackToGTM, trackToFBPixel, identifyUser as identifyMixpanelUser, resetMixpanel, } from './integrations';
// ============================================================================
// INTERNAL TRACKING FUNCTIONS
// ============================================================================
/**
 * Internal function to send event to all platforms
 */
function internalTrack(event, properties) {
    trackLog(`track: ${event}`);
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
// SINNA SERVICE BOOKING TRACKING (book.sinna.is)
// ============================================================================
/**
 * Track a Sinna service booking event across all platforms.
 *
 * @example
 * trackSinna('Booking Flow Started');
 * trackSinna('Service Selected', { serviceId: 'svc-1', serviceName: 'Haircut', price: 4500 });
 * trackSinna('Booking Completed', { bookingId: 'b-123', totalAmount: 4500, currency: 'ISK' });
 */
export function trackSinna(event, ...args) {
    const properties = args[0];
    internalTrack(event, properties);
}
// ============================================================================
// DINEOUT RESERVATION TRACKING (dineout.is -> booking.dineout.is)
// ============================================================================
/**
 * Track a Dineout restaurant reservation event across all platforms.
 * All events require a flow_id to connect events across domains.
 *
 * @example
 * trackDineout('Reservation Flow Started', { flow_id: 'abc123', company_id: 'rest-1' });
 * trackDineout('Reservation Time Selected', { flow_id: 'abc123', dateTime: '2026-01-15T19:00', guests: 4 });
 * trackDineout('Reservation Completed', { flow_id: 'abc123', reservation_id: 'res-456', payment_required: false });
 */
export function trackDineout(event, ...args) {
    const properties = args[0];
    internalTrack(event, properties);
}
// ============================================================================
// USER FUNCTIONS
// ============================================================================
/**
 * Identify a user for tracking.
 * Call this after the user enters their contact info or logs in.
 * @param userId - Unique identifier for the user (e.g., phone, email, or user ID)
 */
export function identifyUser(userId) {
    trackLog(`identifyUser: ${userId}`);
    identifyMixpanelUser(userId);
}
/**
 * Reset tracking state (useful for logout).
 * Clears the current user identity and generates a new anonymous ID.
 */
export function reset() {
    trackLog('reset');
    resetMixpanel();
}
// ============================================================================
// LEGACY FUNCTIONS (deprecated)
// ============================================================================
/**
 * @deprecated Use trackSinna or trackDineout instead
 * Generic tracking function that accepts any event type.
 */
export function dineoutTrack(event, ...args) {
    const properties = args[0];
    internalTrack(event, properties);
}
/**
 * @deprecated Use trackSinna or trackDineout instead
 * Sends an event to all the added integrations via this package.
 */
export const sendDineoutEvent = (event, data) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};
// ============================================================================
// API
// ============================================================================
const BASE_API_URL = () => {
    var _a, _b;
    try {
        const isDev = 
        // @ts-ignore
        (typeof import.meta !== "undefined" && ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV)) ||
            (typeof process !== "undefined" && ((_b = process.env) === null || _b === void 0 ? void 0 : _b.NODE_ENV) !== "production");
        console.log('isDev', isDev);
        if (isDev) {
            console.info("[Tracking]", "Running in development mode");
            return "http://localhost:9876";
        }
        return "https://api.dineout.is";
    }
    catch (_c) {
        return "https://api.dineout.is";
    }
};
async function fetchTrackingConfig(companyIdentifier) {
    const res = await fetch(`${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`);
    if (!res.ok)
        return {};
    return res.json();
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function DineoutTracking({ companyIdentifier, platform, userId }) {
    const [init, setInit] = useState(false);
    useEffect(() => {
        if (init)
            return;
        if ((companyIdentifier === null || companyIdentifier === void 0 ? void 0 : companyIdentifier.length) > 0) {
            setInit(true);
            fetchTrackingConfig(companyIdentifier).then((config) => {
                var _a, _b, _c;
                trackLog('Clearing integrations');
                clearIntegrations();
                // Initialize Google integrations
                (_a = config.gaTrackingId) === null || _a === void 0 ? void 0 : _a.split(',').map(id => id.trim()).forEach(initGA4);
                (_b = config.gTagId) === null || _b === void 0 ? void 0 : _b.split(',').map(id => id.trim()).forEach(initGTM);
                // Initialize Facebook Pixel
                (_c = config.fbPixelId) === null || _c === void 0 ? void 0 : _c.split(',').map(id => id.trim()).forEach(initFacebookPixel);
                // Initialize Mixpanel if token is present
                if (config.mixpanelToken && config.companyId) {
                    const resolvedPlatform = platform !== null && platform !== void 0 ? platform : detectPlatform();
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
        window.trackSinna = trackSinna;
        window.trackDineout = trackDineout;
        window.sendDineoutEvent = sendDineoutEvent;
    }, [init, companyIdentifier, platform, userId]);
    return null;
}
//# sourceMappingURL=DineoutTracking.js.map