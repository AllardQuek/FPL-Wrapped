import { describe, it, expect, vi } from 'vitest';
import { createTelegramChatService } from '../../lib/chat/telegram/services/chat-service';

type ChatSettings = { persona?: string; tone?: string };

describe('chat-service (simple)', () => {
    it('replies with waiting message when chat is already processing', async () => {
        const conversationIdsByChatId = new Map<number, string>();
        const chatProcessing = new Set<number>();
        const chatSettingsByChatId = new Map<number, ChatSettings>();

        // simulate chat 123 is already processing
        chatProcessing.add(123);

        const consumeWebhookAck = vi.fn();

        const service = createTelegramChatService({
            conversationIdsByChatId,
            chatProcessing,
            chatSettingsByChatId,
            consumeWebhookAck
        });

        const reply = vi.fn().mockResolvedValue(undefined);
        const ctx = { chat: { id: 123 }, message: { text: 'hello' }, reply };

        await service(ctx as unknown as Parameters<ReturnType<typeof createTelegramChatService>>[0], 'hello');

        expect(reply).toHaveBeenCalledWith('⏳ Please wait — I am still processing your previous request.');
        // ensure we didn't modify the set (still contains 123)
        expect(chatProcessing.has(123)).toBe(true);
    });
});
