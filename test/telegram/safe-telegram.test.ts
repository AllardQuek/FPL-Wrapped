import { describe, it, expect, vi } from 'vitest';
import { safeEditMessageHtml, safeReplyHtml } from '../../lib/chat/telegram/safe-telegram';
import type { TelegramChatContext } from '../../lib/chat/telegram/types';

type ReplyContext = {
    reply: (text: string, extra?: Record<string, unknown>) => Promise<void>;
};

type EditContext = {
    telegram: {
        editMessageText: (
            chatId: number,
            messageId: number,
            inlineMessageId: string | undefined,
            text: string,
            extra?: Record<string, unknown>
        ) => Promise<void>;
    };
};

describe('safe-telegram', () => {
    it('falls back to plain-text reply when HTML reply fails', async () => {
        const reply = vi.fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce(undefined);

        const ctx: ReplyContext = {
            reply: async (text: string, extra?: Record<string, unknown>) => reply(text, extra)
        };

        await safeReplyHtml(ctx as unknown as TelegramChatContext, '<b>hello</b> world');

        expect(reply).toHaveBeenCalledTimes(2);
        expect(reply).toHaveBeenCalledWith('<b>hello</b> world', expect.objectContaining({ parse_mode: 'HTML' }));
        expect(reply).toHaveBeenCalledWith('hello world', {});
    });

    it('falls back to plain-text edit when HTML edit fails', async () => {
        const editMessageText = vi.fn()
            .mockRejectedValueOnce(new Error('edit fail'))
            .mockResolvedValueOnce(undefined);

        const ctx: EditContext = {
            telegram: {
                editMessageText: async (
                    chatId: number,
                    messageId: number,
                    inlineMessageId: string | undefined,
                    text: string,
                    extra?: Record<string, unknown>
                ) => editMessageText(chatId, messageId, inlineMessageId, text, extra)
            }
        };

        const result = await safeEditMessageHtml(ctx as unknown as TelegramChatContext, 11, 22, '<b>hi</b>', {});

        expect(result).toBe(true);
        expect(editMessageText).toHaveBeenCalledTimes(2);

        // first call used HTML
        expect(editMessageText.mock.calls[0][3]).toBe('<b>hi</b>');
        expect(editMessageText.mock.calls[0][4]).toEqual(expect.objectContaining({ parse_mode: 'HTML' }));

        // second call used stripped text
        expect(editMessageText.mock.calls[1][3]).toBe('hi');
        expect(editMessageText.mock.calls[1][4]).not.toEqual(expect.objectContaining({ parse_mode: 'HTML' }));
    });
});
