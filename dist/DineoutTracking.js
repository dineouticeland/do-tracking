'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useEffect, useRef } from 'react';
import { adaptEvent, detectPlatform, getActiveFacebookPixelIds, getActiveGA4MeasurementIds, getActiveGTMContainerIds, identifyUser as identifyMixpanelUser, initFacebookPixel, initGA4, initGTM, initMixpanel, resetMixpanel, setActiveFacebookPixelIds, setActiveGA4MeasurementIds, setActiveGTMContainerIds, trackLog, trackToFBPixel, trackToGA4, trackToGTM, trackToMixpanel, validateEventPayload, } from './integrations/index.js';
import { __resetDeduplicationForTests, markDelivered, markDestinationsDelivered, pendingDestinations, wasDelivered, } from './integrations/deduplication.js';
const MAX_QUEUED_EVENTS = 100;
const MAX_CACHED_CONVERSIONS = 50;
const MAX_PAGE_VIEWS = 50;
const GUID_PATTERN = /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi;
let eventQueue = [];
let isTrackingInitialized = false;
let configurationGeneration = 0;
let activeConfigurationGeneration = 0;
let requestedConfigurationKey;
let activeConfigurationKey;
let activeCompanyId;
let activeCompanyTrackingMode;
let successfulConfigurationCount = 0;
let mixpanelDeliveryEnabled = false;
let mixpanelDestinationId;
const cachedConversions = new Map();
const pageViews = [];
const deliveredPageViews = new Set();
let pageViewSequence = 0;
function cloneTrackingValue(value, seen = new WeakMap()) {
    if (Array.isArray(value)) {
        if (seen.has(value))
            return seen.get(value);
        const copy = [];
        seen.set(value, copy);
        value.forEach((entry) => copy.push(cloneTrackingValue(entry, seen)));
        return copy;
    }
    if (typeof value === 'object' && value !== null) {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null)
            return value;
        if (seen.has(value))
            return seen.get(value);
        const copy = {};
        seen.set(value, copy);
        for (const [key, entry] of Object.entries(value)) {
            copy[key] = cloneTrackingValue(entry, seen);
        }
        return copy;
    }
    return value;
}
function cloneTrackingProperties(properties) {
    return properties
        ? cloneTrackingValue(properties)
        : undefined;
}
/** Check whether a configuration is active and events can be dispatched. */
export function isInitialized() {
    return isTrackingInitialized;
}
/** Return a copy of events waiting for the current configuration request. */
export function getEventQueue() {
    return eventQueue.map((entry) => (Object.assign(Object.assign({}, entry), { properties: cloneTrackingProperties(entry.properties) })));
}
function currentConfigurationKey() {
    return requestedConfigurationKey !== null && requestedConfigurationKey !== void 0 ? requestedConfigurationKey : activeConfigurationKey;
}
function enqueueEvent(event, properties) {
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
function eventMatchesActiveConfiguration(configurationKey) {
    if (!activeConfigurationKey)
        return false;
    if (configurationKey === activeConfigurationKey)
        return true;
    // Events can fire before the first tracking component effect runs. They may
    // join the first successful configuration, but never a later restaurant.
    return configurationKey === undefined && successfulConfigurationCount === 0;
}
function queuedEventMatchesActiveConfiguration(entry) {
    return eventMatchesActiveConfiguration(entry.configurationKey)
        && entry.configurationGeneration === activeConfigurationGeneration;
}
function cacheConversion(logicalEventId, event, properties, configurationKey) {
    cachedConversions.set(logicalEventId, {
        event,
        properties: cloneTrackingProperties(properties),
        configurationKey,
    });
    while (cachedConversions.size > MAX_CACHED_CONVERSIONS) {
        const oldest = cachedConversions.keys().next().value;
        if (!oldest)
            break;
        cachedConversions.delete(oldest);
    }
}
function reportDispatchError(destination, event, error) {
    const message = error instanceof Error ? error.message : String(error);
    trackLog(`Could not send ${event} to ${destination}: ${message}`);
}
/**
 * Adapt once, then send destination-specific payloads. A failure at one
 * destination does not prevent delivery to the remaining destinations.
 */
function dispatchEvent(event, properties, configurationKey = activeConfigurationKey, rememberConversion = true) {
    var _a;
    if (!eventMatchesActiveConfiguration(configurationKey))
        return;
    let adapted;
    try {
        adapted = adaptEvent(event, properties);
    }
    catch (error) {
        reportDispatchError('tracking adapters', event, error);
        return;
    }
    const logicalEventId = (_a = adapted.conversion) === null || _a === void 0 ? void 0 : _a.eventId;
    if (logicalEventId && rememberConversion) {
        cacheConversion(logicalEventId, event, properties, configurationKey !== null && configurationKey !== void 0 ? configurationKey : activeConfigurationKey);
    }
    try {
        const targets = pendingDestinations(logicalEventId, 'ga4', getActiveGA4MeasurementIds());
        const delivered = trackToGA4(adapted.ga4.eventName, adapted.ga4.params, targets);
        markDestinationsDelivered(logicalEventId, 'ga4', delivered);
    }
    catch (error) {
        reportDispatchError('GA4', event, error);
    }
    try {
        const targets = pendingDestinations(logicalEventId, 'gtm', getActiveGTMContainerIds());
        const delivered = trackToGTM(adapted.gtm, targets);
        markDestinationsDelivered(logicalEventId, 'gtm', delivered);
    }
    catch (error) {
        reportDispatchError('GTM', event, error);
    }
    if (adapted.meta) {
        try {
            const targets = pendingDestinations(logicalEventId, 'meta', getActiveFacebookPixelIds());
            const delivered = trackToFBPixel(adapted.meta.eventName, adapted.meta.custom, adapted.meta.params, adapted.meta.eventID, targets);
            markDestinationsDelivered(logicalEventId, 'meta', delivered);
        }
        catch (error) {
            reportDispatchError('Meta', event, error);
        }
    }
    if (mixpanelDeliveryEnabled && mixpanelDestinationId) {
        const destination = `mixpanel:${mixpanelDestinationId}`;
        if (!logicalEventId || !wasDelivered(logicalEventId, destination)) {
            try {
                const delivered = trackToMixpanel(adapted.mixpanel.eventName, adapted.mixpanel.properties);
                if (delivered && logicalEventId)
                    markDelivered(logicalEventId, destination);
            }
            catch (error) {
                reportDispatchError('Mixpanel', event, error);
            }
        }
    }
}
function flushEventQueue() {
    if (eventQueue.length === 0)
        return;
    const queued = eventQueue;
    eventQueue = [];
    let deliveredCount = 0;
    for (const entry of queued) {
        if (!queuedEventMatchesActiveConfiguration(entry))
            continue;
        dispatchEvent(entry.event, entry.properties, entry.configurationKey);
        deliveredCount += 1;
    }
    if (deliveredCount > 0)
        trackLog(`Flushed ${deliveredCount} queued events`);
}
function replayConversionsForActiveConfiguration() {
    for (const conversion of cachedConversions.values()) {
        if (!eventMatchesActiveConfiguration(conversion.configurationKey))
            continue;
        dispatchEvent(conversion.event, conversion.properties, conversion.configurationKey, false);
    }
}
function validateBeforeQueueing(event, properties) {
    try {
        validateEventPayload(event, properties);
        return true;
    }
    catch (error) {
        reportDispatchError('tracking validation', event, error);
        return false;
    }
}
function internalTrack(event, properties) {
    trackLog(`track: ${event}`);
    if (!validateBeforeQueueing(event, properties))
        return;
    if (!isTrackingInitialized) {
        enqueueEvent(event, properties);
        trackLog(`Queued event while tracking configuration is loading: ${event}`);
        return;
    }
    dispatchEvent(event, properties);
}
/** Track a Sinna service-booking event. Sinna event semantics are unchanged in v2. */
export function trackSinna(event, ...args) {
    internalTrack(event, args[0]);
}
/** Track a Dineout reservation event, including Lead and deposit Purchase events. */
export function trackDineout(event, ...args) {
    internalTrack(event, args[0]);
}
/** Track a Dineout discovery or reservation-selection event. */
export function trackDineoutDiscovery(event, ...args) {
    internalTrack(event, args[0]);
}
/** Track a validated takeaway menu, cart, checkout, payment, or order event. */
export function trackTakeaway(event, ...args) {
    internalTrack(event, args[0]);
}
/** @deprecated Prefer the domain-specific typed tracking functions. */
export function dineoutTrack(event, ...args) {
    internalTrack(event, args[0]);
}
/**
 * @deprecated Prefer trackTakeaway, trackDineout, trackDineoutDiscovery, or
 * trackSinna. This compatibility API now enters the unified dispatcher once.
 */
export const sendDineoutEvent = (event, data) => {
    const customData = data;
    if (event === 'Custom' && customData && typeof customData.name === 'string') {
        const { name } = customData, properties = __rest(customData, ["name"]);
        internalTrack('Custom', Object.assign({ eventName: name }, properties));
        return;
    }
    internalTrack(event, data);
};
/** Identify a user in Mixpanel with a stable, non-PII internal identifier. */
export function identifyUser(userId) {
    identifyMixpanelUser(userId);
}
/** Reset Mixpanel identity state, for example after logout. */
export function reset() {
    resetMixpanel();
}
function pageViewKey(pageView, destination) {
    return `${pageView.id}:${destination}`;
}
function hasPageViewBeenDelivered(pageView, destination) {
    return deliveredPageViews.has(pageViewKey(pageView, destination));
}
function markPageViewDelivered(pageView, destination) {
    deliveredPageViews.add(pageViewKey(pageView, destination));
}
function dispatchPageView(pageView) {
    if (!eventMatchesActiveConfiguration(pageView.configurationKey))
        return;
    if (!pageView.configurationKey)
        pageView.configurationKey = activeConfigurationKey;
    const properties = Object.assign({ page_location: pageView.page_location }, (pageView.page_title ? { page_title: pageView.page_title } : {}));
    const gaTargets = getActiveGA4MeasurementIds().filter((id) => !hasPageViewBeenDelivered(pageView, `ga4:${id}`));
    try {
        for (const id of trackToGA4('page_view', properties, gaTargets)) {
            markPageViewDelivered(pageView, `ga4:${id}`);
        }
    }
    catch (error) {
        reportDispatchError('GA4', 'page_view', error);
    }
    const gtmTargets = getActiveGTMContainerIds().filter((id) => !hasPageViewBeenDelivered(pageView, `gtm:${id}`));
    try {
        for (const id of trackToGTM(Object.assign({ event: 'page_view' }, properties), gtmTargets)) {
            markPageViewDelivered(pageView, `gtm:${id}`);
        }
    }
    catch (error) {
        reportDispatchError('GTM', 'page_view', error);
    }
    const metaTargets = getActiveFacebookPixelIds().filter((id) => !hasPageViewBeenDelivered(pageView, `meta:${id}`));
    try {
        for (const id of trackToFBPixel('PageView', false, properties, undefined, metaTargets)) {
            markPageViewDelivered(pageView, `meta:${id}`);
        }
    }
    catch (error) {
        reportDispatchError('Meta', 'page_view', error);
    }
    if (mixpanelDeliveryEnabled && mixpanelDestinationId) {
        const destination = `mixpanel:${mixpanelDestinationId}`;
        if (!hasPageViewBeenDelivered(pageView, destination)) {
            try {
                if (trackToMixpanel('Page Viewed', properties)) {
                    markPageViewDelivered(pageView, destination);
                }
            }
            catch (error) {
                reportDispatchError('Mixpanel', 'page_view', error);
            }
        }
    }
}
function latestPageViewForActiveConfiguration() {
    for (let index = pageViews.length - 1; index >= 0; index -= 1) {
        const pageView = pageViews[index];
        if (eventMatchesActiveConfiguration(pageView.configurationKey))
            return pageView;
    }
    return undefined;
}
function fullPageLocation(url) {
    if (typeof window === 'undefined')
        return url;
    try {
        const pageUrl = new URL(url, window.location.href);
        pageUrl.pathname = pageUrl.pathname.replace(GUID_PATTERN, ':confirmation_id');
        for (const [key, value] of pageUrl.searchParams) {
            const redacted = value.replace(GUID_PATTERN, ':confirmation_id');
            if (redacted !== value)
                pageUrl.searchParams.set(key, redacted);
        }
        pageUrl.hash = pageUrl.hash.replace(GUID_PATTERN, ':confirmation_id');
        return pageUrl.href;
    }
    catch (_a) {
        return window.location.href.replace(GUID_PATTERN, ':confirmation_id');
    }
}
/** Track one manual page view per currently active destination. */
export function trackPageView(url, title) {
    const page_location = fullPageLocation(url);
    const page_title = title !== null && title !== void 0 ? title : (typeof document !== 'undefined' ? document.title : undefined);
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
        if (pageViews.length > MAX_PAGE_VIEWS)
            pageViews.shift();
    }
    trackLog(`pageview: ${page_location}`);
    if (isTrackingInitialized)
        dispatchPageView(pageView);
}
const BASE_API_URL = () => {
    var _a, _b;
    try {
        const isDev = 
        // @ts-expect-error import.meta.env is supplied by common bundlers.
        (typeof import.meta !== 'undefined' && ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV))
            || (typeof process !== 'undefined' && ((_b = process.env) === null || _b === void 0 ? void 0 : _b.NODE_ENV) !== 'production');
        if (isDev)
            return 'http://localhost:9876';
        if (typeof window !== 'undefined' && window.location.href.includes('qa')) {
            return 'https://api-qa.dineout.is';
        }
        return 'https://api.dineout.is';
    }
    catch (_c) {
        return 'https://api.dineout.is';
    }
};
async function fetchTrackingConfig(companyIdentifier) {
    const query = companyIdentifier
        ? `?companyIdentifier=${encodeURIComponent(companyIdentifier)}`
        : '';
    const response = await fetch(`${BASE_API_URL()}/api/web/tracking${query}`);
    if (!response.ok) {
        throw new Error(`tracking configuration request failed (${response.status})`);
    }
    return response.json();
}
function splitIds(value) {
    if (!value)
        return [];
    return [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))];
}
function uniqueIds(...groups) {
    return [...new Set(groups.flat())];
}
function deactivateDestinations() {
    setActiveGA4MeasurementIds([]);
    setActiveGTMContainerIds([]);
    setActiveFacebookPixelIds([]);
    mixpanelDeliveryEnabled = false;
    mixpanelDestinationId = undefined;
}
function beginConfiguration(configurationKey) {
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
            if (!pageView.configurationKey)
                pageView.configurationKey = configurationKey;
        }
    }
    activeConfigurationKey = undefined;
    activeCompanyId = undefined;
    activeCompanyTrackingMode = undefined;
    isTrackingInitialized = false;
    deactivateDestinations();
    return configurationGeneration;
}
function activateDestinations(config, resolvedPlatform, companyIdentifier, companyTrackingMode, userId) {
    var _a, _b;
    const platformGA = splitIds(resolvedPlatform === 'dineout'
        ? config.dineoutGATrackingId
        : config.sinnaGATrackingId);
    const platformMeta = splitIds(resolvedPlatform === 'dineout'
        ? config.dineoutFbPixelId
        : config.sinnaFbPixelId);
    const hasCompanyConfiguration = Boolean(companyIdentifier || config.companyId);
    const useDirectCompanyTags = hasCompanyConfiguration
        && (companyTrackingMode === 'auto'
            || companyTrackingMode === 'direct'
            || companyTrackingMode === 'both');
    const useCompanyGTM = hasCompanyConfiguration
        && (companyTrackingMode === 'auto'
            || companyTrackingMode === 'gtm'
            || companyTrackingMode === 'both');
    const gaIds = uniqueIds(platformGA, useDirectCompanyTags ? splitIds(config.companyGATrackingId) : []);
    const metaIds = uniqueIds(platformMeta, useDirectCompanyTags ? splitIds(config.companyFbPixelId) : []);
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
            companyId: (_a = config.companyId) !== null && _a !== void 0 ? _a : '',
            platform: resolvedPlatform,
            userId,
        });
        mixpanelDeliveryEnabled = true;
        mixpanelDestinationId = config.dineoutMixpanelToken;
    }
    activeCompanyId = (_b = config.companyId) !== null && _b !== void 0 ? _b : companyIdentifier;
    activeCompanyTrackingMode = companyTrackingMode;
}
function exposeGlobalFunctions() {
    if (typeof window === 'undefined')
        return;
    window.trackSinna = trackSinna;
    window.trackDineout = trackDineout;
    window.trackDineoutDiscovery = trackDineoutDiscovery;
    window.trackTakeaway = trackTakeaway;
    window.trackPageView = trackPageView;
    window.sendDineoutEvent = sendDineoutEvent;
}
export function DineoutTracking({ companyIdentifier, platform, userId, companyTrackingMode = 'auto', }) {
    const resolvedPlatform = platform !== null && platform !== void 0 ? platform : detectPlatform();
    const configurationKey = `${resolvedPlatform}:${companyIdentifier !== null && companyIdentifier !== void 0 ? companyIdentifier : '__platform_only__'}`;
    const latestUserId = useRef(userId);
    latestUserId.current = userId;
    useEffect(() => {
        exposeGlobalFunctions();
    }, []);
    useEffect(() => {
        if (isTrackingInitialized
            && activeConfigurationKey === configurationKey
            && activeCompanyTrackingMode === companyTrackingMode) {
            return;
        }
        const generation = beginConfiguration(configurationKey);
        let cancelled = false;
        void fetchTrackingConfig(companyIdentifier)
            .then((config) => {
            if (cancelled
                || generation !== configurationGeneration
                || requestedConfigurationKey !== configurationKey) {
                return;
            }
            activateDestinations(config, resolvedPlatform, companyIdentifier, companyTrackingMode, latestUserId.current);
            activeConfigurationKey = configurationKey;
            activeConfigurationGeneration = generation;
            requestedConfigurationKey = configurationKey;
            isTrackingInitialized = true;
            flushEventQueue();
            const pageView = latestPageViewForActiveConfiguration();
            if (pageView)
                dispatchPageView(pageView);
            replayConversionsForActiveConfiguration();
            successfulConfigurationCount += 1;
            trackLog(`Tracking initialized for ${activeCompanyId !== null && activeCompanyId !== void 0 ? activeCompanyId : 'platform'} (${companyTrackingMode})`);
        })
            .catch((error) => {
            if (cancelled || generation !== configurationGeneration)
                return;
            reportDispatchError('configuration', 'initialization', error);
        });
        return () => {
            cancelled = true;
        };
        // userId is handled independently so identity changes do not reload tags.
    }, [companyIdentifier, companyTrackingMode, configurationKey, resolvedPlatform]);
    useEffect(() => {
        if (userId)
            identifyUser(userId);
    }, [userId]);
    return null;
}
/** Reset module-level orchestration state between jsdom test cases. */
export function __resetTrackingForTests() {
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
    cachedConversions.clear();
    pageViews.splice(0, pageViews.length);
    deliveredPageViews.clear();
    pageViewSequence = 0;
    deactivateDestinations();
    __resetDeduplicationForTests();
}
//# sourceMappingURL=DineoutTracking.js.map