// ============================================================================
// SHARED TYPES AND UTILITIES
// ============================================================================
export const verbose = true;
export const currentVersion = '1.3.0';
export const trackLog = (info) => {
    if (verbose) {
        console.info(`[DoTracking ${currentVersion}]`, info);
    }
};
export function detectPlatform() {
    if (typeof window === 'undefined')
        return 'dineout';
    const hostname = window.location.hostname;
    if (hostname.includes('sinna'))
        return 'sinna';
    return 'dineout';
}
export const EVENT_MAP = {
    // -------------------------------------------------------------------------
    // Sinna Service Booking Flow
    // -------------------------------------------------------------------------
    'Booking Flow Started': { ga4: 'begin_checkout', fb: 'InitiateCheckout', fbCustom: false },
    'Service Category Selected': { ga4: 'view_item_list', fb: 'ViewContent', fbCustom: false },
    'Service Selected': { ga4: 'add_to_cart', fb: 'AddToCart', fbCustom: false },
    'Service Variation Selected': { ga4: 'service_variation', fb: 'ServiceVariationSelected', fbCustom: true },
    'Employee Selected': { ga4: 'employee_selected', fb: 'EmployeeSelected', fbCustom: true },
    'Time Slot Selected': { ga4: 'time_slot_selected', fb: 'TimeSlotSelected', fbCustom: true },
    'Customer Info Submitted': { ga4: 'add_shipping_info', fb: 'CustomerInfoSubmitted', fbCustom: true },
    'Payment Started': { ga4: 'add_payment_info', fb: 'AddPaymentInfo', fbCustom: false },
    'Booking Completed': { ga4: 'purchase', fb: 'Purchase', fbCustom: false },
    "Booking Failed": {
        ga4: "booking_failed",
        fb: "BookingFailed",
        fbCustom: true
    },
    // -------------------------------------------------------------------------
    // Dineout Reservation Flow
    // -------------------------------------------------------------------------
    // Phase 1: Reservation selection (dineout.is)
    'Reservation Flow Started': { ga4: 'begin_checkout', fb: 'InitiateCheckout', fbCustom: false },
    'Reservation Date Selected': { ga4: 'reservation_date_selected', fb: 'ReservationDateSelected', fbCustom: true },
    'Reservation Guests Selected': { ga4: 'reservation_guests_selected', fb: 'ReservationGuestsSelected', fbCustom: true },
    'Reservation Time Selected': { ga4: 'add_to_cart', fb: 'AddToCart', fbCustom: false },
    'Reservation Redirected To Checkout': { ga4: 'reservation_redirected', fb: 'ReservationRedirected', fbCustom: true },
    // Phase 2: Checkout (booking.dineout.is)
    'Reservation Checkout Loaded': { ga4: 'view_cart', fb: 'ViewContent', fbCustom: false },
    'Reservation Hold Started': { ga4: 'reservation_hold_started', fb: 'ReservationHoldStarted', fbCustom: true },
    'Customer Details Submitted': { ga4: 'add_shipping_info', fb: 'CustomerDetailsSubmitted', fbCustom: true },
    'Payment Required Shown': { ga4: 'payment_required_shown', fb: 'PaymentRequiredShown', fbCustom: true },
    'Reservation Payment Started': { ga4: 'add_payment_info', fb: 'AddPaymentInfo', fbCustom: false },
    'Payment Failed': { ga4: 'payment_failed', fb: 'PaymentFailed', fbCustom: true },
    'Reservation Completed': { ga4: 'purchase', fb: 'Purchase', fbCustom: false },
    'Reservation Hold Expired': { ga4: 'reservation_hold_expired', fb: 'ReservationHoldExpired', fbCustom: true },
    "Reservation Failed": {
        ga4: "reservation_failed",
        fb: 'ReservationFailed',
        fbCustom: true,
    },
    // -------------------------------------------------------------------------
    // Generic
    // -------------------------------------------------------------------------
    'Custom': { ga4: 'custom_event', fb: 'Custom', fbCustom: true },
};
export function mapEventName(event) {
    var _a;
    return (_a = EVENT_MAP[event]) !== null && _a !== void 0 ? _a : { ga4: event.toLowerCase().replace(/ /g, '_'), fb: event.replace(/ /g, ''), fbCustom: true };
}
// ============================================================================
// SHARED STATE
// ============================================================================
export let DO_TRACKING_INTEGRATIONS = [];
export function clearIntegrations() {
    DO_TRACKING_INTEGRATIONS = [];
}
export function addIntegration(fn) {
    DO_TRACKING_INTEGRATIONS.push(fn);
}
// ============================================================================
// SCRIPT INJECTION
// ============================================================================
const loadedScripts = new Set();
export function injectScriptOnce(src, async = true) {
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
export function mapFacebookToGA4(event, data) {
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
//# sourceMappingURL=types.js.map