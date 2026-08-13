import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mixpanelMock = vi.hoisted(() => ({
    init: vi.fn(),
    register: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
    reset: vi.fn(),
}));

vi.mock('mixpanel-browser', () => ({ default: mixpanelMock }));

import {
    __resetTrackingForTests,
    DineoutTracking,
    dineoutTrack,
    getEventQueue,
    isInitialized,
    sendDineoutEvent,
    trackDineout,
    trackPageView,
    trackTakeaway,
} from '../src/DineoutTracking.js';
import { __resetFacebookForTests } from '../src/integrations/facebook.js';
import { __resetGoogleForTests } from '../src/integrations/google.js';
import type { TrackingConfig } from '../src/integrations/types.js';

type MockFn = ReturnType<typeof vi.fn>;
type PixelMock = MockFn & { loaded?: boolean };
type TrackingWindow = Window & {
    dataLayer?: unknown[];
    gtag?: MockFn;
    fbq?: PixelMock;
    [key: string]: unknown;
};

const trackingWindow = window as unknown as TrackingWindow;

const item = {
    item_id: 'burger-101',
    item_name: 'Funky Burger',
    item_category: 'Burgers',
    item_variant: 'burger-101|patty:double|sauce:chili',
    price: 3290,
    quantity: 1,
};

const commerce = {
    restaurant_id: 'restaurant-a',
    restaurant_name: 'Funky Bhangra',
    cart_id: 'cart-1',
    currency: 'ISK',
    fulfillment_type: 'pickup' as const,
    items: [item],
    value: 3290,
};

const configA: TrackingConfig = {
    companyId: 'company-a',
    dineoutGATrackingId: 'G-SITE',
    dineoutFbPixelId: 'PIXEL-SITE',
    companyGATrackingId: 'G-A',
    companyFbPixelId: 'PIXEL-A',
    companyGTagId: 'GTM-A',
};

const configB: TrackingConfig = {
    ...configA,
    companyId: 'company-b',
    companyGATrackingId: 'G-B',
    companyFbPixelId: 'PIXEL-B',
    companyGTagId: 'GTM-B',
};

function response(config: TrackingConfig): Response {
    return {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(config),
    } as unknown as Response;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function gtagEvents(name?: string): unknown[][] {
    return gtag.mock.calls.filter(
        (call) => call[0] === 'event' && (name === undefined || call[1] === name),
    );
}

function pixelEvents(name?: string): unknown[][] {
    return fbq.mock.calls.filter(
        (call) => (call[0] === 'trackSingle' || call[0] === 'trackSingleCustom')
            && (name === undefined || call[2] === name),
    );
}

function gtmLayer(id: string): Array<Record<string, unknown>> {
    const layer = trackingWindow[`doTrackingGtm_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`];
    return layer as Array<Record<string, unknown>>;
}

let root: Root | undefined;
let container: HTMLDivElement | undefined;
let fetchMock: MockFn;
let gtag: MockFn;
let fbq: PixelMock;

async function renderTracking(
    props: React.ComponentProps<typeof DineoutTracking>,
    waitUntilInitialized = true,
): Promise<void> {
    if (!root) {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    }

    await act(async () => {
        root!.render(<DineoutTracking {...props} />);
        await Promise.resolve();
    });

    if (waitUntilInitialized) {
        await vi.waitFor(() => expect(isInitialized()).toBe(true));
    }
}

async function unmountTracking(): Promise<void> {
    if (root) {
        await act(async () => root!.unmount());
    }
    root = undefined;
    container?.remove();
    container = undefined;
}

beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    __resetTrackingForTests();
    __resetGoogleForTests();
    __resetFacebookForTests();

    document.head.replaceChildren();
    document.title = 'Takeaway';
    for (const key of Object.keys(trackingWindow)) {
        if (key.startsWith('doTrackingGtm_')) delete trackingWindow[key];
    }

    gtag = vi.fn();
    trackingWindow.gtag = gtag;
    trackingWindow.dataLayer = [];

    fbq = vi.fn() as PixelMock;
    fbq.loaded = true;
    trackingWindow.fbq = fbq;

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
    await unmountTracking();
});

describe('tracking initialization and configuration modes', () => {
    it('defaults to every configured company destination, initializes IDs once, and exposes the global API', async () => {
        fetchMock.mockResolvedValue(response(configA));

        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        await unmountTracking();
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(gtag.mock.calls.filter((call) => call[0] === 'config')).toEqual([
            ['config', 'G-SITE', { send_page_view: false }],
            ['config', 'G-A', { send_page_view: false }],
        ]);
        expect(fbq.mock.calls.filter((call) => call[0] === 'init')).toEqual([
            ['init', 'PIXEL-SITE'],
            ['init', 'PIXEL-A'],
        ]);
        expect(gtagEvents('page_view')).toEqual([]);
        expect(pixelEvents('PageView')).toEqual([]);
        expect(gtmLayer('GTM-A')).toEqual(expect.arrayContaining([
            expect.objectContaining({ 'gtm.start': expect.any(Number), event: 'gtm.js' }),
        ]));
        expect(window.trackTakeaway).toBe(trackTakeaway);
    });

    it('sends to direct GA4/Meta and GTM by default when all are configured', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);

        trackTakeaway('Takeaway Item Added', commerce);

        expect(gtagEvents('add_to_cart')).toEqual([[
            'event',
            'add_to_cart',
            expect.objectContaining({ send_to: ['G-SITE', 'G-A'] }),
        ]]);
        expect(pixelEvents('AddToCart')).toEqual([
            ['trackSingle', 'PIXEL-SITE', 'AddToCart', expect.any(Object)],
            ['trackSingle', 'PIXEL-A', 'AddToCart', expect.any(Object)],
        ]);
        expect(layer).toEqual([
            { ecommerce: null },
            { event: 'add_to_cart', ecommerce: commerce },
        ]);
    });

    it('lets company GTM own company delivery in gtm mode', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'gtm',
        });
        gtag.mockClear();
        fbq.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);

        trackTakeaway('Takeaway Item Added', commerce);

        expect(gtagEvents('add_to_cart')).toEqual([[
            'event',
            'add_to_cart',
            expect.objectContaining({ send_to: ['G-SITE'] }),
        ]]);
        expect(pixelEvents('AddToCart')).toEqual([[
            'trackSingle',
            'PIXEL-SITE',
            'AddToCart',
            expect.any(Object),
        ]]);
        expect(layer).toEqual([
            { ecommerce: null },
            { event: 'add_to_cart', ecommerce: commerce },
        ]);
    });
});

describe('page views, queues, and company switching', () => {
    it('sends one manual page view with a full page_location to every active destination', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        gtag.mockClear();
        fbq.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);

        trackPageView('/funkybhangra/order?lng=en', 'Order');
        trackPageView('/funkybhangra/order?lng=en', 'Order');

        const pageProperties = {
            page_location: 'https://takeaway.dineout.is/funkybhangra/order?lng=en',
            page_title: 'Order',
        };
        expect(gtagEvents('page_view')).toEqual([[
            'event',
            'page_view',
            { ...pageProperties, send_to: ['G-SITE', 'G-A'] },
        ]]);
        expect(pixelEvents('PageView')).toEqual([
            ['trackSingle', 'PIXEL-SITE', 'PageView', pageProperties],
            ['trackSingle', 'PIXEL-A', 'PageView', pageProperties],
        ]);
        expect(layer).toEqual([{ event: 'page_view', ...pageProperties }]);
    });

    it('redacts confirmation GUIDs from page-view paths, queries, and hashes', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();
        const confirmationId = '018f3f17-7a4b-7cc8-98c4-2af0c1a2b3c4';

        trackPageView(
            `/order/success/${confirmationId}?confirmation=${confirmationId}#${confirmationId}`,
            'Success',
        );

        const outboundPayloads = JSON.stringify({
            ga4: gtagEvents('page_view'),
            meta: pixelEvents('PageView'),
        });
        expect(outboundPayloads).not.toContain(confirmationId);
        expect(outboundPayloads).toContain(':confirmation_id');
    });

    it('sends only the latest page view recorded before initialization', async () => {
        trackPageView('/first', 'First');
        trackPageView('/second?step=checkout', 'Second');
        fetchMock.mockResolvedValue(response(configA));

        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });

        expect(gtagEvents('page_view')).toEqual([[
            'event',
            'page_view',
            {
                page_location: 'https://takeaway.dineout.is/second?step=checkout',
                page_title: 'Second',
                send_to: ['G-SITE', 'G-A'],
            },
        ]]);
    });

    it('replays a page view only to a destination activated later', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'direct',
        });
        trackPageView('/funkybhangra/order?lng=en', 'Order');
        gtag.mockClear();
        fbq.mockClear();

        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        const layer = gtmLayer('GTM-A');

        expect(gtagEvents('page_view')).toEqual([]);
        expect(pixelEvents('PageView')).toEqual([]);
        expect(layer.filter((entry) => entry.event === 'page_view')).toEqual([
            {
                event: 'page_view',
                page_location: 'https://takeaway.dineout.is/funkybhangra/order?lng=en',
                page_title: 'Order',
            },
        ]);
    });

    it('delivers a page view recorded while platform-only to the company that activates afterwards, without repeating platform destinations', async () => {
        const platformConfig: TrackingConfig = {
            dineoutGATrackingId: 'G-SITE',
            dineoutFbPixelId: 'PIXEL-SITE',
        };
        fetchMock.mockResolvedValueOnce(response(platformConfig));
        await renderTracking({ platform: 'dineout' });

        // The app records the restaurant page view while the restaurant id is
        // still resolving, so only platform destinations exist at this point.
        trackPageView('/funkybhangra/order?lng=en', 'Order');
        expect(gtagEvents('page_view')).toEqual([[
            'event',
            'page_view',
            expect.objectContaining({ send_to: ['G-SITE'] }),
        ]]);

        gtag.mockClear();
        fbq.mockClear();

        // The id resolves and the company configuration activates a beat later.
        fetchMock.mockResolvedValueOnce(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });

        const pageProperties = {
            page_location: 'https://takeaway.dineout.is/funkybhangra/order?lng=en',
            page_title: 'Order',
        };

        // The company's direct GA4/Meta and its GTM now receive the same view...
        expect(gtagEvents('page_view')).toEqual([[
            'event',
            'page_view',
            { ...pageProperties, send_to: ['G-A'] },
        ]]);
        expect(pixelEvents('PageView')).toEqual([
            ['trackSingle', 'PIXEL-A', 'PageView', pageProperties],
        ]);
        expect(gtmLayer('GTM-A').filter((entry) => entry.event === 'page_view')).toEqual([
            { event: 'page_view', ...pageProperties },
        ]);

        // ...and the already-delivered platform destinations are not repeated.
        expect(
            gtagEvents('page_view').flatMap(
                (call) => (call[2] as { send_to: string[] }).send_to,
            ),
        ).not.toContain('G-SITE');
        expect(pixelEvents('PageView').map((call) => call[1])).not.toContain('PIXEL-SITE');
    });

    it('does not attach a page view for a different URL to a company that activates later', async () => {
        const platformConfig: TrackingConfig = {
            dineoutGATrackingId: 'G-SITE',
            dineoutFbPixelId: 'PIXEL-SITE',
        };
        fetchMock.mockResolvedValueOnce(response(platformConfig));
        await renderTracking({ platform: 'dineout' });

        // A page view for a page other than the current location.
        trackPageView('/somewhere/else', 'Elsewhere');
        gtag.mockClear();
        fbq.mockClear();

        fetchMock.mockResolvedValueOnce(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });

        // The stale, non-current page view is never leaked to the company.
        expect(gtagEvents('page_view')).toEqual([]);
        expect(pixelEvents('PageView')).toEqual([]);
        expect(gtmLayer('GTM-A').filter((entry) => entry.event === 'page_view')).toEqual([]);
    });

    it('flushes an event fired before the first component into the first configuration', async () => {
        trackTakeaway('Takeaway Item Added', commerce);
        expect(getEventQueue()).toHaveLength(1);
        fetchMock.mockResolvedValue(response(configA));

        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });

        expect(getEventQueue()).toEqual([]);
        expect(gtagEvents('add_to_cart')).toEqual([[
            'event',
            'add_to_cart',
            expect.objectContaining({ send_to: ['G-SITE', 'G-A'] }),
        ]]);
    });

    it('queues during a company switch and never sends the event to the old restaurant', async () => {
        fetchMock.mockResolvedValueOnce(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();

        const nextConfig = deferred<Response>();
        fetchMock.mockReturnValueOnce(nextConfig.promise);
        await renderTracking({ companyIdentifier: 'restaurant-b', platform: 'dineout' }, false);
        expect(isInitialized()).toBe(false);

        trackTakeaway('Takeaway Cart Viewed', commerce);
        expect(gtagEvents('view_cart')).toEqual([]);
        nextConfig.resolve(response(configB));
        await vi.waitFor(() => expect(isInitialized()).toBe(true));

        expect(gtagEvents('view_cart')).toEqual([[
            'event',
            'view_cart',
            expect.objectContaining({ send_to: ['G-SITE', 'G-B'] }),
        ]]);
        expect(pixelEvents('ViewCart').map((call) => call[1])).toEqual(['PIXEL-SITE', 'PIXEL-B']);
        expect(pixelEvents('ViewCart').flat()).not.toContain('PIXEL-A');
    });

    it('discards an event scoped to an abandoned configuration generation', async () => {
        const oldConfig = deferred<Response>();
        const newConfig = deferred<Response>();
        fetchMock.mockReturnValueOnce(oldConfig.promise).mockReturnValueOnce(newConfig.promise);

        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' }, false);
        trackTakeaway('Takeaway Item Added', commerce);
        expect(getEventQueue()).toHaveLength(1);

        await renderTracking({ companyIdentifier: 'restaurant-b', platform: 'dineout' }, false);
        newConfig.resolve(response(configB));
        await vi.waitFor(() => expect(isInitialized()).toBe(true));

        expect(getEventQueue()).toEqual([]);
        expect(gtagEvents('add_to_cart')).toEqual([]);
        expect(pixelEvents('AddToCart')).toEqual([]);

        oldConfig.resolve(response(configA));
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(gtagEvents('add_to_cart')).toEqual([]);
    });

    it('ignores a stale configuration response after a faster company switch', async () => {
        const oldConfig = deferred<Response>();
        const newConfig = deferred<Response>();
        fetchMock.mockReturnValueOnce(oldConfig.promise).mockReturnValueOnce(newConfig.promise);

        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' }, false);
        await renderTracking({ companyIdentifier: 'restaurant-b', platform: 'dineout' }, false);
        newConfig.resolve(response(configB));
        await vi.waitFor(() => expect(isInitialized()).toBe(true));
        const staleResponse = response(configA);
        oldConfig.resolve(staleResponse);
        await vi.waitFor(() => expect(staleResponse.json).toHaveBeenCalledOnce());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        trackTakeaway('Takeaway Item Viewed', commerce);
        expect(gtag.mock.calls.some((call) => call[0] === 'config' && call[1] === 'G-A')).toBe(false);
        expect(gtagEvents('view_item')[0]?.[2]).toEqual(expect.objectContaining({
            send_to: ['G-SITE', 'G-B'],
        }));
    });
});

describe('unified dispatch and conversion deduplication', () => {
    it('deduplicates repeated orders per destination but permits a different order ID', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        gtag.mockClear();
        fbq.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);

        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });
        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });

        expect(gtagEvents('purchase')).toHaveLength(1);
        expect(pixelEvents('Purchase')).toHaveLength(2);
        expect(layer.filter((entry) => entry.event === 'purchase')).toHaveLength(1);

        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104583' });

        expect(gtagEvents('purchase')).toHaveLength(2);
        expect(pixelEvents('Purchase')).toHaveLength(4);
        expect(layer.filter((entry) => entry.event === 'purchase')).toHaveLength(2);
    });

    it('retains session deduplication when the confirmation page reloads', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });
        await unmountTracking();

        __resetTrackingForTests();
        gtag.mockClear();
        fbq.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });

        expect(gtagEvents('purchase')).toEqual([]);
        expect(pixelEvents('Purchase')).toEqual([]);
        expect(layer.filter((entry) => entry.event === 'purchase')).toEqual([]);
    });

    it('retries a conversion only for a destination whose previous delivery failed', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();
        gtag.mockImplementationOnce(() => {
            throw new Error('temporary GA outage');
        });

        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });
        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });

        expect(gtagEvents('purchase')).toHaveLength(2);
        expect(pixelEvents('Purchase')).toHaveLength(2);
    });

    it('retries only the Meta pixel whose per-pixel delivery failed', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();
        let companyPixelFailures = 0;
        fbq.mockImplementation((method, pixelId, eventName) => {
            if (
                method === 'trackSingle'
                && pixelId === 'PIXEL-A'
                && eventName === 'Purchase'
                && companyPixelFailures === 0
            ) {
                companyPixelFailures += 1;
                throw new Error('temporary company pixel outage');
            }
        });

        const purchase = { ...commerce, order_id: '104582' };
        trackTakeaway('Takeaway Order Completed', purchase);
        trackTakeaway('Takeaway Order Completed', purchase);
        trackTakeaway('Takeaway Order Completed', purchase);

        expect(gtagEvents('purchase')).toHaveLength(1);
        expect(pixelEvents('Purchase').map((call) => call[1])).toEqual([
            'PIXEL-SITE',
            'PIXEL-A',
            'PIXEL-A',
        ]);
        expect(companyPixelFailures).toBe(1);
    });

    it('replays a conversion only to a destination activated later', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'direct',
        });
        trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });
        gtag.mockClear();
        fbq.mockClear();

        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
        });
        const layer = gtmLayer('GTM-A');

        expect(gtagEvents('purchase')).toEqual([]);
        expect(pixelEvents('Purchase')).toEqual([]);
        expect(layer.filter((entry) => entry.event === 'purchase')).toHaveLength(1);
        expect(layer.find((entry) => entry.event === 'purchase')).toEqual({
            event: 'purchase',
            ecommerce: expect.objectContaining({ transaction_id: '104582' }),
        });
    });

    it('keeps reservation Lead separate from a deposit Purchase', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();

        trackDineout('Reservation Completed', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-1',
            payment_required: false,
        });
        trackDineout('Reservation Completed', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-1',
            payment_required: false,
        });

        expect(gtagEvents('generate_lead')).toHaveLength(1);
        expect(gtagEvents('purchase')).toEqual([]);
        expect(pixelEvents('Lead')).toHaveLength(2);
        expect(pixelEvents('Purchase')).toEqual([]);

        trackDineout('Reservation Deposit Paid', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-1',
            payment_transaction_id: 'payment-1',
            value: 2000,
            currency: 'ISK',
        });
        trackDineout('Reservation Deposit Paid', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-1',
            payment_transaction_id: 'payment-1',
            value: 2000,
            currency: 'ISK',
        });

        expect(gtagEvents('purchase')).toHaveLength(1);
        expect(pixelEvents('Purchase')).toHaveLength(2);

        trackDineout('Reservation Completed', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-2',
            payment_required: true,
        });
        trackDineout('Reservation Deposit Paid', {
            restaurant_id: 'restaurant-a',
            reservation_id: 'reservation-2',
            payment_transaction_id: 'payment-2',
            value: 2500,
            currency: 'ISK',
        });
        expect(gtagEvents('generate_lead')).toHaveLength(2);
        expect(gtagEvents('purchase')).toHaveLength(2);
    });

    it('routes deprecated APIs through the dispatcher only once', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();
        fbq.mockClear();

        dineoutTrack('Reservation Hold Expired');
        sendDineoutEvent('Custom', { name: 'Legacy Ping', source: 'legacy-test' });

        expect(gtagEvents('reservation_hold_expired')).toHaveLength(1);
        expect(gtagEvents('legacy_ping')).toHaveLength(1);
        expect(pixelEvents('ReservationHoldExpired')).toHaveLength(2);
        expect(pixelEvents('LegacyPing')).toHaveLength(2);
    });

    it('rejects invalid events before queueing or delivery', async () => {
        (trackTakeaway as (...args: any[]) => void)('Takeaway Item Added', {
            ...commerce,
            currency: 'isk',
        });
        expect(getEventQueue()).toEqual([]);
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();

        (trackTakeaway as (...args: any[]) => void)('Takeaway Order Completed', commerce);

        expect(gtagEvents()).toEqual([]);
    });
});

describe('Mixpanel dispatch', () => {
    it('delivers descriptive takeaway payloads when the Dineout Mixpanel token is configured', async () => {
        fetchMock.mockResolvedValue(response({
            ...configA,
            dineoutMixpanelToken: 'mixpanel-token',
        }));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        mixpanelMock.track.mockClear();

        trackTakeaway('Takeaway Item Added', commerce);

        expect(mixpanelMock.track).toHaveBeenCalledWith('Takeaway Item Added', commerce);

        mixpanelMock.track.mockClear();
        trackPageView('/funkybhangra/order?lng=en', 'Order');
        expect(mixpanelMock.track).toHaveBeenCalledWith('Page Viewed', {
            page_location: 'https://takeaway.dineout.is/funkybhangra/order?lng=en',
            page_title: 'Order',
        });
    });

    it('deduplicates order, reservation Lead, and deposit conversions across a session reload', async () => {
        const mixpanelConfig = {
            ...configA,
            dineoutMixpanelToken: 'mixpanel-token',
        };
        fetchMock.mockResolvedValue(response(mixpanelConfig));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        mixpanelMock.track.mockClear();

        const emitConversions = () => {
            trackTakeaway('Takeaway Order Completed', { ...commerce, order_id: '104582' });
            trackDineout('Reservation Completed', {
                restaurant_id: 'restaurant-a',
                reservation_id: 'reservation-1',
                payment_required: true,
            });
            trackDineout('Reservation Deposit Paid', {
                restaurant_id: 'restaurant-a',
                reservation_id: 'reservation-1',
                payment_transaction_id: 'payment-1',
                value: 2000,
                currency: 'ISK',
            });
        };

        emitConversions();
        emitConversions();
        expect(mixpanelMock.track.mock.calls.map((call) => call[0])).toEqual([
            'Takeaway Order Completed',
            'Reservation Completed',
            'Reservation Deposit Paid',
        ]);

        await unmountTracking();
        __resetTrackingForTests();
        mixpanelMock.track.mockClear();
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        emitConversions();

        expect(mixpanelMock.track).not.toHaveBeenCalled();
    });
});

describe('debug mode', () => {
    it('flags direct GA4 events and page views for DebugView without touching other destinations', async () => {
        fetchMock.mockResolvedValue(response({
            ...configA,
            dineoutMixpanelToken: 'mixpanel-token',
        }));
        await renderTracking({
            companyIdentifier: 'restaurant-a',
            platform: 'dineout',
            companyTrackingMode: 'both',
            debug: true,
        });
        gtag.mockClear();
        fbq.mockClear();
        mixpanelMock.track.mockClear();
        const layer = gtmLayer('GTM-A');
        layer.splice(0);

        trackTakeaway('Takeaway Item Added', commerce);
        trackPageView('/funkybhangra/order?lng=en', 'Order');

        // Direct GA4 event and page view both carry debug_mode.
        expect(gtagEvents('add_to_cart')[0]?.[2]).toEqual(
            expect.objectContaining({ debug_mode: true }),
        );
        expect(gtagEvents('page_view')[0]?.[2]).toEqual(
            expect.objectContaining({ debug_mode: true }),
        );

        // GTM, Meta, and Mixpanel payloads are left clean.
        expect(pixelEvents().every((call) => !('debug_mode' in (call[3] as object)))).toBe(true);
        expect(layer.every((entry) => !('debug_mode' in entry))).toBe(true);
        expect(
            mixpanelMock.track.mock.calls.every(
                (call) => !('debug_mode' in ((call[1] as object) ?? {})),
            ),
        ).toBe(true);
    });

    it('omits debug_mode by default', async () => {
        fetchMock.mockResolvedValue(response(configA));
        await renderTracking({ companyIdentifier: 'restaurant-a', platform: 'dineout' });
        gtag.mockClear();

        trackTakeaway('Takeaway Item Added', commerce);
        trackPageView('/funkybhangra/order?lng=en', 'Order');

        expect(gtagEvents('add_to_cart')[0]?.[2]).toEqual(
            expect.not.objectContaining({ debug_mode: expect.anything() }),
        );
        expect(gtagEvents('page_view')[0]?.[2]).toEqual(
            expect.not.objectContaining({ debug_mode: expect.anything() }),
        );
    });
});
