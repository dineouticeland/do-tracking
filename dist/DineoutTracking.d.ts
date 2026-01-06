import { Platform, TrackingEventFunction, TrackableEvent, TrackableEventMap } from './integrations';
export type { Platform, TrackableEvent } from './integrations';
export type DineoutTrackingProps = {
    companyIdentifier: string;
    platform?: Platform;
    userId?: string;
};
type DineoutTrackFunction = <T extends TrackableEvent['event']>(event: T, ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]) => void;
declare global {
    interface Window {
        dineoutTrack?: DineoutTrackFunction;
        /** @deprecated Use dineoutTrack instead */
        sendDineoutEvent?: TrackingEventFunction;
    }
}
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
export declare function dineoutTrack<T extends TrackableEvent['event']>(event: T, ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]): void;
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
 * @deprecated Use dineoutTrack instead
 * Sends an event to all the added integrations via this package.
 */
export declare const sendDineoutEvent: TrackingEventFunction;
export declare function DineoutTracking({ companyIdentifier, platform, userId }: DineoutTrackingProps): null;
//# sourceMappingURL=DineoutTracking.d.ts.map