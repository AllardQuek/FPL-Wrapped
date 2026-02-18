import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock dependencies before importing the route
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => p }));

vi.mock('@/lib/chat/telegram-bot', () => {
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 555 });
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    return {
        bot: {
            telegram: { sendMessage },
            handleUpdate
        }
    };
});

vi.mock('@/lib/chat/telegram/services/ack-registry', () => ({
    registerWebhookAck: vi.fn()
}));

import { POST } from '../../app/api/webhook/telegram/route';

describe('webhook route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends quick ack and registers it for normal text messages', async () => {
        const body = { message: { chat: { id: 123 }, text: 'Hello there' } };

        const req = { json: async () => body } as unknown as NextRequest;

        const res = await POST(req);

        // route returns ok
        const json = await res.json();
        expect(json).toEqual({ ok: true });

        // bot.telegram.sendMessage called and registerWebhookAck called with message id
        const botMod = await import('@/lib/chat/telegram-bot');
        const ackMod = await import('@/lib/chat/telegram/services/ack-registry');
        if (!botMod.bot) {
            throw new Error('Expected bot to be initialized in test mock');
        }
        expect(botMod.bot.telegram.sendMessage).toHaveBeenCalledWith(123, '🤔 Thinking...');
        expect(ackMod.registerWebhookAck).toHaveBeenCalledWith(123, 555);
    });

    it('does not send ack for slash commands', async () => {
        const body = { message: { chat: { id: 222 }, text: '/index_manager 1' } };
        const req = { json: async () => body } as unknown as NextRequest;

        const res = await POST(req);
        const json = await res.json();
        expect(json).toEqual({ ok: true });

        const botMod2 = await import('@/lib/chat/telegram-bot');
        const ackMod2 = await import('@/lib/chat/telegram/services/ack-registry');
        if (!botMod2.bot) {
            throw new Error('Expected bot to be initialized in test mock');
        }
        expect(botMod2.bot.telegram.sendMessage).not.toHaveBeenCalledWith(222, expect.any(String));
        expect(ackMod2.registerWebhookAck).not.toHaveBeenCalledWith(222, expect.any(Number));
    });
});
