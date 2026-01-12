// ============================================================================
// GOOGLE ANALYTICS (GA4) AND GTM INTEGRATION
// ============================================================================
import { trackLog, injectScriptOnce, addIntegration, mapFacebookToGA4 } from './types.js';
// ============================================================================
// STATE
// ============================================================================
let ga4Initialized = false;
let gtmInitialized = false;
// ============================================================================
// INITIALIZATION
// ============================================================================
export function initGA4(measurementId) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        injectScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
        window.gtag("js", new Date());
    }
    window.gtag("config", measurementId);
    ga4Initialized = true;
    trackLog(`Added GA4 with MeasurementId: ${measurementId}`);
    addIntegration((event, data) => {
        trackLog(`Sending event to GA4 ${event}`);
        const mapped = mapFacebookToGA4(event, data);
        window.gtag("event", mapped.event, mapped.data);
    });
}
export function initGTM(containerId) {
    injectScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    gtmInitialized = true;
    trackLog(`Added GTM with ContainerId: ${containerId}`);
    addIntegration((event, data) => {
        trackLog(`Sending event to GTM ${event}`);
        const mapped = mapFacebookToGA4(event, data);
        window.dataLayer.push({ event: mapped.event, data: mapped.data });
    });
}
// ============================================================================
// DIRECT TRACKING (for unified dineoutTrack)
// ============================================================================
/**
 * Send an event directly to GA4 with already-mapped event name
 */
export function trackToGA4(eventName, properties) {
    if (!ga4Initialized || !window.gtag) {
        return;
    }
    trackLog(`Sending to GA4: ${eventName}`);
    window.gtag("event", eventName, properties);
}
/**
 * Send an event directly to GTM with already-mapped event name
 */
export function trackToGTM(eventName, properties) {
    if (!gtmInitialized || !window.dataLayer) {
        return;
    }
    trackLog(`Sending to GTM: ${eventName}`);
    window.dataLayer.push(Object.assign({ event: eventName }, properties));
}
/**
 * Check if GA4 is initialized
 */
export function isGA4Initialized() {
    return ga4Initialized;
}
/**
 * Check if GTM is initialized
 */
export function isGTMInitialized() {
    return gtmInitialized;
}
//# sourceMappingURL=google.js.map