import { useEffect } from "react";
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
function injectScript(src, async = true) {
    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    document.head.appendChild(script);
}
function initGA4(measurementId) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        injectScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
        window.gtag("js", new Date());
    }
    window.gtag("config", measurementId);
    return (event, data) => {
        const mapped = mapFacebookToGA4(event, data);
        window.gtag("event", mapped.event, mapped.data);
    };
}
function initGTM(containerId) {
    window.dataLayer = window.dataLayer || [];
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);
    return (event, data) => {
        const mapped = mapFacebookToGA4(event, data);
        window.dataLayer.push({ event: mapped.event, data: mapped.data });
    };
}
function initFacebookPixel(pixelIds) {
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
        injectScript("https://connect.facebook.net/en_US/fbevents.js");
    }
    pixelIds.forEach((id) => {
        try {
            window.fbq("init", id.trim());
        }
        catch (err) {
            console.warn("FB Pixel init failed for ID:", id, err);
        }
    });
    window.fbq("track", "PageView");
    return (event, data) => {
        if (event === 'Custom') {
            window.fbq("trackCustom", event, data);
        }
        else {
            window.fbq('track', event, data);
        }
    };
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
const DO_TRACKING_INTEGRATIONS = [];
export const sendDineoutEvent = (event, data) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};
let hasInitialized = false;
export function DineoutTracking({ companyIdentifier }) {
    useEffect(() => {
        if (hasInitialized)
            return;
        hasInitialized = true;
        fetchTrackingConfig(companyIdentifier).then((config) => {
            if (config.gaTrackingId) {
                console.info("Dineout Tracker", `Initialising GA4 ${config.gaTrackingId}`);
                DO_TRACKING_INTEGRATIONS.push(initGA4(config.gaTrackingId));
            }
            if (config.gTagId) {
                console.info("Dineout Tracker", `Initialising GTag ${config.gTagId}`);
                DO_TRACKING_INTEGRATIONS.push(initGTM(config.gTagId));
            }
            if (config.fbPixelId) {
                const pixelIds = config.fbPixelId.split(",");
                console.info("Dineout Tracker", `Initialising Pixels ${pixelIds}`);
                DO_TRACKING_INTEGRATIONS.push(initFacebookPixel(pixelIds));
            }
            window.dineoutTrackingIntegrations = DO_TRACKING_INTEGRATIONS;
            window.sendDineoutEvent = sendDineoutEvent;
        });
    }, []); // Empty dependency array = run once only
    return null;
}
//# sourceMappingURL=DineoutTracking.js.map