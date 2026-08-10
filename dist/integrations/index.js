// ============================================================================
// INTEGRATIONS INDEX - Re-export all integrations
// ============================================================================
export { TrackingValidationError, validateEventPayload, isTakeawayEvent, toGA4Event, toGTMEvent, toMetaEvent, toMixpanelEvent, adaptEvent, } from './adapters.js';
export { trackLog, currentVersion, verbose, detectPlatform, 
// Event mapping
EVENT_MAP, mapEventName, 
// Legacy
DO_TRACKING_INTEGRATIONS, clearIntegrations, addIntegration, injectScriptOnce, mapFacebookToGA4, } from './types.js';
// Facebook Pixel
export { initFacebookPixel, setActiveFacebookPixelIds, getActiveFacebookPixelIds, trackToFBPixel, isFBPixelInitialized, } from './facebook.js';
// Google Analytics & GTM
export { initGA4, initGTM, setActiveGA4MeasurementIds, setActiveGTMContainerIds, getActiveGA4MeasurementIds, getActiveGTMContainerIds, trackToGA4, trackToGTM, isGA4Initialized, isGTMInitialized, } from './google.js';
export { initMixpanel, trackToMixpanel, trackBookingEvent, identifyUser, trackMixpanelEvent, resetMixpanel, isMixpanelInitialized, getCurrentPlatform, getCurrentCompanyId, } from './mixpanel.js';
//# sourceMappingURL=index.js.map