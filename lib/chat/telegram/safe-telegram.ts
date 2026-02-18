import { stripHtmlTags } from './render';
import type { TelegramChatContext } from './types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function safeEditMessageHtml(
    ctx: TelegramChatContext,
    chatId: number,
    messageId: number,
    html: string,
    extra: Record<string, unknown> = {}
): Promise<boolean> {
    const htmlExtra = {
        parse_mode: 'HTML' as const,
        disable_web_page_preview: true,
        ...extra
    };

    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await ctx.telegram.editMessageText(chatId, messageId, undefined, html, htmlExtra);
            return true;
        } catch (error: unknown) {
            lastError = error;
            const err = error as {
                response?: { error_code?: number; parameters?: { retry_after?: number } };
                message?: string;
                description?: string;
            };
            const message = (err?.description || err?.message || '').toLowerCase();

            if (message.includes('message is not modified')) {
                return true;
            }

            const isRateLimited = err?.response?.error_code === 429 || message.includes('too many requests');
            if (isRateLimited && attempt < 2) {
                const retryAfterSeconds = err?.response?.parameters?.retry_after;
                const delayMs = Math.max(1200, (retryAfterSeconds ?? 1) * 1000);
                await wait(delayMs);
                continue;
            }

            break;
        }
    }

    const lastErr = lastError as { description?: string; message?: string } | undefined;
    console.error('[Telegram] HTML edit failed, falling back to plain text:', lastErr?.description || lastErr?.message);

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await ctx.telegram.editMessageText(chatId, messageId, undefined, stripHtmlTags(html), {
                disable_web_page_preview: true,
                ...extra
            });
            return true;
        } catch (fallbackError: unknown) {
            const err = fallbackError as {
                response?: { error_code?: number; parameters?: { retry_after?: number } };
                message?: string;
                description?: string;
            };
            const message = (err?.description || err?.message || '').toLowerCase();

            if (message.includes('message is not modified')) {
                return true;
            }

            const isRateLimited = err?.response?.error_code === 429 || message.includes('too many requests');
            if (isRateLimited && attempt < 1) {
                const retryAfterSeconds = err?.response?.parameters?.retry_after;
                const delayMs = Math.max(1200, (retryAfterSeconds ?? 1) * 1000);
                await wait(delayMs);
                continue;
            }

            console.error('[Telegram] Plain-text edit fallback failed:', err?.description || err?.message);
            break;
        }
    }

    return false;
}

export async function safeReplyHtml(
    ctx: TelegramChatContext,
    html: string,
    extra: Record<string, unknown> = {}
) {
    try {
        await ctx.reply(html, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...extra
        });
        return;
    } catch (error: unknown) {
        const err = error as { description?: string; message?: string };
        console.error('[Telegram] HTML reply failed, falling back to plain text:', err?.description || err?.message);
        await ctx.reply(stripHtmlTags(html), extra).catch(() => {});
    }
}