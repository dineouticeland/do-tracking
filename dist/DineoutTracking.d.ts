import type { DineoutDiscoveryEvent, DineoutDiscoveryEventMap, DineoutReservationEvent, DineoutReservationEventMap, DineoutTakeawayEvent, DineoutTakeawayEventMap, Platform, SinnaBookingEvent, SinnaBookingEventMap, TrackableEvent, TrackableEventMap, TrackingEventFunction, TrackingProperties } from './integrations/index.js';
export type { DineoutDiscoveryEvent, DineoutDiscoveryEventMap, DineoutReservationEvent, DineoutReservationEventMap, DineoutTakeawayEvent, DineoutTakeawayEventMap, Platform, SinnaBookingEvent, SinnaBookingEventMap, TakeawayCommercePayload, TakeawayFulfillmentType, TakeawayGiftCardAppliedPayload, TakeawayGiftCardRejectedPayload, TakeawayItem, TakeawayOrderCompletedPayload, TakeawayPaymentFailedPayload, TakeawayPaymentFailureCode, TakeawayPaymentSubmittedPayload, TakeawayPaymentSucceededPayload, TakeawayPromoAppliedPayload, TakeawayPromoRejectedPayload, TakeawayRejectionReasonCode, TrackableEvent, TrackableEventMap, } from './integrations/index.js';
export type CompanyTrackingMode = 'auto' | 'direct' | 'gtm' | 'both';
export type DineoutTrackingProps = {
    /** If omitted, only platform-owned destinations are activated. */
    companyIdentifier?: string;
    platform?: Platform;
    /** A stable internal identifier. Do not pass an email address or phone number. */
    userId?: string;
    /**
     * Optional company-delivery override. By default, every configured company
     * destination is active: GA4/Meta are direct and GTM receives data-layer events.
     */
    companyTrackingMode?: CompanyTrackingMode;
    /**
     * When true, direct GA4 events and page views carry `debug_mode: true` so
     * they appear in GA4 DebugView. Intended for local/QA diagnosis — leave it
     * off (the default) in production. Only affects direct GA4 sends; GTM,
     * Meta, and Mixpanel payloads are unchanged.
     */
    debug?: boolean;
};
type QueuedEvent = {
    event: string;
    properties?: TrackingProperties;
    timestamp: number;
    configurationKey?: string;
    configurationGeneration?: number;
};
/** Check whether a configuration is active and events can be dispatched. */
export declare function isInitialized(): boolean;
/** Return a copy of events waiting for the current configuration request. */
export declare function getEventQueue(): QueuedEvent[];
declare global {
    interface Window {
        trackSinna?: typeof trackSinna;
        trackDineout?: typeof trackDineout;
        trackDineoutDiscovery?: typeof trackDineoutDiscovery;
        trackTakeaway?: typeof trackTakeaway;
        trackPageView?: typeof trackPageView;
        /** @deprecated Use a domain-specific tracking function instead. */
        sendDineoutEvent?: TrackingEventFunction;
    }
}
/** Track a Sinna service-booking event. Sinna event semantics are unchanged in v2. */
export declare function trackSinna<T extends SinnaBookingEvent['event']>(event: T, ...args: SinnaBookingEventMap[T] extends undefined ? [] : [properties: SinnaBookingEventMap[T]]): void;
/** Track a Dineout reservation event, including Lead and deposit Purchase events. */
export declare function trackDineout<T extends DineoutReservationEvent['event']>(event: T, ...args: DineoutReservationEventMap[T] extends undefined ? [] : [properties: DineoutReservationEventMap[T]]): void;
/** Track a Dineout discovery or reservation-selection event. */
export declare function trackDineoutDiscovery<T extends DineoutDiscoveryEvent['event']>(event: T, ...args: DineoutDiscoveryEventMap[T] extends undefined ? [] : [properties: DineoutDiscoveryEventMap[T]]): void;
/** Track a validated takeaway menu, cart, checkout, payment, or order event. */
export declare function trackTakeaway<T extends DineoutTakeawayEvent['event']>(event: T, ...args: DineoutTakeawayEventMap[T] extends undefined ? [] : [properties: DineoutTakeawayEventMap[T]]): void;
/** @deprecated Prefer the domain-specific typed tracking functions. */
export declare function dineoutTrack<T extends TrackableEvent['event']>(event: T, ...args: TrackableEventMap[T] extends undefined ? [] : [properties: TrackableEventMap[T]]): void;
/**
 * @deprecated Prefer trackTakeaway, trackDineout, trackDineoutDiscovery, or
 * trackSinna. This compatibility API now enters the unified dispatcher once.
 */
export declare const sendDineoutEvent: TrackingEventFunction;
/** Identify a user in Mixpanel with a stable, non-PII internal identifier. */
export declare function identifyUser(userId: string): void;
/** Reset Mixpanel identity state, for example after logout. */
export declare function reset(): void;
/** Track one manual page view per currently active destination. */
export declare function trackPageView(url: string, title?: string): void;
export declare function DineoutTracking({ companyIdentifier, platform, userId, companyTrackingMode, debug, }: DineoutTrackingProps): null;
/** Reset module-level orchestration state between jsdom test cases. */
export declare function __resetTrackingForTests(): void;
//# sourceMappingURL=DineoutTracking.d.ts.map