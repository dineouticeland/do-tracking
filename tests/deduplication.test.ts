import { beforeEach, describe, expect, it } from 'vitest';

import {
    __resetDeduplicationForTests,
    markDestinationsDelivered,
    pendingDestinations,
    wasDelivered,
} from '../src/integrations/deduplication.js';

describe('conversion delivery deduplication', () => {
    beforeEach(() => {
        sessionStorage.clear();
        __resetDeduplicationForTests();
    });

    it('deduplicates a conversion independently for each destination', () => {
        markDestinationsDelivered('takeaway_purchase:42', 'ga4', ['G-A']);

        expect(pendingDestinations('takeaway_purchase:42', 'ga4', ['G-A', 'G-B'])).toEqual(['G-B']);
        expect(pendingDestinations('takeaway_purchase:42', 'meta', ['PIXEL-A'])).toEqual(['PIXEL-A']);
    });

    it('allows a destination activated later to receive its missing copy', () => {
        markDestinationsDelivered('reservation_lead:r-1', 'ga4', ['G-SITE']);

        expect(pendingDestinations('reservation_lead:r-1', 'ga4', ['G-SITE', 'G-RESTAURANT']))
            .toEqual(['G-RESTAURANT']);
    });

    it('persists conversion delivery across an in-page state reset', () => {
        markDestinationsDelivered('reservation_deposit:pay-1', 'meta', ['PIXEL-A']);
        __resetDeduplicationForTests();

        expect(wasDelivered('reservation_deposit:pay-1', 'meta:PIXEL-A')).toBe(true);
    });

    it('does not suppress a different transaction ID', () => {
        markDestinationsDelivered('takeaway_purchase:42', 'ga4', ['G-A']);

        expect(pendingDestinations('takeaway_purchase:43', 'ga4', ['G-A'])).toEqual(['G-A']);
    });

    it('does not deduplicate ordinary non-conversion events', () => {
        expect(pendingDestinations(undefined, 'ga4', ['G-A', 'G-B'])).toEqual(['G-A', 'G-B']);
        expect(pendingDestinations(undefined, 'ga4', ['G-A', 'G-B'])).toEqual(['G-A', 'G-B']);
    });
});
