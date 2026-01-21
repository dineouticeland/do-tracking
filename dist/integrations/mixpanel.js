// ============================================================================
// MIXPANEL INTEGRATION
// ============================================================================
import mixpanel from 'mixpanel-browser';
import { trackLog, verbose } from './types.js';
// ============================================================================
// MIXPANEL STATE
// ============================================================================
let mixpanelInitialized = false;
let currentPlatform = 'dineout';
let currentCompanyId = null;
export function initMixpanel({ token, companyId, platform, userId }) {
    if (mixpanelInitialized) {
        trackLog('Mixpanel already initialized, updating super properties');
        mixpanel.register({
            companyId,
            platform,
        });
        if (userId) {
            mixpanel.identify(userId);
        }
        return;
    }
    mixpanel.init(token, {
        debug: verbose,
        track_pageview: false,
        autocapture: false, //if we want to capture everything
        record_sessions_percent: 0, //100 for development, 0 for development
        persistence: 'cookie',
        api_host: 'https://api-eu.mixpanel.com',
        cross_subdomain_cookie: true, // Share distinct_id across *.dineout.is subdomains
    });
    // Register super properties that will be sent with every event
    mixpanel.register({
        companyId,
        platform,
    });
    // Store for use by exported functions
    currentPlatform = platform;
    currentCompanyId = companyId;
    // Identify user if provided
    if (userId) {
        mixpanel.identify(userId);
        trackLog(`Mixpanel identified user: ${userId}`);
    }
    mixpanelInitialized = true;
    trackLog(`Added Mixpanel with token: ${token.substring(0, 8)}... companyId: ${companyId}, platform: ${platform}`);
}
// ============================================================================
// DIRECT TRACKING (for unified dineoutTrack)
// ============================================================================
/**
 * Send an event directly to Mixpanel with the descriptive event name
 */
export function trackToMixpanel(eventName, properties) {
    if (!mixpanelInitialized) {
        return;
    }
    trackLog(`Sending to Mixpanel: ${eventName}`);
    mixpanel.track(eventName, properties !== null && properties !== void 0 ? properties : {});
}
// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================
/**
 * @deprecated Use dineoutTrack instead
 * Track a booking funnel event (Mixpanel-only).
 * Events are strictly typed to ensure consistent naming across the codebase.
 * Super properties (companyId, platform) are automatically included.
 */
export function trackBookingEvent(event, ...args) {
    if (!mixpanelInitialized) {
        trackLog(`Mixpanel not initialized, skipping event: ${event}`);
        return;
    }
    const payload = args[0];
    trackLog(`Sending booking event to Mixpanel: ${event}`);
    mixpanel.track(event, payload !== null && payload !== void 0 ? payload : {});
}
/**
 * Identify a user in Mixpanel.
 * Call this after the user enters their contact info or logs in.
 * @param userId - Unique identifier for the user (e.g., phone, email, or user ID)
 */
export function identifyUser(userId) {
    if (!mixpanelInitialized) {
        trackLog(`Mixpanel not initialized, skipping identify: ${userId}`);
        return;
    }
    mixpanel.identify(userId);
    trackLog(`Mixpanel identified user: ${userId}`);
}
/**
 * Track a custom Mixpanel event (for creating other funnels beyond checkout).
 * Use trackBookingEvent for checkout funnel events instead.
 * @param eventName - Name of the custom event
 * @param properties - Optional properties to include with the event
 */
export function trackMixpanelEvent(eventName, properties) {
    if (!mixpanelInitialized) {
        trackLog(`Mixpanel not initialized, skipping event: ${eventName}`);
        return;
    }
    trackLog(`Sending custom event to Mixpanel: ${eventName}`);
    mixpanel.track(eventName, properties !== null && properties !== void 0 ? properties : {});
}
/**
 * Reset Mixpanel state (useful for logout).
 * Clears the current user identity and generates a new anonymous ID.
 */
export function resetMixpanel() {
    if (!mixpanelInitialized) {
        return;
    }
    mixpanel.reset();
    trackLog('Mixpanel reset');
}
/**
 * Check if Mixpanel is initialized
 */
export function isMixpanelInitialized() {
    return mixpanelInitialized;
}
/**
 * Get current platform
 */
export function getCurrentPlatform() {
    return currentPlatform;
}
/**
 * Get current company ID
 */
export function getCurrentCompanyId() {
    return currentCompanyId;
}
//# sourceMappingURL=mixpanel.js.map