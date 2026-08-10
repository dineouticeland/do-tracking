import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as {
    version: string;
    files: string[];
    scripts: Record<string, string>;
};

describe('v2 package metadata', () => {
    it('prepares version 2.0.0 without publishing it', () => {
        expect(packageJson.version).toBe('2.0.0');
    });

    it('ships the v2 migration guide and exposes repeatable test commands', () => {
        expect(packageJson.files).toContain('MIGRATION.md');
        expect(packageJson.scripts.test).toBe('vitest run');
        expect(packageJson.scripts['test:watch']).toBe('vitest');
    });
});
