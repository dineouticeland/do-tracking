import { useEffect } from "react";

export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
};

export type TrackingEventFunction = (event: string, data?: Record<string, any>) => void;

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
        dineoutTrackingIntegrations?: TrackingEventFunction[];
        sendDineoutEvent?: TrackingEventFunction;
        fbq: Fbq;
    }
}

function injectScript(src: string, async = true) {
    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    document.head.appendChild(script);
}

function initGA4(measurementId: string): TrackingEventFunction {
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
        window.gtag("event", event, data);
    };
}

function initGTM(containerId: string): TrackingEventFunction {
    window.dataLayer = window.dataLayer || [];
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);

    return (event, data) => {
        window.dataLayer.push({ event, ...data });
    };
}

function initFacebookPixel(pixelIds: string[]): TrackingEventFunction {
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
        injectScript("https://connect.facebook.net/en_US/fbevents.js");
    }

    pixelIds.forEach((id) => {
        try {
            window.fbq("init", id.trim());
        } catch (err) {
            console.warn("FB Pixel init failed for ID:", id, err);
        }
    });

    window.fbq("track", "PageView");

    return (event, data) => {
        window.fbq("trackCustom", event, data);
    };
}

const BASE_API_URL = () => {
    try {
        const isDev =
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

const DO_TRACKING_INTEGRATIONS: TrackingEventFunction[] = [];

export const sendDineoutEvent = (event: string, data: Record<string, any> = {}) => {
    DO_TRACKING_INTEGRATIONS.forEach((fn) => fn(event, data));
};

let hasInitialized = false;

export function DineoutTracking({ companyIdentifier }: { companyIdentifier: string }) {
    useEffect(() => {
        if (hasInitialized) return;
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
