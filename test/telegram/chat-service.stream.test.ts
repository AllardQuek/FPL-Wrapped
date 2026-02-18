import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTelegramChatService } from '../../lib/chat/telegram/services/chat-service';
import type { ChatStreamChunk } from '../../lib/chat/elastic-agent';
import type { TelegramTextCommandContext } from '../../lib/chat/telegram/types';

type ChatSettings = { persona?: string; tone?: string };

describe('chat-service stream flow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    });

    it('streams content and performs preview + final edit without path mocks', async () => {
        const streamFn = vi.fn(
            async function* (): AsyncGenerator<ChatStreamChunk, void, unknown> {
                vi.setSystemTime(1301);
                yield { content: 'Hello' };

                vi.setSystemTime(2602);
                yield { content: ' world' };
            }
        );

        const safeEditHtml = vi.fn().mockResolvedValue(true);
        const safeReplyHtml = vi.fn().mockResolvedValue(undefined);

        const conversationIdsByChatId = new Map<number, string>();
        const chatProcessing = new Set<number>();
        const chatSettingsByChatId = new Map<number, ChatSettings>();
        const consumeWebhookAck = vi.fn().mockReturnValue(undefined);

        const handleChat = createTelegramChatService(
            {
                conversationIdsByChatId,
                chatProcessing,
                chatSettingsByChatId,
                consumeWebhookAck,
                streamInactivityTimeoutMs: 30_000
            },
            {
                streamChatWithAgent: streamFn,
                safeEditMessageHtml: safeEditHtml,
                safeReplyHtml
            }
        );

        const reply = vi.fn().mockResolvedValue({ message_id: 77 });
        const ctx = {
            chat: { id: 999 },
            message: { text: 'hello' },
            reply,
            telegram: { editMessageText: vi.fn() }
        };

        await handleChat(ctx as unknown as TelegramTextCommandContext, 'hello');

        expect(consumeWebhookAck).toHaveBeenCalledWith(999);
        expect(reply).toHaveBeenCalledWith('🤔 Thinking...');
        expect(streamFn).toHaveBeenCalled();

        // At least one preview edit plus final edit should occur.
        expect(safeEditHtml.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(safeReplyHtml).not.toHaveBeenCalled();

        // processing lock should be released in finally block
        expect(chatProcessing.has(999)).toBe(false);
    });
});
