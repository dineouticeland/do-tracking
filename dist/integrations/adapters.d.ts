import type { DineoutTakeawayEvent } from './types.js';
export type TrackingProperties = Record<string, unknown>;
export type GA4AdapterEvent = {
    eventName: string;
    params: TrackingProperties;
};
/** A complete object ready to push to GTM's dataLayer. */
export type GTMAdapterEvent = {
    event: string;
    ecommerce?: TrackingProperties;
    [key: string]: unknown;
};
export type MetaAdapterEvent = {
    eventName: string;
    custom: boolean;
    params: TrackingProperties;
    /** Passed as Meta Pixel's fourth options argument: `{ eventID }`. */
    eventID?: string;
};
export type MixpanelAdapterEvent = {
    eventName: string;
    properties: TrackingProperties;
};
export type ConversionDescriptor = {
    kind: 'lead' | 'purchase';
    /** Stable logical ID used to deduplicate once per destination. */
    eventId: string;
};
export type AdaptedTrackingEvent = {
    ga4: GA4AdapterEvent;
    gtm: GTMAdapterEvent;
    meta: MetaAdapterEvent | null;
    mixpanel: MixpanelAdapterEvent;
    conversion?: ConversionDescriptor;
};
type TakeawayEventName = Exclude<DineoutTakeawayEvent['event'], 'Custom'>;
export declare class TrackingValidationError extends Error {
    readonly eventName: string;
    constructor(eventName: string, message: string);
}
/** Validate the v2 event contracts before any destination receives an event. */
export declare function validateEventPayload(eventName: string, properties?: TrackingProperties): void;
export declare function isTakeawayEvent(eventName: string): eventName is TakeawayEventName;
/** Transform a descriptive event into GA4's event/parameter contract. */
export declare function toGA4Event(eventName: string, properties?: TrackingProperties): GA4AdapterEvent;
/** Transform a descriptive event into a complete GTM dataLayer payload. */
export declare function toGTMEvent(eventName: string, properties?: TrackingProperties): GTMAdapterEvent;
/** Transform a descriptive event into a Meta Pixel event, or null when intentionally unsupported. */
export declare function toMetaEvent(eventName: string, properties?: TrackingProperties): MetaAdapterEvent | null;
/** Keep Mixpanel's readable event names while applying the same privacy-safe payload normalization. */
export declare function toMixpanelEvent(eventName: string, properties?: TrackingProperties): MixpanelAdapterEvent;
/** Build all destination payloads in one validated, side-effect-free operation. */
export declare function adaptEvent(eventName: string, properties?: TrackingProperties): AdaptedTrackingEvent;
export {};
//# sourceMappingURL=adapters.d.ts.map