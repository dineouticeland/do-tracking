import { useEffect } from "react";
function injectScript(src, async = true) {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    document.head.appendChild(script);
}
function initGA4(measurementId) {
    if (!window.dataLayer)
        window.dataLayer = [];
    if (!window.gtag) {
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        injectScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
        window.gtag('js', new Date());
    }
    window.gtag('config', measurementId); // This will just add an extra GA4 ID
    return (event, data) => {
        window.gtag('event', event, data);
    };
}
function initGTM(containerId) {
    window.dataLayer = window.dataLayer || [];
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${containerId}`);
    return (event, data) => {
        window.dataLayer.push(Object.assign({ event }, data));
    };
}
// <!-- Meta Pixel Code -->
// <script>
//     !function(f,b,e,v,n,t,s)
//     {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
//         n.callMethod.apply(n,arguments):n.queue.push(arguments)};
//         if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
//         n.queue=[];t=b.createElement(e);t.async=!0;
//         t.src=v;s=b.getElementsByTagName(e)[0];
//         s.parentNode.insertBefore(t,s)}(window, document,'script',
//     'https://connect.facebook.net/en_US/fbevents.js');
//     fbq('init', '1321585508934869');
//     fbq('track', 'PageView');
// </script>
// <noscript><img height="1" width="1" style="display:none"
//                src="https://www.facebook.com/tr?id=1321585508934869&ev=PageView&noscript=1"
// /></noscript>
// <!-- End Meta Pixel Code -->
function initFacebookPixel(pixelIds) {
    const isNewFbq = typeof window.fbq === 'undefined';
    if (isNewFbq) {
        const fbq = function () {
            var _a, _b;
            (_b = (fbq.callMethod || ((_a = fbq.queue) === null || _a === void 0 ? void 0 : _a.push))) === null || _b === void 0 ? void 0 : _b.apply(fbq, arguments);
        };
        fbq.queue = [];
        fbq.version = '2.0';
        window.fbq = fbq;
        injectScript('https://connect.facebook.net/en_US/fbevents.js');
    }
    pixelIds.forEach(id => {
        try {
            window.fbq('init', id);
        }
        catch (err) {
            console.warn('FB Pixel init failed for ID:', id, err);
        }
    });
    window.fbq('track', 'PageView');
    return (event, data) => {
        window.fbq('trackCustom', event, data);
    };
}
const BASE_API_URL = () => {
    var _a;
    try {
        if (((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) !== 'production') {
            console.info('DO Tracking', 'Not in production');
            return 'http://localhost:9876';
        }
        return 'https://api.dineout.is';
    }
    catch (e) {
        return 'https://api.dineout.is';
    }
};
async function fetchTrackingConfig(companyIdentifier) {
    const res = await fetch(`${BASE_API_URL()}/api/web/tracking?companyIdentifier=${companyIdentifier}`);
    if (!res.ok)
        return {};
    return res.json();
}
const DO_TRACKING_INTEGRATIONS = [];
export const sendDineoutEvent = (event, data = {}) => {
    DO_TRACKING_INTEGRATIONS.forEach(fn => fn(event, data));
};
export function DineoutTracking({ companyIdentifier }) {
    useEffect(() => {
        fetchTrackingConfig(companyIdentifier).then(config => {
            var _a, _b, _c, _d;
            if ((_a = config.ga4) === null || _a === void 0 ? void 0 : _a.measurementId) {
                console.info('Dineout Tracker', `Initialising GA4 ${config.ga4.measurementId}`);
                DO_TRACKING_INTEGRATIONS.push(initGA4(config.ga4.measurementId));
            }
            if ((_b = config.gtm) === null || _b === void 0 ? void 0 : _b.containerId) {
                console.info('Dineout Tracker', `Initialising GTag ${config.gtm.containerId}`);
                DO_TRACKING_INTEGRATIONS.push(initGTM(config.gtm.containerId));
            }
            if ((_d = (_c = config.facebook) === null || _c === void 0 ? void 0 : _c.pixelIds) === null || _d === void 0 ? void 0 : _d.length) {
                console.info('Dineout Tracker', `Initialising Pixels ${config.facebook.pixelIds}`);
                DO_TRACKING_INTEGRATIONS.push(initFacebookPixel(config.facebook.pixelIds));
            }
            window.dineoutTrackingIntegrations = DO_TRACKING_INTEGRATIONS;
            window.sendDineoutEvent = sendDineoutEvent;
        });
    }, [companyIdentifier]);
    return null;
}
//# sourceMappingURL=DineoutTracking.js.map