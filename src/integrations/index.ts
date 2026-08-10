// ============================================================================
// INTEGRATIONS INDEX - Re-export all integrations
// ============================================================================

// Types
export type {
    Platform,
    TrackingConfig,
    // Base event type
    BaseTrackEvent,
    // Sinna service booking events
    SinnaBookingEvent,
    SinnaBookingEventMap,
    // Dineout reservation events
    DineoutReservationEvent,
    DineoutReservationEventMap,
    // Dineout discovery events
    DineoutDiscoveryEvent,
    DineoutDiscoveryEventMap,
    // Dineout takeaway ecommerce events
    TakeawayItem,
    TakeawayFulfillmentType,
    TakeawayPaymentFailureCode,
    TakeawayRejectionReasonCode,
    TakeawayCommercePayload,
    TakeawayPromoAppliedPayload,
    TakeawayPromoRejectedPayload,
    TakeawayGiftCardAppliedPayload,
    TakeawayGiftCardRejectedPayload,
    TakeawayPaymentSubmittedPayload,
    TakeawayPaymentSucceededPayload,
    TakeawayPaymentFailedPayload,
    TakeawayOrderCompletedPayload,
    DineoutTakeawayEvent,
    DineoutTakeawayEventMap,
    // Combined event type
    TrackableEvent,
    TrackableEventMap,
    EventMapping,
    // Legacy (deprecated)
    TrackMethod,
    EventMap,
    TrackingEventFunction,
} from './types.js';

export type {
    TrackingProperties,
    GA4AdapterEvent,
    GTMAdapterEvent,
    MetaAdapterEvent,
    MixpanelAdapterEvent,
    ConversionDescriptor,
    AdaptedTrackingEvent,
} from './adapters.js';

export {
    TrackingValidationError,
    validateEventPayload,
    isTakeawayEvent,
    toGA4Event,
    toGTMEvent,
    toMetaEvent,
    toMixpanelEvent,
    adaptEvent,
} from './adapters.js';

export {
    trackLog,
    currentVersion,
    verbose,
    detectPlatform,
    // Event mapping
    EVENT_MAP,
    mapEventName,
    // Legacy
    DO_TRACKING_INTEGRATIONS,
    clearIntegrations,
    addIntegration,
    injectScriptOnce,
    mapFacebookToGA4,
} from './types.js';

// Facebook Pixel
export {
    initFacebookPixel,
    setActiveFacebookPixelIds,
    getActiveFacebookPixelIds,
    trackToFBPixel,
    isFBPixelInitialized,
} from './facebook.js';

// Google Analytics & GTM
export {
    initGA4,
    initGTM,
    setActiveGA4MeasurementIds,
    setActiveGTMContainerIds,
    getActiveGA4MeasurementIds,
    getActiveGTMContainerIds,
    trackToGA4,
    trackToGTM,
    isGA4Initialized,
    isGTMInitialized,
} from './google.js';

// Mixpanel
export type { BookingFunnelEvent, InitMixpanelOptions } from './mixpanel.js';
export {
    initMixpanel,
    trackToMixpanel,
    trackBookingEvent,
    identifyUser,
    trackMixpanelEvent,
    resetMixpanel,
    isMixpanelInitialized,
    getCurrentPlatform,
    getCurrentCompanyId,
} from './mixpanel.js';
