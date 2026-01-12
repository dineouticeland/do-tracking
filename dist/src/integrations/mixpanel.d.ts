import { Platform, TrackableEvent, TrackableEventMap } from './types.js';
/** @deprecated Use TrackableEvent from types instead */
export type BookingFunnelEvent = TrackableEvent;
export type InitMixpanelOptions = {
    token: string;
    companyId: string;
    platform: Platform;
    userId?: string;
};
export declare function initMixpanel({ token, companyId, platform, userId }: InitMixpanelOptions): void;
/**
 * Send an event directly to Mixpanel with the descriptive event name
 */
export declare function trackToMixpanel(eventName: string, properties?: Record<string, any>): void;
/**
 * @deprecated Use dineoutTrack instead
 * Track a booking funnel event (Mixpanel-only).
 * Events are strictly typed to ensure consistent naming across the codebase.
 * Super properties (companyId, platform) are automatically included.
 */
export declare function trackBookingEvent<T extends TrackableEvent['event']>(event: T, ...args: TrackableEventMap[T] extends undefined ? [] : [payload: TrackableEventMap[T]]): void;
/**
 * Identify a user in Mixpanel.
 * Call this after the user enters their contact info or logs in.
 * @param userId - Unique identifier for the user (e.g., phone, email, or user ID)
 */
export declare function identifyUser(userId: string): void;
/**
 * Track a custom Mixpanel event (for creating other funnels beyond checkout).
 * Use trackBookingEvent for checkout funnel events instead.
 * @param eventName - Name of the custom event
 * @param properties - Optional properties to include with the event
 */
export declare function trackMixpanelEvent(eventName: string, properties?: Record<string, any>): void;
/**
 * Reset Mixpanel state (useful for logout).
 * Clears the current user identity and generates a new anonymous ID.
 */
export declare function resetMixpanel(): void;
/**
 * Check if Mixpanel is initialized
 */
export declare function isMixpanelInitialized(): boolean;
/**
 * Get current platform
 */
export declare function getCurrentPlatform(): Platform;
/**
 * Get current company ID
 */
export declare function getCurrentCompanyId(): string | null;
//# sourceMappingURL=mixpanel.d.ts.map