'use client';

import { useEffect, useState, useRef } from "react";
import {
    Platform,
    TrackingConfig,
    TrackingEventFunction,
    TrackableEvent,
    TrackableEventMap,
    SinnaBookingEvent,
    SinnaBookingEventMap,
    DineoutReservationEvent,
    DineoutReservationEventMap,
    DineoutDiscoveryEvent,
    DineoutDiscoveryEventMap,
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
} from './integrations/index.js';

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type {
    Platform,
    TrackableEvent,
    SinnaBookingEvent,
    DineoutReservationEvent,
    DineoutDiscoveryEvent,
} from './integrations/index.js';

export type DineoutTrackingProps = {
    companyIdentifier?: string;  // Optional - if not provided, only Dineout tracking is initialized
    platform?: Platform;
    userId?: string;
};

// ============================================================================
// EVENT QUEUE (for events fired before initialization)
// ============================================================================

type QueuedEvent = {
    event: string;
    properties?: Record<string, any>;
    timestamp: number;
};

let eventQueue: QueuedEvent[] = [];
let isTrackingInitialized = false;

/**
 * Check if tracking has been initialized
 */
export function isInitialized(): boolean {
    return isTrackingInitialized;
}

/**
 * Get the current event queue (for debugging)
 */
export function getEventQueue(): QueuedEvent[] {
    return [...eventQueue];
}

/**
 * Flush all queued events (called after initialization)
 */
function flushEventQueue(): void {
    if (eventQueue.length === 0) return;
    
    trackLog(`Flushing ${eventQueue.length} queued events`);
    
    const eventsToFlush = [...eventQueue];
    eventQueue = [];
    
    eventsToFlush.forEach(({ event, properties }) => {
        if (event === '__pageview__') {
            // Handle queued pageview
            trackPageView(properties?.url || '/', properties?.title);
        } else {
            sendEventToAllPlatforms(event, properties);
        }
    });
}

/**
 * Send event to all platforms (internal, no queueing)
 */
function sendEventToAllPlatforms(event: string, properties?: Record<string, any>): void {
    // Get mapped event names for GA4/FB
    const mapped = mapEventName(event as TrackableEvent['event']);
    
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
// GLOBAL WINDOW AUGMENTATION
// ============================================================================

declare global {
    interface Window {
        trackSinna?: typeof trackSinna;
        trackDineout?: typeof trackDineout;
        trackDineoutDiscovery?: typeof trackDineoutDiscovery;
        trackPageView?: typeof trackPageView;
        /** @deprecated Use trackSinna or trackDineout instead */
        sendDineoutEvent?: TrackingEventFunction;
    }
}

// ============================================================================
// INTERNAL TRACKING FUNCTIONS
// ============================================================================

/**
 * Internal function to send event to all platforms (or queue if not initialized)
 */
function internalTrack(event: string, properties?: Record<string, any>): void {
    // Handle Custom events - use eventName as the actual event name
    let actualEvent = event;
    let actualProperties = properties;
    
    if (event === 'Custom' && properties?.eventName) {
        actualEvent = properties.eventName;
        // Remove eventName from properties sent to platforms
        const { eventName, ...rest } = properties;
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
export function trackSinna<T extends SinnaBookingEvent['event']>(
    event: T,
    ...args: SinnaBookingEventMap[T] extends undefined ? [] : [properties: SinnaBookingEventMap[T]]
): void {
    const properties = args[0] as Record<string, any> | undefined;
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
export function trackDineout<T extends DineoutReservationEvent['event']>(
    event: T,
    ...args: DineoutReservationEventMap[T] extends undefined ? [] : [properties: DineoutReservationEventMap[T]]
): void {
    const properties = args[0] as Record<string, any> | undefined;
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
export function trackDineoutDiscovery<T extends DineoutDiscoveryEvent['event']>(
    event: T,
    ...args: DineoutDiscoveryEventMap[T] extends undefined ? [] : [properties: DineoutDiscoveryEventMap[T]]
): void {
    const properties = args[0] as Record<string, any> | undefined;
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
export function trackPageView(url: string, title?: string): void {
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
export function dineoutTrack<T extends TrackableEvent['event']>(
    event: T,
    ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]
): void {
    const properties = args[0] as Record<string, any> | undefined;
    internalTrack(event, properties);
}

/**
 * @deprecated Use trackSinna or trackDineout instead
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

async function fetchTrackingConfig(companyIdentifier?: string): Promise<TrackingConfig> {
    const url = companyIdentifier 
        ? `${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`
        : `${BASE_API_URL()}/api/web/tracking`;
    const res = await fetch(url);
    if (!res.ok) return {};
    return res.json();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Track current company to detect changes
let currentCompanyIdentifier: string | undefined = undefined;

export function DineoutTracking({ companyIdentifier, platform, userId }: DineoutTrackingProps) {
    const [initKey, setInitKey] = useState<string | undefined>(undefined);
    const requestIdRef = useRef(0);

    useEffect(() => {
        // Skip if already initialized with the same companyIdentifier
        if (initKey === (companyIdentifier ?? '__dineout_only__')) return;
        
        const newInitKey = companyIdentifier ?? '__dineout_only__';
        setInitKey(newInitKey);
        
        // Increment request ID to track the latest request
        const thisRequestId = ++requestIdRef.current;
        
        fetchTrackingConfig(companyIdentifier).then((config) => {
            // Ignore stale responses - only process the latest request
            if (thisRequestId !== requestIdRef.current) {
                trackLog(`Ignoring stale response for ${companyIdentifier ?? 'dineout-only'} (request ${thisRequestId}, current ${requestIdRef.current})`);
                return;
            }
            
            // Only clear integrations if this is a NEW restaurant (not just re-init)
            if (currentCompanyIdentifier !== companyIdentifier) {
                trackLog(`Switching from ${currentCompanyIdentifier ?? 'none'} to ${companyIdentifier ?? 'dineout-only'}`);
                clearIntegrations();
                currentCompanyIdentifier = companyIdentifier;
            }

            const resolvedPlatform = platform ?? detectPlatform();

            if (resolvedPlatform === 'dineout') {
                config.DineoutGATrackingId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Dineout GA4: ${id}`);
                    initGA4(id);
                });
                config.dineoutFbPixelId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Dineout FB Pixel: ${id}`);
                    initFacebookPixel(id);
                });
           
            } else if (resolvedPlatform === 'sinna') {
                config.sinnaGaTrackingId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Sinna GA4: ${id}`);
                    initGA4(id);
                });
                config.sinnaFbPixelId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Sinna FB Pixel: ${id}`);
                    initFacebookPixel(id);
                });
         
            }
                

            // ---------------------------------------------------------------
            // Restaurant-specific tracking (events also go to restaurant's accounts)
            // Only if companyIdentifier is provided
            // ---------------------------------------------------------------
            if (companyIdentifier) {
                config.gaTrackingId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Restaurant GA4: ${id}`);
                    initGA4(id);
                });
                config.gTagId?.split(',').map(id => id.trim()).forEach(id => {
                    trackLog(`Initializing Restaurant GTM: ${id}`);
                    initGTM(id);
                });
                config.fbPixelId?.split(',').map(id => id.trim()).forEach(id => {
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
            trackLog(`Tracking initialized (company: ${companyIdentifier ?? 'dineout-only'})`);
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
