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
    // Combined event type
    TrackableEvent,
    TrackableEventMap,
    EventMapping,
    // Legacy (deprecated)
    TrackMethod,
    EventMap,
    TrackingEventFunction,
} from './types.js';

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
    trackToFBPixel,
    isFBPixelInitialized,
} from './facebook.js';

// Google Analytics & GTM
export {
    initGA4,
    initGTM,
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
