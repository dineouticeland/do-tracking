// ============================================================================
// GOOGLE ANALYTICS (GA4) AND GTM INTEGRATION
// ============================================================================

import { injectScriptOnce, trackLog } from './types.js';

type DataLayerEntry = Record<string, unknown> | IArguments;

declare global {
    interface Window {
        dataLayer: DataLayerEntry[];
        gtag: Gtag.Gtag;
        [key: string]: unknown;
    }
}

const initializedGA4Ids = new Set<string>();
const activeGA4Ids = new Set<string>();
const initializedGTMTargets = new Map<string, string>();
const activeGTMIds = new Set<string>();

function normalizeIds(ids: readonly string[]): string[] {
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

function ensureGoogleTag(measurementId: string): void {
    window.dataLayer = window.dataLayer || [];

    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        } as Gtag.Gtag;
        window.gtag('js', new Date());
    }

    const hasGoogleTag = Array.from(document.scripts).some((script) =>
        script.src.includes('googletagmanager.com/gtag/js')
    );
    if (!hasGoogleTag) {
        injectScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
    }
}

export function initGA4(measurementId: string): void {
    const id = measurementId.trim();
    if (!id) return;

    ensureGoogleTag(id);
    activeGA4Ids.add(id);

    if (initializedGA4Ids.has(id)) return;

    window.gtag('config', id, { send_page_view: false });
    initializedGA4Ids.add(id);
    trackLog(`Added GA4 with MeasurementId: ${id}`);
}

function gtmLayerName(containerId: string): string {
    return `doTrackingGtm_${containerId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function getGTMLayer(containerId: string): DataLayerEntry[] | undefined {
    const layerName = initializedGTMTargets.get(containerId);
    if (!layerName) return undefined;
    const layer = window[layerName];
    return Array.isArray(layer) ? layer as DataLayerEntry[] : undefined;
}

export function initGTM(containerId: string): void {
    const id = containerId.trim();
    if (!id) return;

    activeGTMIds.add(id);
    if (initializedGTMTargets.has(id)) return;

    const layerName = gtmLayerName(id);
    const existingLayer = window[layerName];
    const layer = Array.isArray(existingLayer) ? existingLayer as DataLayerEntry[] : [];
    window[layerName] = layer;
    layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

    injectScriptOnce(
        `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}&l=${encodeURIComponent(layerName)}`
    );
    initializedGTMTargets.set(id, layerName);
    trackLog(`Added GTM with ContainerId: ${id}`);
}

export function setActiveGA4MeasurementIds(ids: readonly string[]): void {
    activeGA4Ids.clear();
    normalizeIds(ids).forEach((id) => activeGA4Ids.add(id));
}

export function setActiveGTMContainerIds(ids: readonly string[]): void {
    activeGTMIds.clear();
    normalizeIds(ids).forEach((id) => activeGTMIds.add(id));
}

export function getActiveGA4MeasurementIds(): string[] {
    return [...activeGA4Ids];
}

export function getActiveGTMContainerIds(): string[] {
    return [...activeGTMIds];
}

export function trackToGA4(
    eventName: string,
    properties?: Record<string, unknown>,
    targetIds: readonly string[] = [...activeGA4Ids],
): string[] {
    if (!window.gtag) return [];

    const destinations = normalizeIds(targetIds).filter(
        (id) => activeGA4Ids.has(id) && initializedGA4Ids.has(id),
    );
    if (destinations.length === 0) return [];

    trackLog(`Sending to GA4: ${eventName}`);
    window.gtag('event', eventName, {
        ...(properties ?? {}),
        send_to: destinations,
    });
    return destinations;
}

export function trackToGTM(
    payload: Record<string, unknown>,
    targetIds?: readonly string[],
): string[];
/** @deprecated Prefer passing the complete dataLayer payload produced by toGTMEvent. */
export function trackToGTM(
    eventName: string,
    properties?: Record<string, unknown>,
    targetIds?: readonly string[],
): string[];
export function trackToGTM(
    eventOrPayload: string | Record<string, unknown>,
    propertiesOrTargets?: Record<string, unknown> | readonly string[],
    explicitTargetIds?: readonly string[],
): string[] {
    const payload = typeof eventOrPayload === 'string'
        ? { event: eventOrPayload, ...(!Array.isArray(propertiesOrTargets) ? propertiesOrTargets : {}) }
        : eventOrPayload;
    const targetIds = typeof eventOrPayload === 'string'
        ? (explicitTargetIds ?? (Array.isArray(propertiesOrTargets) ? propertiesOrTargets : [...activeGTMIds]))
        : (Array.isArray(propertiesOrTargets) ? propertiesOrTargets : [...activeGTMIds]);

    const delivered: string[] = [];
    normalizeIds(targetIds).forEach((id) => {
        if (!activeGTMIds.has(id)) return;
        const layer = getGTMLayer(id);
        if (!layer) return;

        try {
            trackLog(`Sending to GTM ${id}: ${String(payload.event ?? 'event')}`);
            if (Object.prototype.hasOwnProperty.call(payload, 'ecommerce')) {
                layer.push({ ecommerce: null });
            }
            layer.push(payload);
            delivered.push(id);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            trackLog(`Could not send ${String(payload.event ?? 'event')} to GTM ${id}: ${message}`);
        }
    });
    return delivered;
}

export function isGA4Initialized(): boolean {
    return initializedGA4Ids.size > 0;
}

export function isGTMInitialized(): boolean {
    return initializedGTMTargets.size > 0;
}

/** Internal test helper; not re-exported from the package root. */
export function __resetGoogleForTests(): void {
    initializedGA4Ids.clear();
    activeGA4Ids.clear();
    initializedGTMTargets.clear();
    activeGTMIds.clear();
}
