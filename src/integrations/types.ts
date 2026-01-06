// ============================================================================
// SHARED TYPES AND UTILITIES
// ============================================================================

export const verbose = true;
export const currentVersion = '1.3.0';

export const trackLog = (info: string) => {
    if (verbose) {
        console.info(`[DoTracking ${currentVersion}]`, info);
    }
};

// ============================================================================
// PLATFORM
// ============================================================================

export type Platform = 'dineout' | 'sinna';

export function detectPlatform(): Platform {
    if (typeof window === 'undefined') return 'dineout';
    const hostname = window.location.hostname;
    if (hostname.includes('sinna')) return 'sinna';
    return 'dineout';
}

// ============================================================================
// TRACKING CONFIG (from API)
// ============================================================================

export type TrackingConfig = {
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
    mixpanelToken?: string | null;
    companyId?: string | null;
};

// ============================================================================
// UNIFIED TRACKABLE EVENTS
// ============================================================================

export type TrackableEvent =
    // Booking funnel events
    | { event: 'Booking Flow Started' }
    | { event: 'Service Category Selected'; payload: { categoryId?: string; categoryName?: string } }
    | { event: 'Service Selected'; payload: { serviceId?: string; serviceName?: string; price?: number } }
    | { event: 'Service Variation Selected'; payload: { variationId?: string; variationName?: string } }
    | { event: 'Employee Selected'; payload: { employeeId?: string; employeeName?: string } }
    | { event: 'Time Slot Selected'; payload: { date?: string; time?: string } }
    | { event: 'Customer Info Submitted'; payload: { email?: string; phone?: string } }
    | { event: 'Payment Started'; payload: { amount?: number; currency?: string } }
    | { event: 'Booking Completed'; payload: { bookingId?: string; totalAmount?: number; currency?: string } }
    // Generic/custom events
    | { event: 'Custom'; payload: Record<string, any> }
    ;

// Extract payload type for a given event
export type TrackableEventMap = {
    [T in TrackableEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// EVENT MAPPING (Descriptive -> GA4/FB standard)
// ============================================================================

export type EventMapping = {
    ga4: string;
    fb: string;
    fbCustom: boolean;  // true = use trackCustom, false = use track
};

export const EVENT_MAP: Record<TrackableEvent['event'], EventMapping> = {
    'Booking Flow Started':       { ga4: 'begin_checkout',       fb: 'InitiateCheckout',         fbCustom: false },
    'Service Category Selected':  { ga4: 'view_item_list',       fb: 'ViewContent',              fbCustom: false },
    'Service Selected':           { ga4: 'add_to_cart',          fb: 'AddToCart',                fbCustom: false },
    'Service Variation Selected': { ga4: 'service_variation',    fb: 'ServiceVariationSelected', fbCustom: true },
    'Employee Selected':          { ga4: 'employee_selected',    fb: 'EmployeeSelected',         fbCustom: true },
    'Time Slot Selected':         { ga4: 'time_slot_selected',   fb: 'TimeSlotSelected',         fbCustom: true },
    'Customer Info Submitted':    { ga4: 'add_shipping_info',    fb: 'CustomerInfoSubmitted',    fbCustom: true },
    'Payment Started':            { ga4: 'add_payment_info',     fb: 'AddPaymentInfo',           fbCustom: false },
    'Booking Completed':          { ga4: 'purchase',             fb: 'Purchase',                 fbCustom: false },
    'Custom':                     { ga4: 'custom_event',         fb: 'Custom',                   fbCustom: true },
};

export function mapEventName(event: TrackableEvent['event']): EventMapping {
    return EVENT_MAP[event] ?? { ga4: event.toLowerCase().replace(/ /g, '_'), fb: event.replace(/ /g, ''), fbCustom: true };
}

// ============================================================================
// LEGACY TYPES (for backwards compatibility)
// ============================================================================

/** @deprecated Use TrackableEvent instead */
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
    | { event: 'Purchase'; payload: { value: number; currency: string } }
    | { event: 'Search' }
    | { event: 'StartTrial'; payload: { value: number; currency: string; predicted_ltv: number } }
    | { event: 'SubmitApplication' }
    | { event: 'Subscribe'; payload: { value: number; currency: string; predicted_ltv: number } }
    | { event: 'ViewContent' }
    | { event: 'Custom'; payload: Record<string, any> }
    ;

/** @deprecated Use TrackableEventMap instead */
export type EventMap = {
    [T in TrackMethod as T['event']]: T extends { payload: infer P } ? P : undefined;
};

/** @deprecated Use dineoutTrack instead */
export type TrackingEventFunction = <T extends keyof EventMap>(
    event: T,
    data: EventMap[T] extends undefined ? undefined : EventMap[T]
) => void;

// ============================================================================
// SHARED STATE
// ============================================================================

export let DO_TRACKING_INTEGRATIONS: TrackingEventFunction[] = [];

export function clearIntegrations() {
    DO_TRACKING_INTEGRATIONS = [];
}

export function addIntegration(fn: TrackingEventFunction) {
    DO_TRACKING_INTEGRATIONS.push(fn);
}

// ============================================================================
// SCRIPT INJECTION
// ============================================================================

const loadedScripts = new Set<string>();

export function injectScriptOnce(src: string, async = true): boolean {
    if (loadedScripts.has(src) || document.querySelector(`script[src="${src}"]`)) {
        return false;
    }

    // Avoid multiple FB Pixel tags
    if (src.includes('fbevents.js') && Array.from(document.scripts).some(s => s.src.includes('fbevents.js'))) {
        return false;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    document.head.appendChild(script);

    loadedScripts.add(src);
    return true;
}

// ============================================================================
// EVENT MAPPING (Facebook -> GA4)
// ============================================================================

export function mapFacebookToGA4(event: TrackMethod['event'], data: any): { event: string; data?: Record<string, any> } {
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
            return { event: data?.name || 'custom_event', data };
        default:
            return { event: (event as string).toLowerCase() };
    }
}

