import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConversationStore } from '../../lib/chat/telegram/services/conversation-store';

describe('conversation-store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-18T00:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns and refreshes conversation id before TTL expiry', () => {
        const store = createConversationStore({
            maxEntries: 10,
            ttlMs: 60_000,
            cleanupIntervalMs: 10_000
        });

        store.set(100, 'conv-a');
        expect(store.get(100)).toBe('conv-a');

        vi.advanceTimersByTime(30_000);
        expect(store.get(100)).toBe('conv-a');

        vi.advanceTimersByTime(50_000);
        expect(store.get(100)).toBe('conv-a');
    });

    it('expires conversation id after TTL', () => {
        const store = createConversationStore({
            maxEntries: 10,
            ttlMs: 1_000,
            cleanupIntervalMs: 1_000
        });

        store.set(200, 'conv-b');
        expect(store.get(200)).toBe('conv-b');

        vi.advanceTimersByTime(1_001);
        expect(store.get(200)).toBeUndefined();
    });

    it('evicts the least recently used conversation when max entries is exceeded', () => {
        const store = createConversationStore({
            maxEntries: 2,
            ttlMs: 60_000,
            cleanupIntervalMs: 10_000
        });

        store.set(1, 'conv-1');
        store.set(2, 'conv-2');

        expect(store.get(1)).toBe('conv-1');

        store.set(3, 'conv-3');

        expect(store.get(1)).toBe('conv-1');
        expect(store.get(2)).toBeUndefined();
        expect(store.get(3)).toBe('conv-3');
    });
});