// ============================================================================
// GOOGLE ANALYTICS (GA4) AND GTM INTEGRATION
// ============================================================================
import { injectScriptOnce, trackLog } from './types.js';
const initializedGA4Ids = new Set();
const activeGA4Ids = new Set();
const initializedGTMTargets = new Map();
const activeGTMIds = new Set();
function normalizeIds(ids) {
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}
function ensureGoogleTag(measurementId) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
    }
    const hasGoogleTag = Array.from(document.scripts).some((script) => script.src.includes('googletagmanager.com/gtag/js'));
    if (!hasGoogleTag) {
        injectScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
    }
}
export function initGA4(measurementId) {
    const id = measurementId.trim();
    if (!id)
        return;
    ensureGoogleTag(id);
    activeGA4Ids.add(id);
    if (initializedGA4Ids.has(id))
        return;
    window.gtag('config', id, { send_page_view: false });
    initializedGA4Ids.add(id);
    trackLog(`Added GA4 with MeasurementId: ${id}`);
}
function gtmLayerName(containerId) {
    return `doTrackingGtm_${containerId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}
function getGTMLayer(containerId) {
    const layerName = initializedGTMTargets.get(containerId);
    if (!layerName)
        return undefined;
    const layer = window[layerName];
    return Array.isArray(layer) ? layer : undefined;
}
export function initGTM(containerId) {
    const id = containerId.trim();
    if (!id)
        return;
    activeGTMIds.add(id);
    if (initializedGTMTargets.has(id))
        return;
    const layerName = gtmLayerName(id);
    const existingLayer = window[layerName];
    const layer = Array.isArray(existingLayer) ? existingLayer : [];
    window[layerName] = layer;
    layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}&l=${encodeURIComponent(layerName)}`);
    initializedGTMTargets.set(id, layerName);
    trackLog(`Added GTM with ContainerId: ${id}`);
}
export function setActiveGA4MeasurementIds(ids) {
    activeGA4Ids.clear();
    normalizeIds(ids).forEach((id) => activeGA4Ids.add(id));
}
export function setActiveGTMContainerIds(ids) {
    activeGTMIds.clear();
    normalizeIds(ids).forEach((id) => activeGTMIds.add(id));
}
export function getActiveGA4MeasurementIds() {
    return [...activeGA4Ids];
}
export function getActiveGTMContainerIds() {
    return [...activeGTMIds];
}
export function trackToGA4(eventName, properties, targetIds = [...activeGA4Ids]) {
    if (!window.gtag)
        return [];
    const destinations = normalizeIds(targetIds).filter((id) => activeGA4Ids.has(id) && initializedGA4Ids.has(id));
    if (destinations.length === 0)
        return [];
    trackLog(`Sending to GA4: ${eventName}`);
    window.gtag('event', eventName, Object.assign(Object.assign({}, (properties !== null && properties !== void 0 ? properties : {})), { send_to: destinations }));
    return destinations;
}
export function trackToGTM(eventOrPayload, propertiesOrTargets, explicitTargetIds) {
    const payload = typeof eventOrPayload === 'string'
        ? Object.assign({ event: eventOrPayload }, (!Array.isArray(propertiesOrTargets) ? propertiesOrTargets : {})) : eventOrPayload;
    const targetIds = typeof eventOrPayload === 'string'
        ? (explicitTargetIds !== null && explicitTargetIds !== void 0 ? explicitTargetIds : (Array.isArray(propertiesOrTargets) ? propertiesOrTargets : [...activeGTMIds]))
        : (Array.isArray(propertiesOrTargets) ? propertiesOrTargets : [...activeGTMIds]);
    const delivered = [];
    normalizeIds(targetIds).forEach((id) => {
        var _a, _b;
        if (!activeGTMIds.has(id))
            return;
        const layer = getGTMLayer(id);
        if (!layer)
            return;
        try {
            trackLog(`Sending to GTM ${id}: ${String((_a = payload.event) !== null && _a !== void 0 ? _a : 'event')}`);
            if (Object.prototype.hasOwnProperty.call(payload, 'ecommerce')) {
                layer.push({ ecommerce: null });
            }
            layer.push(payload);
            delivered.push(id);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            trackLog(`Could not send ${String((_b = payload.event) !== null && _b !== void 0 ? _b : 'event')} to GTM ${id}: ${message}`);
        }
    });
    return delivered;
}
export function isGA4Initialized() {
    return initializedGA4Ids.size > 0;
}
export function isGTMInitialized() {
    return initializedGTMTargets.size > 0;
}
/** Internal test helper; not re-exported from the package root. */
export function __resetGoogleForTests() {
    initializedGA4Ids.clear();
    activeGA4Ids.clear();
    initializedGTMTargets.clear();
    activeGTMIds.clear();
}
//# sourceMappingURL=google.js.map