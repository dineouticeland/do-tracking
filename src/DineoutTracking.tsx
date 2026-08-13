'use client';

import { useEffect, useRef } from 'react';
import type {
    DineoutDiscoveryEvent,
    DineoutDiscoveryEventMap,
    DineoutReservationEvent,
    DineoutReservationEventMap,
    DineoutTakeawayEvent,
    DineoutTakeawayEventMap,
    Platform,
    SinnaBookingEvent,
    SinnaBookingEventMap,
    TrackableEvent,
    TrackableEventMap,
    TrackingConfig,
    TrackingEventFunction,
    TrackingProperties,
} from './integrations/index.js';
import {
    adaptEvent,
    detectPlatform,
    getActiveFacebookPixelIds,
    getActiveGA4MeasurementIds,
    getActiveGTMContainerIds,
    identifyUser as identifyMixpanelUser,
    initFacebookPixel,
    initGA4,
    initGTM,
    initMixpanel,
    resetMixpanel,
    setActiveFacebookPixelIds,
    setActiveGA4MeasurementIds,
    setActiveGTMContainerIds,
    trackLog,
    trackToFBPixel,
    trackToGA4,
    trackToGTM,
    trackToMixpanel,
    validateEventPayload,
} from './integrations/index.js';
import {
    __resetDeduplicationForTests,
    markDelivered,
    markDestinationsDelivered,
    pendingDestinations,
    wasDelivered,
} from './integrations/deduplication.js';

export type {
    DineoutDiscoveryEvent,
    DineoutDiscoveryEventMap,
    DineoutReservationEvent,
    DineoutReservationEventMap,
    DineoutTakeawayEvent,
    DineoutTakeawayEventMap,
    Platform,
    SinnaBookingEvent,
    SinnaBookingEventMap,
    TakeawayCommercePayload,
    TakeawayFulfillmentType,
    TakeawayGiftCardAppliedPayload,
    TakeawayGiftCardRejectedPayload,
    TakeawayItem,
    TakeawayOrderCompletedPayload,
    TakeawayPaymentFailedPayload,
    TakeawayPaymentFailureCode,
    TakeawayPaymentSubmittedPayload,
    TakeawayPaymentSucceededPayload,
    TakeawayPromoAppliedPayload,
    TakeawayPromoRejectedPayload,
    TakeawayRejectionReasonCode,
    TrackableEvent,
    TrackableEventMap,
} from './integrations/index.js';

export type CompanyTrackingMode = 'auto' | 'direct' | 'gtm' | 'both';

export type DineoutTrackingProps = {
    /** If omitted, only platform-owned destinations are activated. */
    companyIdentifier?: string;
    platform?: Platform;
    /** A stable internal identifier. Do not pass an email address or phone number. */
    userId?: string;
    /**
     * Optional company-delivery override. By default, every configured company
     * destination is active: GA4/Meta are direct and GTM receives data-layer events.
     */
    companyTrackingMode?: CompanyTrackingMode;
    /**
     * When true, direct GA4 events and page views carry `debug_mode: true` so
     * they appear in GA4 DebugView. Intended for local/QA diagnosis — leave it
     * off (the default) in production. Only affects direct GA4 sends; GTM,
     * Meta, and Mixpanel payloads are unchanged.
     */
    debug?: boolean;
};

type QueuedEvent = {
    event: string;
    properties?: TrackingProperties;
    timestamp: number;
    configurationKey?: string;
    configurationGeneration?: number;
};

type CachedConversion = {
    event: string;
    properties?: TrackingProperties;
    configurationKey?: string;
};

type PageViewRecord = {
    id: number;
    page_location: string;
    page_title?: string;
    configurationKey?: string;
};

const MAX_QUEUED_EVENTS = 100;
const MAX_CACHED_CONVERSIONS = 50;
const MAX_PAGE_VIEWS = 50;
const GUID_PATTERN = /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi;

let eventQueue: QueuedEvent[] = [];
let isTrackingInitialized = false;
let configurationGeneration = 0;
let activeConfigurationGeneration = 0;
let requestedConfigurationKey: string | undefined;
let activeConfigurationKey: string | undefined;
let activeCompanyId: string | undefined;
let activeCompanyTrackingMode: CompanyTrackingMode | undefined;
let successfulConfigurationCount = 0;

let mixpanelDeliveryEnabled = false;
let mixpanelDestinationId: string | undefined;

// When true, direct GA4 sends include `debug_mode: true` for GA4 DebugView.
// Driven by the DineoutTracking `debug` prop; off in production by default.
let debugMode = false;

const cachedConversions = new Map<string, CachedConversion>();
const pageViews: PageViewRecord[] = [];
const deliveredPageViews = new Set<string>();
let pageViewSequence = 0;

function cloneTrackingValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
    if (Array.isArray(value)) {
        if (seen.has(value)) return seen.get(value);
        const copy: unknown[] = [];
        seen.set(value, copy);
        value.forEach((entry) => copy.push(cloneTrackingValue(entry, seen)));
        return copy;
    }
    if (typeof value === 'object' && value !== null) {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) return value;
        if (seen.has(value)) return seen.get(value);
        const copy: TrackingProperties = {};
        seen.set(value, copy);
        for (const [key, entry] of Object.entries(value)) {
            copy[key] = cloneTrackingValue(entry, seen);
        }
        return copy;
    }
    return value;
}

function cloneTrackingProperties(properties?: TrackingProperties): TrackingProperties | undefined {
    return properties
        ? cloneTrackingValue(properties) as TrackingProperties
        : undefined;
}

/** Check whether a configuration is active and events can be dispatched. */
export function isInitialized(): boolean {
    return isTrackingInitialized;
}

/** Return a copy of events waiting for the current configuration request. */
export function getEventQueue(): QueuedEvent[] {
    return eventQueue.map((entry) => ({
        ...entry,
        properties: cloneTrackingProperties(entry.properties),
    }));
}

function currentConfigurationKey(): string | undefined {
    return requestedConfigurationKey ?? activeConfigurationKey;
}

function enqueueEvent(event: string, properties?: TrackingProperties): void {
    if (eventQueue.length >= MAX_QUEUED_EVENTS) {
        eventQueue.shift();
        trackLog('Tracking queue was full; discarded the oldest event');
    }

    eventQueue.push({
        event,
        properties: cloneTrackingProperties(properties),
        timestamp: Date.now(),
        configurationKey: currentConfigurationKey(),
        configurationGeneration: requestedConfigurationKey
            ? configurationGeneration
            : undefined,
    });
}

function eventMatchesActiveConfiguration(configurationKey?: string): boolean {
    if (!activeConfigurationKey) return false;
    if (configurationKey === activeConfigurationKey) return true;

    // Events can fire before the first tracking component effect runs. They may
    // join the first successful configuration, but never a later restaurant.
    return configurationKey === undefined && successfulConfigurationCount === 0;
}

function queuedEventMatchesActiveConfiguration(entry: QueuedEvent): boolean {
    return eventMatchesActiveConfiguration(entry.configurationKey)
        && entry.configurationGeneration === activeConfigurationGeneration;
}

function cacheConversion(
    logicalEventId: string,
    event: string,
    properties: TrackingProperties | undefined,
    configurationKey: string | undefined,
): void {
    cachedConversions.set(logicalEventId, {
        event,
        properties: cloneTrackingProperties(properties),
        configurationKey,
    });
    while (cachedConversions.size > MAX_CACHED_CONVERSIONS) {
        const oldest = cachedConversions.keys().next().value as string | undefined;
        if (!oldest) break;
        cachedConversions.delete(oldest);
    }
}

function reportDispatchError(destination: string, event: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    trackLog(`Could not send ${event} to ${destination}: ${message}`);
}

/**
 * Adapt once, then send destination-specific payloads. A failure at one
 * destination does not prevent delivery to the remaining destinations.
 */
function dispatchEvent(
    event: string,
    properties?: TrackingProperties,
    configurationKey = activeConfigurationKey,
    rememberConversion = true,
): void {
    if (!eventMatchesActiveConfiguration(configurationKey)) return;

    let adapted: ReturnType<typeof adaptEvent>;
    try {
        adapted = adaptEvent(event, properties);
    } catch (error) {
        reportDispatchError('tracking adapters', event, error);
        return;
    }

    const logicalEventId = adapted.conversion?.eventId;
    if (logicalEventId && rememberConversion) {
        cacheConversion(
            logicalEventId,
            event,
            properties,
            configurationKey ?? activeConfigurationKey,
        );
    }

    try {
        const targets = pendingDestinations(
            logicalEventId,
            'ga4',
            getActiveGA4MeasurementIds(),
        );
        const ga4Params = debugMode
            ? { ...adapted.ga4.params, debug_mode: true }
            : adapted.ga4.params;
        const delivered = trackToGA4(adapted.ga4.eventName, ga4Params, targets);
        markDestinationsDelivered(logicalEventId, 'ga4', delivered);
    } catch (error) {
        reportDispatchError('GA4', event, error);
    }

    try {
        const targets = pendingDestinations(
            logicalEventId,
            'gtm',
            getActiveGTMContainerIds(),
        );
        const delivered = trackToGTM(adapted.gtm, targets);
        markDestinationsDelivered(logicalEventId, 'gtm', delivered);
    } catch (error) {
        reportDispatchError('GTM', event, error);
    }

    if (adapted.meta) {
        try {
            const targets = pendingDestinations(
                logicalEventId,
                'meta',
                getActiveFacebookPixelIds(),
            );
            const delivered = trackToFBPixel(
                adapted.meta.eventName,
                adapted.meta.custom,
                adapted.meta.params,
                adapted.meta.eventID,
                targets,
            );
            markDestinationsDelivered(logicalEventId, 'meta', delivered);
        } catch (error) {
            reportDispatchError('Meta', event, error);
        }
    }

    if (mixpanelDeliveryEnabled && mixpanelDestinationId) {
        const destination = `mixpanel:${mixpanelDestinationId}`;
        if (!logicalEventId || !wasDelivered(logicalEventId, destination)) {
            try {
                const delivered = trackToMixpanel(
                    adapted.mixpanel.eventName,
                    adapted.mixpanel.properties,
                );
                if (delivered && logicalEventId) markDelivered(logicalEventId, destination);
            } catch (error) {
                reportDispatchError('Mixpanel', event, error);
            }
        }
    }
}

function flushEventQueue(): void {
    if (eventQueue.length === 0) return;

    const queued = eventQueue;
    eventQueue = [];
    let deliveredCount = 0;

    for (const entry of queued) {
        if (!queuedEventMatchesActiveConfiguration(entry)) continue;
        dispatchEvent(entry.event, entry.properties, entry.configurationKey);
        deliveredCount += 1;
    }

    if (deliveredCount > 0) trackLog(`Flushed ${deliveredCount} queued events`);
}

function replayConversionsForActiveConfiguration(): void {
    for (const conversion of cachedConversions.values()) {
        if (!eventMatchesActiveConfiguration(conversion.configurationKey)) continue;
        dispatchEvent(
            conversion.event,
            conversion.properties,
            conversion.configurationKey,
            false,
        );
    }
}

function validateBeforeQueueing(event: string, properties?: TrackingProperties): boolean {
    try {
        validateEventPayload(event, properties);
        return true;
    } catch (error) {
        reportDispatchError('tracking validation', event, error);
        return false;
    }
}

function internalTrack(event: string, properties?: TrackingProperties): void {
    trackLog(`track: ${event}`);
    if (!validateBeforeQueueing(event, properties)) return;

    if (!isTrackingInitialized) {
        enqueueEvent(event, properties);
        trackLog(`Queued event while tracking configuration is loading: ${event}`);
        return;
    }

    dispatchEvent(event, properties);
}

declare global {
    interface Window {
        trackSinna?: typeof trackSinna;
        trackDineout?: typeof trackDineout;
        trackDineoutDiscovery?: typeof trackDineoutDiscovery;
        trackTakeaway?: typeof trackTakeaway;
        trackPageView?: typeof trackPageView;
        /** @deprecated Use a domain-specific tracking function instead. */
        sendDineoutEvent?: TrackingEventFunction;
    }
}

/** Track a Sinna service-booking event. Sinna event semantics are unchanged in v2. */
export function trackSinna<T extends SinnaBookingEvent['event']>(
    event: T,
    ...args: SinnaBookingEventMap[T] extends undefined
        ? []
        : [properties: SinnaBookingEventMap[T]]
): void {
    internalTrack(event, args[0] as TrackingProperties | undefined);
}

/** Track a Dineout reservation event, including Lead and deposit Purchase events. */
export function trackDineout<T extends DineoutReservationEvent['event']>(
    event: T,
    ...args: DineoutReservationEventMap[T] extends undefined
        ? []
        : [properties: DineoutReservationEventMap[T]]
): void {
    internalTrack(event, args[0] as TrackingProperties | undefined);
}

/** Track a Dineout discovery or reservation-selection event. */
export function trackDineoutDiscovery<T extends DineoutDiscoveryEvent['event']>(
    event: T,
    ...args: DineoutDiscoveryEventMap[T] extends undefined
        ? []
        : [properties: DineoutDiscoveryEventMap[T]]
): void {
    internalTrack(event, args[0] as TrackingProperties | undefined);
}

/** Track a validated takeaway menu, cart, checkout, payment, or order event. */
export function trackTakeaway<T extends DineoutTakeawayEvent['event']>(
    event: T,
    ...args: DineoutTakeawayEventMap[T] extends undefined
        ? []
        : [properties: DineoutTakeawayEventMap[T]]
): void {
    internalTrack(event, args[0] as TrackingProperties | undefined);
}

/** @deprecated Prefer the domain-specific typed tracking functions. */
export function dineoutTrack<T extends TrackableEvent['event']>(
    event: T,
    ...args: TrackableEventMap[T] extends undefined
        ? []
        : [properties: TrackableEventMap[T]]
): void {
    internalTrack(event, args[0] as TrackingProperties | undefined);
}

/**
 * @deprecated Prefer trackTakeaway, trackDineout, trackDineoutDiscovery, or
 * trackSinna. This compatibility API now enters the unified dispatcher once.
 */
export const sendDineoutEvent: TrackingEventFunction = (event, data) => {
    const customData = data as Record<string, unknown> | undefined;
    if (event === 'Custom' && customData && typeof customData.name === 'string') {
        const { name, ...properties } = customData;
        internalTrack('Custom', { eventName: name, ...properties });
        return;
    }
    internalTrack(event, data as TrackingProperties | undefined);
};

/** Identify a user in Mixpanel with a stable, non-PII internal identifier. */
export function identifyUser(userId: string): void {
    identifyMixpanelUser(userId);
}

/** Reset Mixpanel identity state, for example after logout. */
export function reset(): void {
    resetMixpanel();
}

function pageViewKey(pageView: PageViewRecord, destination: string): string {
    return `${pageView.id}:${destination}`;
}

function hasPageViewBeenDelivered(pageView: PageViewRecord, destination: string): boolean {
    return deliveredPageViews.has(pageViewKey(pageView, destination));
}

function markPageViewDelivered(pageView: PageViewRecord, destination: string): void {
    deliveredPageViews.add(pageViewKey(pageView, destination));
}

/**
 * Send a page view to every active destination that has not already received
 * it. Delivery is deduped per (page-view id, destination), so calling this more
 * than once for the same page view — for example after a company configuration
 * activates and adds destinations — never sends a destination a second copy.
 */
function deliverPageViewToActiveDestinations(pageView: PageViewRecord): void {
    const properties: TrackingProperties = {
        page_location: pageView.page_location,
        ...(pageView.page_title ? { page_title: pageView.page_title } : {}),
    };

    const gaTargets = getActiveGA4MeasurementIds().filter(
        (id) => !hasPageViewBeenDelivered(pageView, `ga4:${id}`),
    );
    const gaProperties = debugMode ? { ...properties, debug_mode: true } : properties;
    try {
        for (const id of trackToGA4('page_view', gaProperties, gaTargets)) {
            markPageViewDelivered(pageView, `ga4:${id}`);
        }
    } catch (error) {
        reportDispatchError('GA4', 'page_view', error);
    }

    const gtmTargets = getActiveGTMContainerIds().filter(
        (id) => !hasPageViewBeenDelivered(pageView, `gtm:${id}`),
    );
    try {
        for (const id of trackToGTM({ event: 'page_view', ...properties }, gtmTargets)) {
            markPageViewDelivered(pageView, `gtm:${id}`);
        }
    } catch (error) {
        reportDispatchError('GTM', 'page_view', error);
    }

    const metaTargets = getActiveFacebookPixelIds().filter(
        (id) => !hasPageViewBeenDelivered(pageView, `meta:${id}`),
    );
    try {
        for (const id of trackToFBPixel('PageView', false, properties, undefined, metaTargets)) {
            markPageViewDelivered(pageView, `meta:${id}`);
        }
    } catch (error) {
        reportDispatchError('Meta', 'page_view', error);
    }

    if (mixpanelDeliveryEnabled && mixpanelDestinationId) {
        const destination = `mixpanel:${mixpanelDestinationId}`;
        if (!hasPageViewBeenDelivered(pageView, destination)) {
            try {
                if (trackToMixpanel('Page Viewed', properties)) {
                    markPageViewDelivered(pageView, destination);
                }
            } catch (error) {
                reportDispatchError('Mixpanel', 'page_view', error);
            }
        }
    }
}

function dispatchPageView(pageView: PageViewRecord): void {
    if (!eventMatchesActiveConfiguration(pageView.configurationKey)) return;
    if (!pageView.configurationKey) pageView.configurationKey = activeConfigurationKey;
    deliverPageViewToActiveDestinations(pageView);
}

function latestPageViewForActiveConfiguration(): PageViewRecord | undefined {
    for (let index = pageViews.length - 1; index >= 0; index -= 1) {
        const pageView = pageViews[index];
        if (eventMatchesActiveConfiguration(pageView.configurationKey)) return pageView;
    }
    return undefined;
}

/**
 * Deliver the current page's already-recorded page view to destinations that
 * only just became active.
 *
 * A single-page app records a page view on navigation, but a restaurant's
 * `companyIdentifier` usually resolves a beat later (it is commonly fetched).
 * By then the page view for the page the user is looking at was stamped with
 * the previous, platform-only scope, so `latestPageViewForActiveConfiguration`
 * does not return it and the company's GA4/Meta/GTM never receive the view.
 *
 * This re-delivers that same page view — reusing its id, so per-destination
 * dedup stops it reaching any destination twice (no duplicate platform page
 * view). The exact current-URL match keeps a page view from ever being attached
 * to a restaurant the user has already navigated away from; a superseded
 * configuration never reaches this point because its generation is cancelled.
 */
function replayCurrentPageViewForActivatedDestinations(): void {
    if (typeof window === 'undefined') return;
    const currentLocation = fullPageLocation(window.location.href);
    const last = pageViews[pageViews.length - 1];
    if (!last || last.page_location !== currentLocation) return;
    // The exact-scope page view is already delivered by the caller's replay.
    if (eventMatchesActiveConfiguration(last.configurationKey)) return;
    deliverPageViewToActiveDestinations(last);
}

function fullPageLocation(url: string): string {
    if (typeof window === 'undefined') return url;
    try {
        const pageUrl = new URL(url, window.location.href);
        pageUrl.pathname = pageUrl.pathname.replace(GUID_PATTERN, ':confirmation_id');
        for (const [key, value] of pageUrl.searchParams) {
            const redacted = value.replace(GUID_PATTERN, ':confirmation_id');
            if (redacted !== value) pageUrl.searchParams.set(key, redacted);
        }
        pageUrl.hash = pageUrl.hash.replace(GUID_PATTERN, ':confirmation_id');
        return pageUrl.href;
    } catch {
        return window.location.href.replace(GUID_PATTERN, ':confirmation_id');
    }
}

/** Track one manual page view per currently active destination. */
export function trackPageView(url: string, title?: string): void {
    const page_location = fullPageLocation(url);
    const page_title = title ?? (typeof document !== 'undefined' ? document.title : undefined);
    const configurationKey = currentConfigurationKey();
    const previous = pageViews[pageViews.length - 1];

    const pageView = previous
        && previous.page_location === page_location
        && previous.page_title === page_title
        && previous.configurationKey === configurationKey
        ? previous
        : {
            id: ++pageViewSequence,
            page_location,
            page_title,
            configurationKey,
        };

    if (pageView !== previous) {
        pageViews.push(pageView);
        if (pageViews.length > MAX_PAGE_VIEWS) pageViews.shift();
    }

    trackLog(`pageview: ${page_location}`);
    if (isTrackingInitialized) dispatchPageView(pageView);
}

const BASE_API_URL = () => {
    try {
        const isDev =
            // @ts-expect-error import.meta.env is supplied by common bundlers.
            (typeof import.meta !== 'undefined' && import.meta.env?.DEV)
            || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

        if (isDev) return 'http://localhost:9876';
        if (typeof window !== 'undefined' && window.location.href.includes('qa')) {
            return 'https://api-qa.dineout.is';
        }
        return 'https://api.dineout.is';
    } catch {
        return 'https://api.dineout.is';
    }
};

async function fetchTrackingConfig(companyIdentifier?: string): Promise<TrackingConfig> {
    const query = companyIdentifier
        ? `?companyIdentifier=${encodeURIComponent(companyIdentifier)}`
        : '';
    const response = await fetch(`${BASE_API_URL()}/api/web/tracking${query}`);
    if (!response.ok) {
        throw new Error(`tracking configuration request failed (${response.status})`);
    }
    return response.json() as Promise<TrackingConfig>;
}

function splitIds(value?: string | null): string[] {
    if (!value) return [];
    return [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))];
}

function uniqueIds(...groups: string[][]): string[] {
    return [...new Set(groups.flat())];
}

function deactivateDestinations(): void {
    setActiveGA4MeasurementIds([]);
    setActiveGTMContainerIds([]);
    setActiveFacebookPixelIds([]);
    mixpanelDeliveryEnabled = false;
    mixpanelDestinationId = undefined;
}

function beginConfiguration(configurationKey: string): number {
    configurationGeneration += 1;
    requestedConfigurationKey = configurationKey;

    // Calls made before the first component effect cannot name a generation.
    // Bind them to the first requested configuration so a failed request followed
    // by a restaurant switch cannot move those events to the second restaurant.
    if (successfulConfigurationCount === 0) {
        for (const entry of eventQueue) {
            if (!entry.configurationKey) {
                entry.configurationKey = configurationKey;
                entry.configurationGeneration = configurationGeneration;
            }
        }
        for (const pageView of pageViews) {
            if (!pageView.configurationKey) pageView.configurationKey = configurationKey;
        }
    }

    activeConfigurationKey = undefined;
    activeCompanyId = undefined;
    activeCompanyTrackingMode = undefined;
    isTrackingInitialized = false;
    deactivateDestinations();
    return configurationGeneration;
}

function activateDestinations(
    config: TrackingConfig,
    resolvedPlatform: Platform,
    companyIdentifier: string | undefined,
    companyTrackingMode: CompanyTrackingMode,
    userId: string | undefined,
): void {
    const platformGA = splitIds(
        resolvedPlatform === 'dineout'
            ? config.dineoutGATrackingId
            : config.sinnaGATrackingId,
    );
    const platformMeta = splitIds(
        resolvedPlatform === 'dineout'
            ? config.dineoutFbPixelId
            : config.sinnaFbPixelId,
    );
    const hasCompanyConfiguration = Boolean(companyIdentifier || config.companyId);
    const useDirectCompanyTags =
        hasCompanyConfiguration
        && (
            companyTrackingMode === 'auto'
            || companyTrackingMode === 'direct'
            || companyTrackingMode === 'both'
        );
    const useCompanyGTM =
        hasCompanyConfiguration
        && (
            companyTrackingMode === 'auto'
            || companyTrackingMode === 'gtm'
            || companyTrackingMode === 'both'
        );

    const gaIds = uniqueIds(
        platformGA,
        useDirectCompanyTags ? splitIds(config.companyGATrackingId) : [],
    );
    const metaIds = uniqueIds(
        platformMeta,
        useDirectCompanyTags ? splitIds(config.companyFbPixelId) : [],
    );
    const gtmIds = useCompanyGTM ? splitIds(config.companyGTagId) : [];

    gaIds.forEach(initGA4);
    metaIds.forEach(initFacebookPixel);
    gtmIds.forEach(initGTM);

    // Initialization is process-wide and idempotent; these sets define the
    // exact destinations allowed for the current configuration generation.
    setActiveGA4MeasurementIds(gaIds);
    setActiveFacebookPixelIds(metaIds);
    setActiveGTMContainerIds(gtmIds);

    if (config.dineoutMixpanelToken) {
        initMixpanel({
            token: config.dineoutMixpanelToken,
            companyId: config.companyId ?? '',
            platform: resolvedPlatform,
            userId,
        });
        mixpanelDeliveryEnabled = true;
        mixpanelDestinationId = config.dineoutMixpanelToken;
    }

    activeCompanyId = config.companyId ?? companyIdentifier;
    activeCompanyTrackingMode = companyTrackingMode;
}

function exposeGlobalFunctions(): void {
    if (typeof window === 'undefined') return;
    window.trackSinna = trackSinna;
    window.trackDineout = trackDineout;
    window.trackDineoutDiscovery = trackDineoutDiscovery;
    window.trackTakeaway = trackTakeaway;
    window.trackPageView = trackPageView;
    window.sendDineoutEvent = sendDineoutEvent;
}

export function DineoutTracking({
    companyIdentifier,
    platform,
    userId,
    companyTrackingMode = 'auto',
    debug = false,
}: DineoutTrackingProps) {
    const resolvedPlatform = platform ?? detectPlatform();
    const configurationKey = `${resolvedPlatform}:${companyIdentifier ?? '__platform_only__'}`;
    const latestUserId = useRef(userId);
    latestUserId.current = userId;
    // Kept current every render so a toggle takes effect on the next event.
    debugMode = debug;

    useEffect(() => {
        exposeGlobalFunctions();
    }, []);

    useEffect(() => {
        if (
            isTrackingInitialized
            && activeConfigurationKey === configurationKey
            && activeCompanyTrackingMode === companyTrackingMode
        ) {
            return;
        }

        const generation = beginConfiguration(configurationKey);
        let cancelled = false;

        void fetchTrackingConfig(companyIdentifier)
            .then((config) => {
                if (
                    cancelled
                    || generation !== configurationGeneration
                    || requestedConfigurationKey !== configurationKey
                ) {
                    return;
                }

                activateDestinations(
                    config,
                    resolvedPlatform,
                    companyIdentifier,
                    companyTrackingMode,
                    latestUserId.current,
                );
                activeConfigurationKey = configurationKey;
                activeConfigurationGeneration = generation;
                requestedConfigurationKey = configurationKey;
                isTrackingInitialized = true;

                flushEventQueue();
                const pageView = latestPageViewForActiveConfiguration();
                if (pageView) dispatchPageView(pageView);
                replayCurrentPageViewForActivatedDestinations();
                replayConversionsForActiveConfiguration();
                successfulConfigurationCount += 1;

                trackLog(
                    `Tracking initialized for ${activeCompanyId ?? 'platform'} (${companyTrackingMode})`,
                );
            })
            .catch((error: unknown) => {
                if (cancelled || generation !== configurationGeneration) return;
                reportDispatchError('configuration', 'initialization', error);
            });

        return () => {
            cancelled = true;
        };
        // userId is handled independently so identity changes do not reload tags.
    }, [companyIdentifier, companyTrackingMode, configurationKey, resolvedPlatform]);

    useEffect(() => {
        if (userId) identifyUser(userId);
    }, [userId]);

    return null;
}

/** Reset module-level orchestration state between jsdom test cases. */
export function __resetTrackingForTests(): void {
    eventQueue = [];
    isTrackingInitialized = false;
    configurationGeneration += 1;
    activeConfigurationGeneration = 0;
    requestedConfigurationKey = undefined;
    activeConfigurationKey = undefined;
    activeCompanyId = undefined;
    activeCompanyTrackingMode = undefined;
    successfulConfigurationCount = 0;
    mixpanelDeliveryEnabled = false;
    mixpanelDestinationId = undefined;
    debugMode = false;
    cachedConversions.clear();
    pageViews.splice(0, pageViews.length);
    deliveredPageViews.clear();
    pageViewSequence = 0;
    deactivateDestinations();
    __resetDeduplicationForTests();
}
