'use client';

import {useEffect} from "react";

// Disable if you don't want the logs boy
const verbose = true;
const currentVersion = '1.1.1';

const trackLog = (info: string) => {
    if (verbose) {
        console.info(`[DoTracking ${currentVersion}]`, info);
    }
};

export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
};

export type TrackMethod =
    | { event: 'AddPaymentInfo' }
    | { event: 'AddToCart' }
    | { event: 'AddToWishlist' }
    | { event: 'CompleteRegistration' }
    | { event: 'Contact' }
    | { event: 'CustomizeProduct' }
    | { event: 'Donate' }
    | { event: 'FindLocation' }
    | { event: 'InitiateCheckout' }
    | { event: 'Lead' }
    | { event: 'Purchase'; payload: { value: number; currency: string; } }
    | { event: 'Search'; }
    | { event: 'StartTrial'; payload: { value: number; currency: string; predicted_ltv: number; } }
    | { event: 'SubmitApplication'; }
    | { event: 'Subscribe'; payload: { value: number; currency: string; predicted_ltv: number; } }
    | { event: 'ViewContent'; }
    | { event: 'Custom'; payload: Record<string, any> }
    ;

// Get all events
type EventMap = {
    [T in TrackMethod as T['event']]: T extends { payload: infer P } ? P : undefined;
};

type TrackingEventFunction = <T extends keyof EventMap>(
    event: T,
    data: EventMap[T] extends undefined ? undefined : EventMap[T]
) => void;

function mapFacebookToGA4(event: TrackMethod['event'], data: any): { event: string; data?: Record<string, any> } {
    switch (event) {
        case 'AddPaymentInfo':
            return {event: 'add_payment_info'};
        case 'AddToCart':
            return {event: 'add_to_cart'};
        case 'AddToWishlist':
            return {event: 'add_to_wishlist'};
        case 'CompleteRegistration':
            return {event: 'sign_up'};
        case 'Contact':
            return {event: 'contact'};
        case 'CustomizeProduct':
            return {event: 'select_item'};
        case 'Donate':
            return {event: 'donate'};
        case 'FindLocation':
            return {event: 'view_location'};
        case 'InitiateCheckout':
            return {event: 'begin_checkout'};
        case 'Lead':
            return {event: 'generate_lead'};
        case 'Purchase':
            return {event: 'purchase', data};
        case 'Search':
            return {event: 'search'};
        case 'StartTrial':
            return {event: 'start_trial', data};
        case 'SubmitApplication':
            return {event: 'submit_application'};
        case 'Subscribe':
            return {event: 'subscribe', data};
        case 'ViewContent':
            return {event: 'view_item'};
        case 'Custom':
            return {event: data?.name || 'custom_event', data};
        default:
            return {event: (event as string).toLowerCase()};
    }
}

declare global {
    interface Fbq {
        (...args: any[]): void;

        callMethod?: (...args: any[]) => void;
        queue?: any[];
        version?: string;
        loaded?: boolean;
    }

    interface Window {
        dataLayer: Record<string, any>[];
        gtag: Gtag.Gtag;
        sendDineoutEvent?: TrackingEventFunction;
        fbq: Fbq;
    }
}

let DO_TRACKING_INTEGRATIONS: TrackingEventFunction[] = [];

/**
 * Sends an event to all the added integrations via this package.
 * @param event
 * @param data
 */
export const sendDineoutEvent: TrackingEventFunction = (event, data) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};

const loadedScripts = new Set<string>();

function injectScriptOnce(src: string, async = true) {
    // Avoid identical scripts
    if (loadedScripts.has(src) || document.querySelector(`script[src="${src}"]`)) {
        return false;
    }


    // Avoid multiple FB Pixel tags
    if (Array.from(document.scripts).some(s => s.src.includes('fbevents.js'))) {
        return false;
    }


    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    document.head.appendChild(script);

    loadedScripts.add(src);
}

function initGA4(measurementId: string) {
    window.dataLayer = window.dataLayer || [];

    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        injectScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
        window.gtag("js", new Date());
    }

    window.gtag("config", measurementId);
    trackLog(`Added GA4 with MeasurementId: ${measurementId}`);

    DO_TRACKING_INTEGRATIONS.push((event, data) => {
        trackLog(`Sending event to GA4 ${event}`);
        const mapped = mapFacebookToGA4(event, data);
        window.gtag("event", mapped.event, mapped.data);
    });
}

function initGTM(containerId: string) {
    injectScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
    trackLog(`Added GTM with ContainerId: ${containerId}`);

    DO_TRACKING_INTEGRATIONS.push((event, data) => {
        trackLog(`Sending event to GTM ${event}`);
        const mapped = mapFacebookToGA4(event, data);
        window.dataLayer.push({event: mapped.event, data: mapped.data});
    });
}

function initFacebookPixel(pixelId: string) {
    if (!window.fbq || !window.fbq.loaded) {
        const fbq: Fbq = function () {
            if (fbq.callMethod) {
                fbq.callMethod.apply(null, arguments as any);
            } else {
                (fbq.queue = fbq.queue || []).push(arguments);
            }
        } as Fbq;

        fbq.version = "2.0";
        fbq.loaded = true;
        fbq.queue = [];

        window.fbq = fbq;
        injectScriptOnce("https://connect.facebook.net/en_US/fbevents.js");
    }

    window.fbq("init", pixelId);
    trackLog(`Added Facebook Pixel with Id: ${pixelId}`);
    window.fbq("track", "PageView");

    DO_TRACKING_INTEGRATIONS.push((event, data) => {
        trackLog(`Sending event to Pixel ${event}`);
        if (event === 'Custom') {
            window.fbq("trackCustom", event, data);
        } else {
            window.fbq('track', event, data);
        }
    });
}

const BASE_API_URL = () => {
    try {
        const isDev =
            // @ts-ignore
            (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
            (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

        if (isDev) {
            console.info("[Tracking]", "Running in development mode");
            return "http://localhost:9876";
        }

        return "https://api.dineout.is";
    } catch {
        return "https://api.dineout.is";
    }
};

async function fetchTrackingConfig(companyIdentifier: string): Promise<TrackingConfig> {
    const res = await fetch(`${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`);
    if (!res.ok) return {};
    return res.json();
}

export function DineoutTracking({companyIdentifier}: { companyIdentifier: string }) {
    useEffect(() => {
        if (companyIdentifier?.length > 0) {
            fetchTrackingConfig(companyIdentifier).then((config) => {
                trackLog('Clearing integrations');
                DO_TRACKING_INTEGRATIONS = [];
                config.gaTrackingId?.split(',').map(id => id.trim()).forEach(initGA4);
                config.gTagId?.split(',').map(id => id.trim()).forEach(initGTM);
                config.fbPixelId?.split(',').map(id => id.trim()).forEach(initFacebookPixel);
            });
        }
        window.sendDineoutEvent = sendDineoutEvent;
    }, [companyIdentifier]);

    return null;
}
