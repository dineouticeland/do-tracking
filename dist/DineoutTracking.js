'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useEffect, useState, useRef } from "react";
import { trackLog, detectPlatform, clearIntegrations, DO_TRACKING_INTEGRATIONS, mapEventName, initFacebookPixel, initGA4, initGTM, initMixpanel, trackToMixpanel, trackToGA4, trackToGTM, trackToFBPixel, identifyUser as identifyMixpanelUser, resetMixpanel, } from './integrations/index.js';
let eventQueue = [];
let isTrackingInitialized = false;
/**
 * Check if tracking has been initialized
 */
export function isInitialized() {
    return isTrackingInitialized;
}
/**
 * Get the current event queue (for debugging)
 */
export function getEventQueue() {
    return [...eventQueue];
}
/**
 * Flush all queued events (called after initialization)
 */
function flushEventQueue() {
    if (eventQueue.length === 0)
        return;
    trackLog(`Flushing ${eventQueue.length} queued events`);
    const eventsToFlush = [...eventQueue];
    eventQueue = [];
    eventsToFlush.forEach(({ event, properties }) => {
        if (event === '__pageview__') {
            // Handle queued pageview
            trackPageView((properties === null || properties === void 0 ? void 0 : properties.url) || '/', properties === null || properties === void 0 ? void 0 : properties.title);
        }
        else {
            sendEventToAllPlatforms(event, properties);
        }
    });
}
/**
 * Send event to all platforms (internal, no queueing)
 */
function sendEventToAllPlatforms(event, properties) {
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
// INTERNAL TRACKING FUNCTIONS
// ============================================================================
/**
 * Internal function to send event to all platforms (or queue if not initialized)
 */
function internalTrack(event, properties) {
    // Handle Custom events - use eventName as the actual event name
    let actualEvent = event;
    let actualProperties = properties;
    if (event === 'Custom' && (properties === null || properties === void 0 ? void 0 : properties.eventName)) {
        actualEvent = properties.eventName;
        // Remove eventName from properties sent to platforms
        const { eventName } = properties, rest = __rest(properties, ["eventName"]);
        actualProperties = rest;
    }
    trackLog(`track: ${actualEvent}`);
    if (!isTrackingInitialized) {
        // Queue the event for later
        trackLog(`Queueing event (tracking not initialized): ${actualEvent}`);
        eventQueue.push({
            event: actualEvent,
            properties: actualProperties,
            timestamp: Date.now(),
        });
        return;
    }
    sendEventToAllPlatforms(actualEvent, actualProperties);
}
// ============================================================================
// SINNA SERVICE BOOKING TRACKING (book.sinna.is)
// ============================================================================
/**
 * Track a Sinna service booking event across all platforms.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
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
// DINEOUT RESERVATION TRACKING (booking.dineout.is checkout)
// ============================================================================
/**
 * Track a Dineout restaurant reservation checkout event across all platforms.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
 *
 * @example
 * trackDineout('Reservation Checkout Loaded', { restaurant_id: 'rest-1', dateTime: '2026-01-15T19:00', guests: 4 });
 * trackDineout('Reservation Completed', { reservation_id: 'res-456', payment_required: false });
 */
export function trackDineout(event, ...args) {
    const properties = args[0];
    internalTrack(event, properties);
}
// ============================================================================
// DINEOUT DISCOVERY TRACKING (dineout.is frontpage & book-a-table)
// ============================================================================
/**
 * Track a Dineout discovery/navigation event across all platforms.
 * Use this for frontpage interactions, search, book-a-table, and reservation selection events.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
 *
 * @example
 * trackDineoutDiscovery('Restaurant Clicked', { restaurant_id: 'rest-1', source: 'frontpage' });
 * trackDineoutDiscovery('Search Opened');
 * trackDineoutDiscovery('Reservation Flow Started', { company_id: 'comp-1' });
 */
export function trackDineoutDiscovery(event, ...args) {
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
// PAGEVIEW TRACKING
// ============================================================================
/**
 * Track a pageview across all platforms.
 * Call this on route changes in SPA applications (e.g., Next.js).
 *
 * @param url - The URL/path of the page (e.g., '/restaurants/pizza-place')
 * @param title - Optional page title
 *
 * @example
 * // In Next.js App Router
 * useEffect(() => {
 *   trackPageView(window.location.pathname);
 * }, [pathname]);
 *
 * @example
 * // In Next.js Pages Router
 * router.events.on('routeChangeComplete', (url) => {
 *   trackPageView(url);
 * });
 */
export function trackPageView(url, title) {
    trackLog(`pageview: ${url}`);
    if (!isTrackingInitialized) {
        trackLog('Queueing pageview (tracking not initialized)');
        eventQueue.push({
            event: '__pageview__',
            properties: { url, title },
            timestamp: Date.now(),
        });
        return;
    }
    // GA4 - send page_view event
    if (window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: url,
            page_title: title,
        });
    }
    // GTM - push to dataLayer
    if (window.dataLayer) {
        window.dataLayer.push({
            event: 'page_view',
            page_path: url,
            page_title: title,
        });
    }
    // Facebook Pixel - track PageView
    if (window.fbq) {
        window.fbq('track', 'PageView');
    }
    // Mixpanel - track page view (if not using auto track_pageview)
    trackToMixpanel('Page Viewed', { url, title });
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
    const url = companyIdentifier
        ? `${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`
        : `${BASE_API_URL()}/api/web/tracking`;
    const res = await fetch(url);
    if (!res.ok)
        return {};
    return res.json();
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================
// Track current company to detect changes
let currentCompanyIdentifier = undefined;
export function DineoutTracking({ companyIdentifier, platform, userId }) {
    const [initKey, setInitKey] = useState(undefined);
    const requestIdRef = useRef(0);
    useEffect(() => {
        // Skip if already initialized with the same companyIdentifier
        if (initKey === (companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : '__dineout_only__'))
            return;
        const newInitKey = companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : '__dineout_only__';
        setInitKey(newInitKey);
        // Increment request ID to track the latest request
        const thisRequestId = ++requestIdRef.current;
        fetchTrackingConfig(companyIdentifier).then((config) => {
            var _a, _b, _c, _d, _e, _f, _g;
            // Ignore stale responses - only process the latest request
            if (thisRequestId !== requestIdRef.current) {
                trackLog(`Ignoring stale response for ${companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : 'dineout-only'} (request ${thisRequestId}, current ${requestIdRef.current})`);
                return;
            }
            // Only clear integrations if this is a NEW restaurant (not just re-init)
            if (currentCompanyIdentifier !== companyIdentifier) {
                trackLog(`Switching from ${currentCompanyIdentifier !== null && currentCompanyIdentifier !== void 0 ? currentCompanyIdentifier : 'none'} to ${companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : 'dineout-only'}`);
                clearIntegrations();
                currentCompanyIdentifier = companyIdentifier;
            }
            const resolvedPlatform = platform !== null && platform !== void 0 ? platform : detectPlatform();
            if (resolvedPlatform === 'dineout') {
                (_a = config.dineoutGaTrackingId) === null || _a === void 0 ? void 0 : _a.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Dineout GA4: ${id}`);
                    initGA4(id);
                });
                (_b = config.dineoutFbPixelId) === null || _b === void 0 ? void 0 : _b.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Dineout FB Pixel: ${id}`);
                    initFacebookPixel(id);
                });
            }
            else if (resolvedPlatform === 'sinna') {
                (_c = config.sinnaGaTrackingId) === null || _c === void 0 ? void 0 : _c.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Sinna GA4: ${id}`);
                    initGA4(id);
                });
                (_d = config.sinnaFbPixelId) === null || _d === void 0 ? void 0 : _d.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Sinna FB Pixel: ${id}`);
                    initFacebookPixel(id);
                });
            }
            // ---------------------------------------------------------------
            // Restaurant-specific tracking (events also go to restaurant's accounts)
            // Only if companyIdentifier is provided
            // ---------------------------------------------------------------
            if (companyIdentifier) {
                (_e = config.gaTrackingId) === null || _e === void 0 ? void 0 : _e.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Restaurant GA4: ${id}`);
                    initGA4(id);
                });
                (_f = config.gTagId) === null || _f === void 0 ? void 0 : _f.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Restaurant GTM: ${id}`);
                    initGTM(id);
                });
                (_g = config.fbPixelId) === null || _g === void 0 ? void 0 : _g.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Restaurant FB Pixel: ${id}`);
                    initFacebookPixel(id);
                });
            }
            // ---------------------------------------------------------------
            // Mixpanel (Dineout funnel analytics)
            // ---------------------------------------------------------------
            if (config.dineoutMixpanelToken && config.companyId) {
                initMixpanel({
                    token: config.dineoutMixpanelToken,
                    companyId: config.companyId,
                    platform: resolvedPlatform,
                    userId,
                });
            }
            // Mark as initialized and flush queued events
            isTrackingInitialized = true;
            trackLog(`Tracking initialized (company: ${companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : 'dineout-only'})`);
            flushEventQueue();
        });
        // Expose functions globally
        window.trackSinna = trackSinna;
        window.trackDineout = trackDineout;
        window.trackDineoutDiscovery = trackDineoutDiscovery;
        window.trackPageView = trackPageView;
        window.sendDineoutEvent = sendDineoutEvent;
    }, [companyIdentifier, platform, userId]);
    return null;
}
//# sourceMappingURL=DineoutTracking.js.map