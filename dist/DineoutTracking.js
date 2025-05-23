'use client';
import { useEffect, useState } from "react";
// Disable if you don't want the logs boy
const verbose = true;
const currentVersion = '1.1.2';
const trackLog = (info) => {
    if (verbose) {
        console.info(`[DoTracking ${currentVersion}]`, info);
    }
};
function mapFacebookToGA4(event, data) {
    switch (event) {
        case 'AddPaymentInfo':
            return { event: 'add_payment_info' };
        case 'AddToCart':
            return { event: 'add_to_cart' };
        case 'AddToWishlist':
            return { event: 'add_to_wishlist' };
        case 'CompleteRegistration':
            return { event: 'sign_up' };
        case 'Contact':
            return { event: 'contact' };
        case 'CustomizeProduct':
            return { event: 'select_item' };
        case 'Donate':
            return { event: 'donate' };
        case 'FindLocation':
            return { event: 'view_location' };
        case 'InitiateCheckout':
            return { event: 'begin_checkout' };
        case 'Lead':
            return { event: 'generate_lead' };
        case 'Purchase':
            return { event: 'purchase', data };
        case 'Search':
            return { event: 'search' };
        case 'StartTrial':
            return { event: 'start_trial', data };
        case 'SubmitApplication':
            return { event: 'submit_application' };
        case 'Subscribe':
            return { event: 'subscribe', data };
        case 'ViewContent':
            return { event: 'view_item' };
        case 'Custom':
            return { event: (data === null || data === void 0 ? void 0 : data.name) || 'custom_event', data };
        default:
            return { event: event.toLowerCase() };
    }
}
let DO_TRACKING_INTEGRATIONS = [];
/**
 * Sends an event to all the added integrations via this package.
 * @param event
 * @param data
 */
export const sendDineoutEvent = (event, data) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};
const loadedScripts = new Set();
function injectScriptOnce(src, async = true) {
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
function initGA4(measurementId) {
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
function initGTM(containerId) {
    injectScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    trackLog(`Added GTM with ContainerId: ${containerId}`);
    DO_TRACKING_INTEGRATIONS.push((event, data) => {
        trackLog(`Sending event to GTM ${event}`);
        const mapped = mapFacebookToGA4(event, data);
        window.dataLayer.push({ event: mapped.event, data: mapped.data });
    });
}
function initFacebookPixel(pixelId) {
    if (!window.fbq || !window.fbq.loaded) {
        const fbq = function () {
            if (fbq.callMethod) {
                fbq.callMethod.apply(null, arguments);
            }
            else {
                (fbq.queue = fbq.queue || []).push(arguments);
            }
        };
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
        }
        else {
            window.fbq('track', event, data);
        }
    });
}
const BASE_API_URL = () => {
    var _a, _b;
    try {
        const isDev = 
        // @ts-ignore
        (typeof import.meta !== "undefined" && ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV)) ||
            (typeof process !== "undefined" && ((_b = process.env) === null || _b === void 0 ? void 0 : _b.NODE_ENV) !== "production");
        if (isDev) {
            console.info("[Tracking]", "Running in development mode");
            return "http://localhost:9876";
        }
        return "https://api.dineout.is";
    }
    catch (_c) {
        return "https://api.dineout.is";
    }
};
async function fetchTrackingConfig(companyIdentifier) {
    const res = await fetch(`${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`);
    if (!res.ok)
        return {};
    return res.json();
}
export function DineoutTracking({ companyIdentifier }) {
    const [init, setInit] = useState(false);
    useEffect(() => {
        if (init)
            return;
        if ((companyIdentifier === null || companyIdentifier === void 0 ? void 0 : companyIdentifier.length) > 0) {
            setInit(true);
            fetchTrackingConfig(companyIdentifier).then((config) => {
                var _a, _b, _c;
                trackLog('Clearing integrations');
                DO_TRACKING_INTEGRATIONS = [];
                (_a = config.gaTrackingId) === null || _a === void 0 ? void 0 : _a.split(',').map(id => id.trim()).forEach(initGA4);
                (_b = config.gTagId) === null || _b === void 0 ? void 0 : _b.split(',').map(id => id.trim()).forEach(initGTM);
                (_c = config.fbPixelId) === null || _c === void 0 ? void 0 : _c.split(',').map(id => id.trim()).forEach(initFacebookPixel);
            });
        }
        window.sendDineoutEvent = sendDineoutEvent;
    }, [init, companyIdentifier]);
    return null;
}
//# sourceMappingURL=DineoutTracking.js.map