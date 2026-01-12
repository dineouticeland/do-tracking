export type { Platform, TrackingConfig, BaseTrackEvent, SinnaBookingEvent, SinnaBookingEventMap, DineoutReservationEvent, DineoutReservationEventMap, DineoutDiscoveryEvent, DineoutDiscoveryEventMap, TrackableEvent, TrackableEventMap, EventMapping, TrackMethod, EventMap, TrackingEventFunction, } from './types.js';
export { trackLog, currentVersion, verbose, detectPlatform, EVENT_MAP, mapEventName, DO_TRACKING_INTEGRATIONS, clearIntegrations, addIntegration, injectScriptOnce, mapFacebookToGA4, } from './types.js';
export { initFacebookPixel, trackToFBPixel, isFBPixelInitialized, } from './facebook.js';
export { initGA4, initGTM, trackToGA4, trackToGTM, isGA4Initialized, isGTMInitialized, } from './google.js';
export type { BookingFunnelEvent, InitMixpanelOptions } from './mixpanel.js';
export { initMixpanel, trackToMixpanel, trackBookingEvent, identifyUser, trackMixpanelEvent, resetMixpanel, isMixpanelInitialized, getCurrentPlatform, getCurrentCompanyId, } from './mixpanel.js';
//# sourceMappingURL=index.d.ts.map