import { Platform, TrackingEventFunction, TrackableEvent, TrackableEventMap, SinnaBookingEvent, SinnaBookingEventMap, DineoutReservationEvent, DineoutReservationEventMap } from './integrations/index.js';
export type { Platform, TrackableEvent, SinnaBookingEvent, DineoutReservationEvent, } from './integrations/index.js';
export type DineoutTrackingProps = {
    companyIdentifier: string;
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
 * Track a Dineout restaurant reservation event across all platforms.
 * All events require a flow_id to connect events across domains.
 * If tracking is not yet initialized, the event will be queued and sent once initialization completes.
 *
 * @example
 * trackDineout('Reservation Flow Started', { flow_id: 'abc123', company_id: 'rest-1' });
 * trackDineout('Reservation Time Selected', { flow_id: 'abc123', dateTime: '2026-01-15T19:00', guests: 4 });
 * trackDineout('Reservation Completed', { flow_id: 'abc123', reservation_id: 'res-456', payment_required: false });
 */
export declare function trackDineout<T extends DineoutReservationEvent['event']>(event: T, ...args: DineoutReservationEventMap[T] extends undefined ? [] : [properties: DineoutReservationEventMap[T]]): void;
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