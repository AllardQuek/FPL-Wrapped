import { describe, expect, it } from 'vitest';
import { createUpdateDeduper } from '../../lib/chat/telegram/services/update-dedupe';

describe('createUpdateDeduper', () => {
    it('processes a new update id only once', () => {
        const deduper = createUpdateDeduper(10);

        expect(deduper.shouldProcess(123)).toBe(true);
        expect(deduper.shouldProcess(123)).toBe(false);
    });

    it('evicts oldest ids when cache limit is exceeded', () => {
        const deduper = createUpdateDeduper(2);

        expect(deduper.shouldProcess(1)).toBe(true);
        expect(deduper.shouldProcess(2)).toBe(true);
        expect(deduper.shouldProcess(3)).toBe(true);

        expect(deduper.shouldProcess(3)).toBe(false);
        expect(deduper.shouldProcess(2)).toBe(false);
        expect(deduper.shouldProcess(1)).toBe(true);
    });
});
