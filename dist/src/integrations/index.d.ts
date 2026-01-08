export type { Platform, TrackingConfig, BaseTrackEvent, SinnaBookingEvent, SinnaBookingEventMap, DineoutReservationEvent, DineoutReservationEventMap, TrackableEvent, TrackableEventMap, EventMapping, TrackMethod, EventMap, TrackingEventFunction, } from './types';
export { trackLog, currentVersion, verbose, detectPlatform, EVENT_MAP, mapEventName, DO_TRACKING_INTEGRATIONS, clearIntegrations, addIntegration, injectScriptOnce, mapFacebookToGA4, } from './types';
export { initFacebookPixel, trackToFBPixel, isFBPixelInitialized, } from './facebook';
export { initGA4, initGTM, trackToGA4, trackToGTM, isGA4Initialized, isGTMInitialized, } from './google';
export type { BookingFunnelEvent, InitMixpanelOptions } from './mixpanel';
export { initMixpanel, trackToMixpanel, trackBookingEvent, identifyUser, trackMixpanelEvent, resetMixpanel, isMixpanelInitialized, getCurrentPlatform, getCurrentCompanyId, } from './mixpanel';
//# sourceMappingURL=index.d.ts.map