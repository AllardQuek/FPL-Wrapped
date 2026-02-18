import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { registerWebhookAck, consumeWebhookAck } from '../../lib/chat/telegram/services/ack-registry';

describe('ack-registry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('consumes a registered ack once', () => {
        registerWebhookAck(42, 1001);

        expect(consumeWebhookAck(42)).toBe(1001);
        expect(consumeWebhookAck(42)).toBeUndefined();
    });

    it('expires ack after ttl', () => {
        registerWebhookAck(43, 2002);

        vi.advanceTimersByTime(60_001);

        expect(consumeWebhookAck(43)).toBeUndefined();
    });
});
