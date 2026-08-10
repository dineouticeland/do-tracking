import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'https://takeaway.dineout.is/funkybhangra/order?lng=en',
            },
        },
        include: ['tests/**/*.test.{ts,tsx}'],
        setupFiles: ['./tests/setup.ts'],
        clearMocks: true,
        restoreMocks: true,
        unstubGlobals: true,
    },
});
