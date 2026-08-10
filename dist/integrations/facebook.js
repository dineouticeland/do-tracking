// ============================================================================
// FACEBOOK PIXEL INTEGRATION
// ============================================================================
import { injectScriptOnce, trackLog } from './types.js';
const initializedPixelIds = new Set();
const activePixelIds = new Set();
function normalizeIds(ids) {
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}
function ensurePixelRuntime() {
    if (!window.fbq || !window.fbq.loaded) {
        const fbq = function () {
            if (fbq.callMethod) {
                fbq.callMethod.apply(null, arguments);
            }
            else {
                (fbq.queue = fbq.queue || []).push(arguments);
            }
        };
        fbq.version = '2.0';
        fbq.loaded = true;
        fbq.queue = [];
        window.fbq = fbq;
    }
    const hasPixelRuntime = Array.from(document.scripts).some((script) => script.src.includes('connect.facebook.net') && script.src.includes('fbevents.js'));
    if (!hasPixelRuntime) {
        injectScriptOnce('https://connect.facebook.net/en_US/fbevents.js');
    }
}
export function initFacebookPixel(pixelId) {
    const id = pixelId.trim();
    if (!id)
        return;
    ensurePixelRuntime();
    activePixelIds.add(id);
    if (initializedPixelIds.has(id))
        return;
    window.fbq('init', id);
    initializedPixelIds.add(id);
    trackLog(`Added Facebook Pixel with Id: ${id}`);
}
export function setActiveFacebookPixelIds(ids) {
    activePixelIds.clear();
    normalizeIds(ids).forEach((id) => activePixelIds.add(id));
}
export function getActiveFacebookPixelIds() {
    return [...activePixelIds];
}
export function trackToFBPixel(eventName, isCustom, properties, eventID, targetIds = [...activePixelIds]) {
    if (!window.fbq)
        return [];
    const method = isCustom ? 'trackSingleCustom' : 'trackSingle';
    const options = eventID ? { eventID } : undefined;
    const delivered = [];
    normalizeIds(targetIds).forEach((id) => {
        if (!activePixelIds.has(id) || !initializedPixelIds.has(id))
            return;
        try {
            trackLog(`Sending ${isCustom ? 'custom ' : ''}event to Pixel ${id}: ${eventName}`);
            if (options) {
                window.fbq(method, id, eventName, properties, options);
            }
            else {
                window.fbq(method, id, eventName, properties);
            }
            delivered.push(id);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            trackLog(`Could not send ${eventName} to Pixel ${id}: ${message}`);
        }
    });
    return delivered;
}
export function isFBPixelInitialized() {
    return initializedPixelIds.size > 0;
}
/** Internal test helper; not re-exported from the package root. */
export function __resetFacebookForTests() {
    initializedPixelIds.clear();
    activePixelIds.clear();
}
//# sourceMappingURL=facebook.js.map