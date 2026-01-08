// ============================================================================
// SHARED TYPES AND UTILITIES
// ============================================================================

export const verbose = true;
import pkg from '../../package.json';

export const currentVersion = pkg.version;

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
// BASE EVENT TYPE
// ============================================================================

export type BaseTrackEvent =
    | { event: 'Custom'; payload: Record<string, any> }
    ;

// ============================================================================
// SINNA SERVICE BOOKING EVENTS (book.sinna.is)
// ============================================================================

export type SinnaBookingEvent =
    | { event: 'Booking Flow Started' }
    | { event: 'Booking Step Viewed'; payload: { type:'scheduled' | 'service', step: 'service_category' | 'service' | 'variation' | 'employee' | 'time_slot' | 'checkout' | 'reciept'| 'waiting_list', subType?: string } }
    | { event: 'Service Category Selected'; payload: { categoryId?: string; categoryName?: string } }
    | { event: 'Service Selected'; payload: { serviceId?: string; serviceName?: string; price?: number } }
    | { event: 'Service Variation Selected'; payload: { variationId?: string; variationName?: string } }
    | { event: 'Employee Selected'; payload: { employeeId?: string; employeeName?: string } }
    | { event: 'Time Slot Selected'; payload: { date?: string; time?: string } }
    | { event: 'Customer Info Submitted'; payload: { hasEmail?: boolean; hasPhone?: boolean } }

    | { event: 'Waiting List Completed'; payload: { } }
    | { event: 'Waiting List Failed'; payload: { reason?:string } }

    | { event: 'Booking Payment Started'; payload: { amount?: number; currency?: string, card_provider?: string, card_type?: string } }
    | { event: 'Booking Payment Failed'; payload: { provider?: string; reason?: string, card_provider?: string, card_type?: string } }
    | { event: 'Booking Completed'; payload: { bookingId?: string; totalAmount?: number; currency?: string, type?: 'redirect' | 'normal' | 'waiting_list' } }
    | { event: 'Booking Failed'; payload: { bookingId?: string; totalAmount?: number; currency?: string; type?:string, reason?:string } }
    ;

// Extract payload type for Sinna events
export type SinnaBookingEventMap = {
    [T in SinnaBookingEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// DINEOUT RESERVATION EVENTS (dineout.is -> booking.dineout.is)
// ============================================================================

export type DineoutReservationEvent =
    // Phase 1: Reservation selection (dineout.is)
    | { event: 'Reservation Step Viewed'; payload: { step: 'date' | 'guest' | 'time' | 'checkout' | 'reciept' | 'checkout' | 'reciept' } }
    | { event: 'Reservation Flow Started'; payload: { flow_id: string; company_id: string; restaurant_id?: string; lng?: string; source?: string } }
    | { event: 'Reservation Date Selected'; payload: { flow_id: string; date: string } }
    | { event: 'Reservation Guests Selected'; payload: { flow_id: string; guests: number } }
    | { event: 'Reservation Time Selected'; payload: { flow_id: string; dateTime: string; guests: number } }
    | { event: 'Reservation Redirected To Checkout'; payload: { flow_id: string; target: string } }
    // Phase 2: Checkout (booking.dineout.is)
    | { event: 'Reservation Checkout Loaded'; payload: { flow_id: string; restaurant_id: string; dateTime: string; guests: number; lng?: string } }
    | { event: 'Reservation Hold Started'; payload: { flow_id: string; hold_seconds?: number } }
    | { event: 'Customer Details Submitted'; payload: { flow_id: string; has_email: boolean; has_phone: boolean; has_special_request: boolean } }
    | { event: 'Payment Required Shown'; payload: { flow_id: string; required: boolean; amount?: number; currency?: string; reason?: string } }
    | { event: 'Reservation Payment Started'; payload: { flow_id: string; amount: number; currency: string; provider?: string } }
    | { event: 'Reservation Payment Failed'; payload: { flow_id: string; provider?: string; error_code?: string, card_provider?: string } }
    | { event: 'Reservation Completed'; payload: { flow_id: string; reservation_id: string; amount_paid?: number; currency?: string; payment_required: boolean } }
    | { event: 'Reservation Failed'; payload: { flow_id: string; reservation_id: string; type?:string, reason?:string } }
    | { event: 'Reservation Hold Expired'; payload: { flow_id: string } }
    ;

// Extract payload type for Dineout events
export type DineoutReservationEventMap = {
    [T in DineoutReservationEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// COMBINED TRACKABLE EVENT (union of all event types)
// ============================================================================

export type TrackableEvent = SinnaBookingEvent | DineoutReservationEvent | BaseTrackEvent;

// Extract payload type for any event
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
    // -------------------------------------------------------------------------
    // Sinna Service Booking Flow
    // -------------------------------------------------------------------------
    'Booking Flow Started': { ga4: 'begin_checkout', fb: 'InitiateCheckout', fbCustom: false },
    'Booking Step Viewed': { ga4: 'booking_step_viewed', fb: 'BookingStepViewed', fbCustom: true },
    'Service Category Selected': { ga4: 'view_item_list', fb: 'ViewContent', fbCustom: false },
    'Service Selected': { ga4: 'add_to_cart', fb: 'AddToCart', fbCustom: false },
    'Service Variation Selected': { ga4: 'service_variation', fb: 'ServiceVariationSelected', fbCustom: true },
    'Employee Selected': { ga4: 'employee_selected', fb: 'EmployeeSelected', fbCustom: true },
    'Time Slot Selected': { ga4: 'time_slot_selected', fb: 'TimeSlotSelected', fbCustom: true },
    'Customer Info Submitted': { ga4: 'add_shipping_info', fb: 'CustomerInfoSubmitted', fbCustom: true },
    'Booking Payment Started': { ga4: 'add_payment_info', fb: 'AddPaymentInfo', fbCustom: false },
    'Booking Payment Failed': { ga4: 'payment_failed', fb: 'PaymentFailed', fbCustom: true },
    'Booking Completed': { ga4: 'purchase', fb: 'Purchase', fbCustom: false },
    "Booking Failed": {
        ga4: "booking_failed",
        fb: "BookingFailed",
        fbCustom: true
    },
    'Waiting List Completed': { ga4: 'waiting_list_completed', fb: 'WaitingListCompleted', fbCustom: true },
    'Waiting List Failed': { ga4: 'waiting_list_failed', fb: 'WaitingListFailed', fbCustom: true },
    // -------------------------------------------------------------------------
    // Dineout Reservation Flow
    // -------------------------------------------------------------------------
    // Phase 1: Reservation selection (dineout.is)
    'Reservation Flow Started': { ga4: 'begin_checkout', fb: 'InitiateCheckout', fbCustom: false },
    'Reservation Step Viewed': { ga4: 'reservation_step_viewed', fb: 'ReservationStepViewed', fbCustom: true },
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
    'Reservation Payment Failed': { ga4: 'payment_failed', fb: 'PaymentFailed', fbCustom: true },
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

