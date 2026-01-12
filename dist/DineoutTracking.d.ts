import { Platform, TrackingEventFunction, TrackableEvent, TrackableEventMap, SinnaBookingEvent, SinnaBookingEventMap, DineoutReservationEvent, DineoutReservationEventMap, DineoutDiscoveryEvent, DineoutDiscoveryEventMap } from './integrations/index.js';
export type { Platform, TrackableEvent, SinnaBookingEvent, DineoutReservationEvent, DineoutDiscoveryEvent, } from './integrations/index.js';
export type DineoutTrackingProps = {
    companyIdentifier?: string;
    platform?: Platform;
    userId?: string;
};
type QueuedEvent = {
    event: string;
    properties?: Record<string, any>;
    timestamp: number;
};
/**
 * Check if tracking has been initialized
 */
export declare function isInitialized(): boolean;
/**
 * Get the current event queue (for debugging)
 */
export declare function getEventQueue(): QueuedEvent[];
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
/**
 * Track a Sinna service booking event across all platforms.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
 *
 * @example
 * trackSinna('Booking Flow Started');
 * trackSinna('Service Selected', { serviceId: 'svc-1', serviceName: 'Haircut', price: 4500 });
 * trackSinna('Booking Completed', { bookingId: 'b-123', totalAmount: 4500, currency: 'ISK' });
 */
export declare function trackSinna<T extends SinnaBookingEvent['event']>(event: T, ...args: SinnaBookingEventMap[T] extends undefined ? [] : [properties: SinnaBookingEventMap[T]]): void;
/**
 * Track a Dineout restaurant reservation checkout event across all platforms.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
 *
 * @example
 * trackDineout('Reservation Checkout Loaded', { restaurant_id: 'rest-1', dateTime: '2026-01-15T19:00', guests: 4 });
 * trackDineout('Reservation Completed', { reservation_id: 'res-456', payment_required: false });
 */
export declare function trackDineout<T extends DineoutReservationEvent['event']>(event: T, ...args: DineoutReservationEventMap[T] extends undefined ? [] : [properties: DineoutReservationEventMap[T]]): void;
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
export declare function trackDineoutDiscovery<T extends DineoutDiscoveryEvent['event']>(event: T, ...args: DineoutDiscoveryEventMap[T] extends undefined ? [] : [properties: DineoutDiscoveryEventMap[T]]): void;
/**
 * Identify a user for tracking.
 * Call this after the user enters their contact info or logs in.
 * @param userId - Unique identifier for the user (e.g., phone, email, or user ID)
 */
export declare function identifyUser(userId: string): void;
/**
 * Reset tracking state (useful for logout).
 * Clears the current user identity and generates a new anonymous ID.
 */
export declare function reset(): void;
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
export declare function trackPageView(url: string, title?: string): void;
/**
 * @deprecated Use trackSinna or trackDineout instead
 * Generic tracking function that accepts any event type.
 */
export declare function dineoutTrack<T extends TrackableEvent['event']>(event: T, ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]): void;
/**
 * @deprecated Use trackSinna or trackDineout instead
 * Sends an event to all the added integrations via this package.
 */
export declare const sendDineoutEvent: TrackingEventFunction;
export declare function DineoutTracking({ companyIdentifier, platform, userId }: DineoutTrackingProps): null;
//# sourceMappingURL=DineoutTracking.d.ts.map