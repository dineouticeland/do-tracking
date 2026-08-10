import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    __resetGoogleForTests,
    initGA4,
    initGTM,
    setActiveGA4MeasurementIds,
    setActiveGTMContainerIds,
    trackToGA4,
    trackToGTM,
} from '../src/integrations/google.js';

type GoogleWindow = Window & {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
    gtag?: (...args: unknown[]) => void;
    [key: string]: unknown;
};

const googleWindow = window as GoogleWindow;

describe('Google delivery', () => {
    beforeEach(() => {
        __resetGoogleForTests();
        document.head.replaceChildren();
        Reflect.deleteProperty(googleWindow, 'gtag');
        Reflect.deleteProperty(googleWindow, 'dataLayer');
        delete googleWindow.doTrackingGtm_GTM_A;
        delete googleWindow.doTrackingGtm_GTM_B;
    });

    it('configures each GA4 destination once without an automatic page view', () => {
        const gtag = vi.fn();
        googleWindow.gtag = gtag;

        initGA4('G-A');
        initGA4('G-A');

        expect(gtag).toHaveBeenCalledTimes(1);
        expect(gtag).toHaveBeenCalledWith('config', 'G-A', { send_page_view: false });
    });

    it('routes GA4 events only to the currently active destinations by default', () => {
        const gtag = vi.fn();
        googleWindow.gtag = gtag;
        initGA4('G-A');
        initGA4('G-B');
        gtag.mockClear();

        setActiveGA4MeasurementIds(['G-B']);
        trackToGA4('add_to_cart', { value: 2500, currency: 'ISK' });

        expect(gtag).toHaveBeenCalledOnce();
        expect(gtag).toHaveBeenCalledWith('event', 'add_to_cart', {
            value: 2500,
            currency: 'ISK',
            send_to: ['G-B'],
        });
    });

    it('filters explicit GA4 targets so an inactive initialized ID cannot receive an event', () => {
        const gtag = vi.fn();
        googleWindow.gtag = gtag;
        initGA4('G-A');
        initGA4('G-B');
        gtag.mockClear();
        setActiveGA4MeasurementIds(['G-B']);

        const delivered = trackToGA4(
            'purchase',
            { transaction_id: 'order-42', value: 4200, currency: 'ISK' },
            ['G-A', 'G-B'],
        );

        expect(delivered).toEqual(['G-B']);
        expect(gtag).toHaveBeenCalledOnce();
        expect(gtag).toHaveBeenCalledWith('event', 'purchase', {
            transaction_id: 'order-42',
            value: 4200,
            currency: 'ISK',
            send_to: ['G-B'],
        });
        expect(JSON.stringify(gtag.mock.calls)).not.toContain('G-A');
    });

    it('initializes each GTM container once on its own data layer', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1234);

        initGTM('GTM-A');
        initGTM('GTM-A');

        expect(googleWindow.doTrackingGtm_GTM_A).toEqual([
            { 'gtm.start': 1234, event: 'gtm.js' },
        ]);
    });

    it('clears stale ecommerce data before pushing a standard GTM ecommerce event', () => {
        initGTM('GTM-A');
        const layer = googleWindow.doTrackingGtm_GTM_A as Array<Record<string, unknown>>;
        layer.splice(0);
        const payload = {
            event: 'purchase',
            ecommerce: {
                transaction_id: 'order-42',
                value: 4200,
                currency: 'ISK',
                items: [{ item_id: 'burger', item_name: 'Burger', price: 4200, quantity: 1 }],
            },
        };

        trackToGTM(payload);

        expect(layer).toEqual([{ ecommerce: null }, payload]);
    });

    it('does not leak GTM events to a previously active restaurant', () => {
        initGTM('GTM-A');
        initGTM('GTM-B');
        const oldLayer = googleWindow.doTrackingGtm_GTM_A as Array<Record<string, unknown>>;
        const activeLayer = googleWindow.doTrackingGtm_GTM_B as Array<Record<string, unknown>>;
        oldLayer.splice(0);
        activeLayer.splice(0);

        setActiveGTMContainerIds(['GTM-B']);
        trackToGTM({ event: 'view_cart', ecommerce: { value: 1000, currency: 'ISK', items: [] } });

        expect(oldLayer).toEqual([]);
        expect(activeLayer).toEqual([
            { ecommerce: null },
            { event: 'view_cart', ecommerce: { value: 1000, currency: 'ISK', items: [] } },
        ]);
    });
});
