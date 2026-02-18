import { Markup } from 'telegraf';
import { streamChatWithAgent } from '../../elastic-agent';
import { buildFinalPrompt } from '../../prompt';
import { saveChartSpec } from '../../chart-storage';
import { renderTelegramHtml, splitTelegramMessage } from '../render';
import { safeEditMessageHtml, safeReplyHtml } from '../safe-telegram';
import type { TelegramTextCommandContext } from '../types';
import { isServiceDownError, toErrorMessage, SERVICE_DOWN_MESSAGE } from '../../utils';

type ChatSettings = { persona?: string; tone?: string };

type CreateTelegramChatServiceOptions = {
    conversationIdsByChatId: Map<number, string>;
    chatProcessing: Set<number>;
    chatSettingsByChatId: Map<number, ChatSettings>;
    consumeWebhookAck: (chatId: number) => number | undefined;
    streamInactivityTimeoutMs?: number;
};

function isConversationNotFoundError(error: unknown): boolean {
    const message = toErrorMessage(error);

    if (message.includes('conversationNotFound')) return true;
    if (message.toLowerCase().includes('conversation') && message.toLowerCase().includes('not found')) return true;

    try {
        const parsed = JSON.parse(message);
        return parsed?.code === 'conversationNotFound';
    } catch {
        return false;
    }
}

export function createTelegramChatService(options: CreateTelegramChatServiceOptions) {
    const {
        conversationIdsByChatId,
        chatProcessing,
        chatSettingsByChatId,
        consumeWebhookAck,
        streamInactivityTimeoutMs = 30_000
    } = options;

    return async function handleChat(ctx: TelegramTextCommandContext, question: string) {
        const chatId = ctx.chat.id;
        if (chatProcessing.has(chatId)) {
            await ctx.reply('⏳ Please wait — I am still processing your previous request.');
            return;
        }

        chatProcessing.add(chatId);
        const conversationId = conversationIdsByChatId.get(chatId);

        let fullContent = '';
        let latestConversationId = conversationId;
        let currentStatus = 'Thinking...';

        const settings = chatSettingsByChatId.get(chatId) || {};
        const promptToSend = buildFinalPrompt(question, {
            personaKey: settings.persona,
            toneId: settings.tone,
            includeViz: true
        });

        let placeholder: { message_id: number };
        const ackId = consumeWebhookAck(chatId);
        if (ackId) {
            placeholder = { message_id: ackId };
        } else {
            placeholder = await ctx.reply('🤔 Thinking...');
        }

        const streamResponse = async (conversationIdForRequest?: string) => {
            let lastUpdate = Date.now();
            const ac = new AbortController();
            let lastChunkAt = Date.now();

            const inactivityChecker = setInterval(() => {
                if (Date.now() - lastChunkAt > streamInactivityTimeoutMs) {
                    console.warn(`[Telegram] stream inactive for ${streamInactivityTimeoutMs}ms, aborting`);
                    try {
                        ac.abort();
                    } catch {
                        // ignore
                    }
                }
            }, 1000);

            if (typeof inactivityChecker === 'object' && inactivityChecker && 'unref' in inactivityChecker) {
                (inactivityChecker as { unref: () => void }).unref();
            }

            try {
                for await (const chunk of streamChatWithAgent(promptToSend, conversationIdForRequest, { includeVegaHint: true, signal: ac.signal })) {
                    lastChunkAt = Date.now();

                    if (chunk.conversationId && chunk.conversationId !== latestConversationId) {
                        latestConversationId = chunk.conversationId;
                        conversationIdsByChatId.set(chatId, latestConversationId);
                        console.debug(`[Telegram] updated conversationId mid-stream: ${latestConversationId}`);
                    }

                    try {
                        console.debug('[Telegram] stream chunk', {
                            conversationId: chunk.conversationId,
                            hasContent: !!chunk.content,
                            hasToolCall: !!chunk.toolCall,
                            hasToolResult: !!chunk.toolResult,
                            hasReasoning: !!chunk.reasoning,
                            hasError: !!chunk.error
                        });
                    } catch {
                        // ignore logging failures
                    }

                    if (chunk.reasoning) {
                        const reasoning = chunk.reasoning.trim();
                        if (reasoning.length > 5) {
                            const snippet = reasoning.length > 50 ? `${reasoning.substring(0, 47)}...` : reasoning;
                            currentStatus = `Analyzing: ${snippet.toLowerCase()}`;
                        }
                    }

                    if (chunk.toolCall) {
                        const toolName = chunk.toolCall.tool_id.replace(/_/g, ' ');
                        currentStatus = `Using tool: ${toolName}`;
                    }

                    if (chunk.toolResult) {
                        currentStatus = 'Processing results...';
                        try {
                            console.debug('[Telegram] toolResult chunk', chunk.toolResult);
                        } catch {
                            // ignore logging failures
                        }
                    }

                    if (chunk.content) {
                        fullContent += chunk.content;
                    }

                    if (Date.now() - lastUpdate > 1200) {
                        const rendered = renderTelegramHtml(fullContent);
                        const separator = '────────────────────';
                        const statusHtml = `\n\n${separator}\n<i>⚡️ ${currentStatus}</i>`;
                        const previewHtml = rendered ? `${rendered}${statusHtml}` : `<i>⚡️ ${currentStatus}</i>`;
                        const previewChunk = splitTelegramMessage(previewHtml)[0];
                        await safeEditMessageHtml(ctx, chatId, placeholder.message_id, previewChunk);
                        lastUpdate = Date.now();
                    }

                    if (chunk.error) {
                        throw new Error(chunk.error);
                    }
                }

                return { fullContent, latestConversationId };
            } catch (error) {
                if ((error as Error)?.name === 'AbortError' || ac.signal.aborted) {
                    throw new Error('Stream inactivity timeout (no data received)');
                }
                throw error;
            } finally {
                clearInterval(inactivityChecker);
            }
        };

        try {
            console.debug(`[Telegram] starting stream for chat ${chatId} with conversationId=${conversationId}`);

            try {
                await streamResponse(conversationId);
            } catch (firstError) {
                if (!isConversationNotFoundError(firstError)) {
                    throw firstError;
                }

                conversationIdsByChatId.delete(chatId);
                const sessionResetOk = await safeEditMessageHtml(
                    ctx,
                    chatId,
                    placeholder.message_id,
                    renderTelegramHtml('🔄 Session expired, starting a new chat...')
                );
                if (!sessionResetOk) {
                    await safeReplyHtml(ctx, renderTelegramHtml('🔄 Session expired, starting a new chat...'));
                }
                await streamResponse(undefined);
            }

            const vegaMatch = fullContent.match(/```(?:vega-lite|vega)\n([\s\S]*?)```/i);
            const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app';
            const appUrl = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`;
            const extra: Record<string, unknown> = {};

            if (vegaMatch) {
                try {
                    const spec = vegaMatch[1];
                    const chartId = await saveChartSpec(spec, String(chatId));
                    const chartUrl = `${appUrl}/chat/chart/${chartId}`;

                    extra.reply_markup = Markup.inlineKeyboard([[Markup.button.webApp('📊 View Chart', chartUrl)]]).reply_markup;
                } catch (error) {
                    console.error('[Telegram] Failed to save/link chart:', error);
                }
            }

            const finalHtml = renderTelegramHtml(fullContent);
            const finalChunks = splitTelegramMessage(finalHtml);

            const finalEditOk = await safeEditMessageHtml(ctx, chatId, placeholder.message_id, finalChunks[0], extra);
            if (!finalEditOk) {
                await safeReplyHtml(ctx, finalChunks[0], extra);
            }

            for (let index = 1; index < finalChunks.length; index++) {
                const chunkExtra = index === finalChunks.length - 1 ? extra : {};
                await safeReplyHtml(ctx, finalChunks[index], chunkExtra);
            }
        } catch (error: unknown) {
            console.error('Telegram bot error:', error);
            const errorText = toErrorMessage(error);

            let userFriendlyMsg = isServiceDownError(errorText)
                ? SERVICE_DOWN_MESSAGE
                : `❌ Sorry, I encountered an error: ${errorText}`;

            if (errorText.toLowerCase().includes('inactivity timeout') || errorText.toLowerCase().includes('no data received')) {
                userFriendlyMsg = '❌ Request timed out while waiting for a response. I kept the session active — you can try sending your message again.';
            }

            if (fullContent.trim()) {
                const rendered = renderTelegramHtml(fullContent);
                const separator = '────────────────────';
                const finalHtml = `${rendered}\n\n${separator}\n${userFriendlyMsg}`;
                const previewChunk = splitTelegramMessage(finalHtml)[0];
                const partialEditOk = await safeEditMessageHtml(ctx, chatId, placeholder.message_id, previewChunk);
                if (!partialEditOk) {
                    await safeReplyHtml(ctx, previewChunk);
                }
            } else {
                const errorEditOk = await safeEditMessageHtml(
                    ctx,
                    chatId,
                    placeholder.message_id,
                    renderTelegramHtml(userFriendlyMsg)
                );
                if (!errorEditOk) {
                    await ctx.reply(userFriendlyMsg).catch(() => {});
                }
            }
        } finally {
            chatProcessing.delete(chatId);
        }
    };
}