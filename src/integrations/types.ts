// ============================================================================
// SHARED TYPES AND UTILITIES
// ============================================================================

export const verbose = true;

// Version is hardcoded to avoid JSON import issues in ESM
// Update this when releasing a new version
export const currentVersion = '1.5.9';

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
    // Restaurant/Company-specific tracking (events tracked to restaurant's accounts)
    fbPixelId?: string | null;
    gTagId?: string | null;
    gaTrackingId?: string | null;
    
    // Dineout site-wide tracking (events tracked to Dineout's accounts)
    dineoutFbPixelId?: string | null;
    dineoutGATrackingId?: string | null;    

    sinnaFbPixelId?: string | null;
    sinnaGaTrackingId?: string | null;

    // Mixpanel (Dineout only - for funnel analytics)
    dineoutMixpanelToken?: string | null;

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
    // Custom event - for any untyped/ad-hoc tracking
    | { event: 'Custom'; payload: { eventName: string; [key: string]: any } }
    ;

// Extract payload type for Sinna events
export type SinnaBookingEventMap = {
    [T in SinnaBookingEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// DINEOUT RESERVATION EVENTS (dineout.is -> booking.dineout.is)
// ============================================================================

export type DineoutReservationEvent =
    // Checkout events (booking.dineout.is)
    | { event: 'Reservation Checkout Loaded'; payload: { restaurant_id: string; dateTime: string; guests: number; lng?: string } }
    | { event: 'Reservation Hold Started'; payload: { hold_seconds?: number } }
    | { event: 'Customer Details Submitted'; payload: { has_email: boolean; has_phone: boolean; has_special_request: boolean } }
    | { event: 'Payment Required Shown'; payload: { required: boolean; amount?: number; currency?: string; reason?: string } }
    | { event: 'Reservation Payment Started'; payload: { amount: number; currency: string; provider?: string } }
    | { event: 'Reservation Payment Failed'; payload: { provider?: string; error_code?: string; card_provider?: string } }
    | { event: 'Reservation Payment Redirect'; payload: { provider?: string; redirect_type: '3ds' | 'other'; amount?: number; currency?: string } }
    | { event: 'Reservation Verification Needed'; payload: { verification_type: 'email' | 'phone' | 'other'; reservation_id?: string } }
    | { event: 'Reservation Completed'; payload: { reservation_id: string; amount_paid?: number; currency?: string; payment_required: boolean } }
    | { event: 'Reservation Failed'; payload: { reservation_id?: string; type?: string; reason?: string } }
    | { event: 'Reservation Hold Expired' }
    // Custom event - for any untyped/ad-hoc tracking
    | { event: 'Custom'; payload: { eventName: string; [key: string]: any } }
    ;

// Extract payload type for Dineout events
export type DineoutReservationEventMap = {
    [T in DineoutReservationEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// DINEOUT DISCOVERY EVENTS (dineout.is frontpage & book-a-table)
// ============================================================================

export type DineoutDiscoveryEvent =
    // Frontpage events
    | { event: 'Restaurant Clicked'; payload: { restaurant_id: string; restaurant_name?: string; source: 'frontpage' | 'search' | 'category' | 'book_table' } }
    | { event: 'CTA Button Clicked'; payload: { cta_name: string; cta_position?: string; destination_url?: string } }
    | { event: 'Event Clicked'; payload: { event_id: string; event_name?: string } }
    | { event: 'Takeaway Category Clicked'; payload: { category_id: string; category_name?: string } }
    | { event: 'Bottom Nav Clicked'; payload: { nav_item: string; destination_url?: string; position?: number } }
    | { event: 'Top Nav Clicked'; payload: { nav_item: string; destination_url?: string } }
    | { event: 'Navigation Box Clicked'; payload: { box_name: string; destination_url?: string; position?: number } }
    // Nav search (quick search in navigation bar)
    | { event: 'Nav Search Clicked' }
    | { event: 'Nav Search Result Clicked'; payload: { restaurant_id: string; restaurant_name?: string; search_query?: string } }
    // Takeaway search
    | { event: 'Takeaway Search'; payload: { query?: string; categories?: string[]; cityIds?: string[]; [key: string]: any } }
    | { event: 'Takeaway Search Result Clicked'; payload: { restaurant_id: string; restaurant_name?: string; search_query?: string } }
    // Reservation/booking search (book a table search)
    | { event: 'Reservation Search'; payload: { guests?: number; dateTime?: string; cityIds?: string[]; categories?: string[]; type?: string; customDateType?: string; [key: string]: any } }
    | { event: 'Reservation Search Result Clicked'; payload: { restaurant_id: string; restaurant_name?: string } }
    // Book a table screen events
    | { event: 'Table Restaurant Clicked'; payload: { restaurant_id: string; restaurant_name?: string } }
    | { event: 'Quick Book Clicked'; payload: { restaurant_id: string; restaurant_name?: string } }
    // Reservation selection events (dineout.is - before redirect to checkout)
    | { event: 'Reservation Step Viewed'; payload: { step: 'date' | 'guest' | 'time' |'reserve' | 'upsell'| 'confirmation'|'checkout' | 'reciept' } }
    | { event: 'Reservation Flow Started'; payload: { company_id: string; restaurant_id?: string; lng?: string; source?: string } }
    | { event: 'Reservation Date Selected'; payload: { date: string } }
    | { event: 'Reservation Guests Selected'; payload: { guests: number } }
    | { event: 'Reservation Time Selected'; payload: { dateTime: string; guests: number } }
    | { event: 'Reservation Redirected To Checkout'; payload: { target: string } }
    // Custom event - for any untyped/ad-hoc tracking
    | { event: 'Custom'; payload: { eventName: string; [key: string]: any } }
    ;

// Extract payload type for Dineout Discovery events
export type DineoutDiscoveryEventMap = {
    [T in DineoutDiscoveryEvent as T['event']]: T extends { payload: infer P } ? P : undefined;
};

// ============================================================================
// COMBINED TRACKABLE EVENT (union of all event types)
// ============================================================================

export type TrackableEvent = SinnaBookingEvent | DineoutReservationEvent | DineoutDiscoveryEvent | BaseTrackEvent;

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
    'Reservation Payment Redirect': { ga4: 'payment_redirect', fb: 'PaymentRedirect', fbCustom: true },
    'Reservation Verification Needed': { ga4: 'verification_needed', fb: 'VerificationNeeded', fbCustom: true },
    'Reservation Completed': { ga4: 'purchase', fb: 'Purchase', fbCustom: false },
    'Reservation Hold Expired': { ga4: 'reservation_hold_expired', fb: 'ReservationHoldExpired', fbCustom: true },
    "Reservation Failed": {
        ga4: "reservation_failed",
        fb: 'ReservationFailed', 
        fbCustom: true,
    },
    // -------------------------------------------------------------------------
    // Dineout Discovery (dineout.is frontpage & book-a-table)
    // -------------------------------------------------------------------------
    'Restaurant Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    'CTA Button Clicked': { ga4: 'cta_clicked', fb: 'CTAButtonClicked', fbCustom: true },
    'Event Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    'Takeaway Category Clicked': { ga4: 'view_item_list', fb: 'ViewContent', fbCustom: false },
    'Bottom Nav Clicked': { ga4: 'bottom_nav_clicked', fb: 'BottomNavClicked', fbCustom: true },
    'Top Nav Clicked': { ga4: 'top_nav_clicked', fb: 'TopNavClicked', fbCustom: true },
    'Navigation Box Clicked': { ga4: 'navigation_box_clicked', fb: 'NavigationBoxClicked', fbCustom: true },
    // Nav search
    'Nav Search Clicked': { ga4: 'search', fb: 'Search', fbCustom: false },
    'Nav Search Result Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    // Takeaway search
    'Takeaway Search': { ga4: 'search', fb: 'Search', fbCustom: false },
    'Takeaway Search Result Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    // Reservation search
    'Reservation Search': { ga4: 'search', fb: 'Search', fbCustom: false },
    'Reservation Search Result Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    'Table Restaurant Clicked': { ga4: 'select_item', fb: 'ViewContent', fbCustom: false },
    'Quick Book Clicked': { ga4: 'begin_checkout', fb: 'InitiateCheckout', fbCustom: false },
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

