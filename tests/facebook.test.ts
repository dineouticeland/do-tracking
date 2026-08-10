import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    __resetFacebookForTests,
    initFacebookPixel,
    setActiveFacebookPixelIds,
    trackToFBPixel,
} from '../src/integrations/facebook.js';

type PixelSpy = ReturnType<typeof vi.fn> & { loaded?: boolean };

function installPixelSpy(): PixelSpy {
    const fbq = vi.fn() as PixelSpy;
    fbq.loaded = true;
    window.fbq = fbq as unknown as Window['fbq'];
    return fbq;
}

describe('Meta Pixel delivery', () => {
    beforeEach(() => {
        __resetFacebookForTests();
        document.head.replaceChildren();
    });

    it('initializes each pixel once and does not send an automatic PageView', () => {
        const fbq = installPixelSpy();

        initFacebookPixel('PIXEL-A');
        initFacebookPixel('PIXEL-A');

        expect(fbq).toHaveBeenCalledTimes(1);
        expect(fbq).toHaveBeenCalledWith('init', 'PIXEL-A');
        expect(fbq).not.toHaveBeenCalledWith('track', 'PageView');
    });

    it('uses trackSingle with a deterministic eventID for a standard conversion', () => {
        const fbq = installPixelSpy();
        initFacebookPixel('PIXEL-A');
        initFacebookPixel('PIXEL-B');
        fbq.mockClear();
        setActiveFacebookPixelIds(['PIXEL-B']);

        const delivered = trackToFBPixel(
            'Purchase',
            false,
            { value: 4200, currency: 'ISK' },
            'takeaway_purchase:42',
        );

        expect(delivered).toEqual(['PIXEL-B']);
        expect(fbq).toHaveBeenCalledOnce();
        expect(fbq).toHaveBeenCalledWith(
            'trackSingle',
            'PIXEL-B',
            'Purchase',
            { value: 4200, currency: 'ISK' },
            { eventID: 'takeaway_purchase:42' },
        );
    });

    it('uses trackSingleCustom for custom events and never leaks to an inactive pixel', () => {
        const fbq = installPixelSpy();
        initFacebookPixel('PIXEL-A');
        initFacebookPixel('PIXEL-B');
        fbq.mockClear();
        setActiveFacebookPixelIds(['PIXEL-B']);

        const delivered = trackToFBPixel('ViewCart', true, { content_ids: ['burger'] });

        expect(delivered).toEqual(['PIXEL-B']);
        expect(fbq).toHaveBeenCalledWith(
            'trackSingleCustom',
            'PIXEL-B',
            'ViewCart',
            { content_ids: ['burger'] },
        );
        expect(fbq.mock.calls.some((call) => call.includes('PIXEL-A'))).toBe(false);
    });
});
