import { Telegraf, Markup } from 'telegraf';
import { streamChatWithAgent } from './elastic-agent';
import { buildFinalPrompt } from './prompt';
import { AVAILABLE_TONES, TONES, TONE_CONFIG, ToneId } from './constants';
import { PERSONA_MAP } from '../analysis/persona/constants';
import { saveChartSpec } from './chart-storage';
import { 
    isServiceDownError, 
    toErrorMessage, 
    SERVICE_DOWN_MESSAGE 
} from './utils';

const featuredPersonaKeys = ['PEP', 'ARTETA', 'AMORIM', 'MOURINHO'] as const;
type FeaturedPersona = (typeof featuredPersonaKeys)[number];

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot will not be initialized.');
}

/**
 * Initialize Telegraf bot
 */
export const bot = token ? new Telegraf(token) : null;

// Registry for webhook-sent quick-acks. The webhook can register an
// acknowledgement message_id for a chat so the bot can edit that message
// instead of sending a duplicate "Thinking..." placeholder.
const webhookAcks = new Map<number, number>();

export function registerWebhookAck(chatId: number, messageId: number) {
    webhookAcks.set(chatId, messageId);
    // Auto-expire the ack after 60s to avoid stale mappings
    setTimeout(() => webhookAcks.delete(chatId), 60_000).unref?.();
}

export function consumeWebhookAck(chatId: number): number | undefined {
    const id = webhookAcks.get(chatId);
    if (id) webhookAcks.delete(chatId);
    return id;
}

if (bot) {
    const conversationIdsByChatId = new Map<number, string>();
    // Prevent concurrent processing for the same chat to avoid conversation races
    const chatProcessing = new Set<number>();
    // Per-chat settings: persona key, tone id.
    const chatSettingsByChatId = new Map<number, { persona?: string; tone?: string }>();
    const TELEGRAM_CHUNK_LIMIT = 3900;
    const STREAM_INACTIVITY_TIMEOUT_MS = 30_000; // abort stream if no chunks for 30s
    const processedUpdates = new Set<number>();
    const MAX_PROCESSED_UPDATES_CACHE = 1000;

    // Middleware to deduplicate updates (Telegram retries on timeout)
    bot.use(async (ctx, next) => {
        const updateId = ctx.update.update_id;
        if (processedUpdates.has(updateId)) {
            console.log(`[Telegram] Skipping duplicate update ${updateId}`);
            return;
        }

        processedUpdates.add(updateId);

        // Simple cache eviction
        if (processedUpdates.size > MAX_PROCESSED_UPDATES_CACHE) {
            const firstItem = processedUpdates.values().next().value;
            if (firstItem !== undefined) {
                processedUpdates.delete(firstItem);
            }
        }

        return next();
    });

    type ChatContext = {
        chat: { id: number };
        reply: (
            text: string,
            extra?: {
                parse_mode?: 'HTML' | 'MarkdownV2';
                disable_web_page_preview?: boolean;
            }
        ) => Promise<{ message_id: number }>;
        telegram: {
            editMessageText: (
                chatId: number,
                messageId: number,
                inlineMessageId: string | undefined,
                text: string,
                extra?: {
                    parse_mode?: 'HTML' | 'MarkdownV2';
                    disable_web_page_preview?: boolean;
                }
            ) => Promise<unknown>;
        };
    };

    type IndexingContext = ChatContext & {
        message: { text: string };
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

    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function decodeHtmlEntities(text: string): string {
        return text
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
    }

    function stripHtmlTags(text: string): string {
        return decodeHtmlEntities(text.replace(/<[^>]+>/g, ''));
    }

    function renderTelegramHtml(markdown: string): string {
        if (!markdown) return '';

        let text = markdown;
        const tokenMap = new Map<string, string>();
        let tokenIndex = 0;
        const nextToken = () => `@@TG_TOKEN_${tokenIndex++}@@`;

        // Handle Vega-Lite blocks separately to hide them from the main text
        // We use a broader match to include potential surrounding whitespace
        text = text.replace(/\n?```(?:vega-lite|vega)\n([\s\S]*?)(?:```|$)\n?/gi, '');

        // Hide legacy visualization tags and surrounding whitespace
        text = text.replace(/\n?<visualization\s+[^>]*\/>\n?/gi, '');

        text = text.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
            const token = nextToken();
            tokenMap.set(token, `<pre><code>${escapeHtml(String(code).trim())}</code></pre>`);
            return token;
        });

        text = text.replace(/`([^`]+)`/g, (_match, code) => {
            const token = nextToken();
            tokenMap.set(token, `<code>${escapeHtml(String(code).trim())}</code>`);
            return token;
        });

        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => {
            const token = nextToken();
            tokenMap.set(token, `<a href="${escapeHtml(String(url))}">${escapeHtml(String(label))}</a>`);
            return token;
        });

        text = escapeHtml(text);

        text = text.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');
        text = text.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

        text = text.replace(/^\s*[-*]\s+/gm, '• ');
        text = text.replace(/^\s*(\d+)\.\s+/gm, '$1) ');

        text = text.replace(/\*\*\s*([\s\S]+?)\s*\*\*/g, '<b>$1</b>');
        text = text.replace(/__\s*([\s\S]+?)\s*__/g, '<b>$1</b>');
        text = text.replace(/(^|\s)\*\s*([\s\S]+?)\s*\*(?=\s|$|\W)/g, '$1<i>$2</i>');
        text = text.replace(/(^|\s)_\s*([\s\S]+?)\s*_(?=\s|$|\W)/g, '$1<i>$2</i>');

        for (const [token, html] of tokenMap.entries()) {
            text = text.replaceAll(token, html);
        }

        return text.replace(/\n{3,}/g, '\n\n').trim();
    }

    function splitTelegramMessage(html: string): string[] {
        const normalized = html.trim();
        if (!normalized) return ['…'];
        if (normalized.length <= TELEGRAM_CHUNK_LIMIT) return [normalized];

        const chunks: string[] = [];
        const blocks = normalized.split(/\n{2,}/);
        let current = '';

        const pushCurrent = () => {
            if (current.trim()) chunks.push(current.trim());
            current = '';
        };

        const pushOversized = (block: string) => {
            let start = 0;
            while (start < block.length) {
                const slice = block.slice(start, start + TELEGRAM_CHUNK_LIMIT);
                chunks.push(slice);
                start += TELEGRAM_CHUNK_LIMIT;
            }
        };

        for (const block of blocks) {
            const candidate = current ? `${current}\n\n${block}` : block;
            if (candidate.length <= TELEGRAM_CHUNK_LIMIT) {
                current = candidate;
                continue;
            }

            if (current) pushCurrent();

            if (block.length <= TELEGRAM_CHUNK_LIMIT) {
                current = block;
                continue;
            }

            pushOversized(block);
        }

        pushCurrent();
        return chunks.length > 0 ? chunks : ['…'];
    }

    async function safeEditMessageHtml(ctx: ChatContext, chatId: number, messageId: number, html: string, extra: Record<string, unknown> = {}) {
        try {
            await ctx.telegram.editMessageText(chatId, messageId, undefined, html, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...extra
            });
            return;
        } catch (error: unknown) {
            const err = error as { response?: { error_code?: number }; message?: string; description?: string };
            if (err?.response?.error_code === 429 || err?.message?.includes('too many requests')) {
                return;
            }
            console.error('[Telegram] HTML edit failed, falling back to plain text:', err?.description || err?.message);
            await ctx.telegram.editMessageText(chatId, messageId, undefined, stripHtmlTags(html), extra).catch(() => { });
        }
    }

    async function safeReplyHtml(ctx: ChatContext, html: string, extra: Record<string, unknown> = {}) {
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
            await ctx.reply(stripHtmlTags(html), extra).catch(() => { });
        }
    }

    /**
     * Helper to handle chat requests
     */
    async function handleChat(ctx: ChatContext, question: string) {
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
        
        // Apply per-chat settings (persona, tone).
        const settings = chatSettingsByChatId.get(chatId) || {};
        const promptToSend = buildFinalPrompt(question, { 
            personaKey: settings.persona, 
            toneId: settings.tone,
            includeViz: true 
        });

        // Send an initial "typing" or placeholder message. If the webhook
        // already sent a quick ack, consume it so we edit that message
        // instead of creating a duplicate.
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
                if (Date.now() - lastChunkAt > STREAM_INACTIVITY_TIMEOUT_MS) {
                    console.warn(`[Telegram] stream inactive for ${STREAM_INACTIVITY_TIMEOUT_MS}ms, aborting`);
                    try {
                        ac.abort();
                    } catch {
                        // ignore
                    }
                }
            }, 1000);
            
            if (typeof inactivityChecker !== 'number' && 'unref' in inactivityChecker) {
                (inactivityChecker as any).unref();
            }

            try {
                for await (const chunk of streamChatWithAgent(promptToSend, conversationIdForRequest, { includeVegaHint: true, signal: ac.signal })) {
                    lastChunkAt = Date.now();

                    if (chunk.conversationId && chunk.conversationId !== latestConversationId) {
                        latestConversationId = chunk.conversationId;
                        // Cache it immediately so we don't lose it if the stream fails later
                        conversationIdsByChatId.set(chatId, latestConversationId);
                        console.debug(`[Telegram] updated conversationId mid-stream: ${latestConversationId}`);
                    }

                    // Lightweight chunk metadata logging to aid debugging
                    try {
                        console.debug('[Telegram] stream chunk', {
                            conversationId: chunk.conversationId,
                            hasContent: !!chunk.content,
                            hasToolCall: !!chunk.toolCall,
                            hasToolResult: !!chunk.toolResult,
                            hasReasoning: !!chunk.reasoning,
                            hasError: !!chunk.error
                        });
                    } catch { }

                    if (chunk.reasoning) {
                        const r = chunk.reasoning.trim();
                        if (r.length > 5) {
                            const snippet = r.length > 50 ? `${r.substring(0, 47)}...` : r;
                            currentStatus = `Analyzing: ${snippet.toLowerCase()}`;
                        }
                    }

                    if (chunk.toolCall) {
                        const toolName = chunk.toolCall.tool_id.replace(/_/g, ' ');
                        currentStatus = `Using tool: ${toolName}`;
                    }

                    if (chunk.toolResult) {
                        currentStatus = 'Processing results...';
                        try { console.debug('[Telegram] toolResult chunk', chunk.toolResult); } catch { }
                    }

                    if (chunk.content) {
                        fullContent += chunk.content;
                    }

                    // Telegram edit limit is ~1 per second.
                    // We buffer chunks to avoid hitting rate limits.
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
            } catch (err) {
                // If abort signal caused termination, provide a clearer error
                if ((err as Error)?.name === 'AbortError' || ac.signal.aborted) {
                    throw new Error('Stream inactivity timeout (no data received)');
                }
                throw err;
            } finally {
                clearInterval(inactivityChecker as any);
            }
        };

        try {
            let result;

            console.debug(`[Telegram] starting stream for chat ${chatId} with conversationId=${conversationId}`);

            try {
                result = await streamResponse(conversationId);
            } catch (firstError) {
                if (!isConversationNotFoundError(firstError)) {
                    throw firstError;
                }

                // Conversation may have expired server-side; retry once without conversation_id.
                conversationIdsByChatId.delete(chatId);
                await ctx.telegram.editMessageText(
                    chatId,
                    placeholder.message_id,
                    undefined,
                    '🔄 Session expired, starting a new chat...'
                );
                result = await streamResponse(undefined);
            }

            // Check for charts in the final content
            const vegaMatch = fullContent.match(/```(?:vega-lite|vega)\n([\s\S]*?)```/i);
            const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app';
            const appUrl = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`;
            const extra: Record<string, unknown> = {};

            if (vegaMatch) {
                try {
                    const spec = vegaMatch[1];
                    const chartId = await saveChartSpec(spec, String(chatId));
                    const chartUrl = `${appUrl}/chat/chart/${chartId}`;
                    
                    extra.reply_markup = Markup.inlineKeyboard([
                        [Markup.button.webApp('📊 View Chart', chartUrl)]
                    ]).reply_markup;
                } catch (err) {
                    console.error('[Telegram] Failed to save/link chart:', err);
                }
            }

            // Final update with chunked HTML-rendered message
            const finalHtml = renderTelegramHtml(fullContent);
            const finalChunks = splitTelegramMessage(finalHtml);

            await safeEditMessageHtml(
                ctx,
                chatId,
                placeholder.message_id,
                finalChunks[0],
                extra
            );

            for (let i = 1; i < finalChunks.length; i++) {
                // For subsequent chunks, we only attach the button to the last one
                const chunkExtra = (i === finalChunks.length - 1) ? extra : {};
                await safeReplyHtml(ctx, finalChunks[i], chunkExtra);
            }
        } catch (error: unknown) {
            console.error('Telegram bot error:', error);
            const errStr = toErrorMessage(error);

            let userFriendlyMsg = isServiceDownError(errStr)
                ? SERVICE_DOWN_MESSAGE
                : `❌ Sorry, I encountered an error: ${errStr}`;

            if (errStr.toLowerCase().includes('inactivity timeout') || errStr.toLowerCase().includes('no data received')) {
                userFriendlyMsg = '❌ Request timed out while waiting for a response. I kept the session active — you can try sending your message again.';
            }

            // If we have partial content, show it along with the error
            if (fullContent.trim()) {
                const rendered = renderTelegramHtml(fullContent);
                const separator = '────────────────────';
                const finalHtml = `${rendered}\n\n${separator}\n${userFriendlyMsg}`;
                const previewChunk = splitTelegramMessage(finalHtml)[0];
                await safeEditMessageHtml(ctx, chatId, placeholder.message_id, previewChunk);
            } else {
                await ctx.telegram.editMessageText(
                    chatId,
                    placeholder.message_id,
                    undefined,
                    userFriendlyMsg
                ).catch(() => {});
            }
        } finally {
            chatProcessing.delete(chatId);
        }
    }

    /**
     * Helper to handle indexing
     */
    async function handleIndexing(ctx: IndexingContext, type: 'manager' | 'league', id: string) {
        const targetId = parseInt(id);
        if (isNaN(targetId)) {
            return ctx.reply(`❌ Invalid ID provided. Please provide a numeric ${type === 'manager' ? 'Manager' : 'League'} ID.`);
        }

        const statusMessage = await ctx.reply(`🚀 Starting ${type} indexing for ${id}...`);
        const chatId = ctx.chat.id;

        const renderProgressBar = (current: number, total: number) => {
            const size = 10;
            const progress = Math.round((current / total) * size);
            const empty = size - progress;
            return `[${'■'.repeat(progress)}${'□'.repeat(empty)}] ${Math.round((current / total) * 100)}%`;
        };

        let lastUpdate = Date.now();

        try {
            const { indexManagerAllGameweeks, indexLeagueAllGameweeks } = await import('@/lib/elasticsearch/indexing-service');

            if (type === 'manager') {
                await indexManagerAllGameweeks(targetId, 1, undefined, (progress) => {
                    if (Date.now() - lastUpdate > 1500) {
                        ctx.telegram.editMessageText(
                            chatId,
                            statusMessage.message_id,
                            undefined,
                            `⏳ Indexing Manager ${targetId}...\n\n${renderProgressBar(progress.current, progress.total)}\n${progress.message}`
                        ).catch(() => { });
                        lastUpdate = Date.now();
                    }
                });
            } else {
                await indexLeagueAllGameweeks(targetId, 1, undefined, (progress) => {
                    if (Date.now() - lastUpdate > 1500) {
                        const progressText = progress.type === 'manager'
                            ? `⏳ Indexing League ${targetId}...\nManager ${progress.current}/${progress.total}: ${progress.name || 'Unknown'}\n\n${renderProgressBar(progress.current, progress.total)}`
                            : `⏳ Indexing League ${targetId}...\n${progress.message}`;

                        ctx.telegram.editMessageText(
                            chatId,
                            statusMessage.message_id,
                            undefined,
                            progressText
                        ).catch(() => { });
                        lastUpdate = Date.now();
                    }
                });
            }

            await ctx.telegram.editMessageText(
                chatId,
                statusMessage.message_id,
                undefined,
                `✅ Successfully indexed ${type} ${targetId}!\n\nYou can now ask me questions about this data.`
            );
        } catch (error: unknown) {
            console.error('Indexing error:', error);
            const errStr = toErrorMessage(error);
            
            const message = isServiceDownError(errStr)
                ? SERVICE_DOWN_MESSAGE
                : `❌ Indexing failed: ${errStr}`;

            await ctx.telegram.editMessageText(
                chatId,
                statusMessage.message_id,
                undefined,
                `${message}\n\nTry manual indexing at: ${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`
            ).catch(() => {});
        }
    }

    // Handle start command
    bot.start(async (ctx) => {
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        const html = renderTelegramHtml(
            "👋 Welcome to FPL Wrapped Chat!\n\n" +
            "I'm your AI assistant for all things Fantasy Premier League.\n\n" +
            "⚡ **Quick Start:**\n" +
            "If I don't have your data yet, you can index yourself directly:\n" +
            "• `/index_manager <your_id>`\n" +
            "• `/index_league <league_id>`\n\n" +
            "🔎 **Chat:**\n" +
            "Just send me a message directly — no command needed.\n\n" +
            "⚙️ **Settings:**\n" +
            "Customize my personality and tone:\n" +
            "• `/set_persona PEP` - Set manager persona (PEP, ARTETA, etc.)\n" +
            "• `/set_tone roast` - Set tone (balanced, roast, optimist, delulu)\n" +
            "• `/settings` - View current chat settings\n\n" +
            "ℹ️ **Missing Data?**\n" +
                `If commands fail, visit ${onboardUrl} to manually index your data.` +
            "\n\n" +
                `Or try the web chat: https://fpl-wrapped-live.vercel.app/chat`
        );

        await safeReplyHtml(ctx, html);
    });

    // Handle help command
    bot.help(async (ctx) => {
        console.log('[Telegram] help handler invoked for chat', ctx.chat?.id);
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        const html = renderTelegramHtml(
            "🔍 **FPL Wrapped Help**\n\n" +
            "**Core Commands:**\n" +
            "• Send a message to ask me anything\n" +
            "• `/index_manager <id>` - Index a specific team\n" +
            "• `/index_league <id>` - Index an entire league\n\n" +
            "**Customization:**\n" +
            "• `/set_persona <key>` - e.g. PEP, ARTETA, MOURINHO\n" +
            "• `/set_tone <id>` - balanced, roast, optimist, delulu\n" +
            "• `/settings` - Show current personality settings\n\n" +
            "**Missing Data?** \n" +
            "We might not have indexed everyone yet. If you can't get results, index manually here:\n" +
            `${onboardUrl}` +
            "\n\n" +
            "Or try the web chat: https://fpl-wrapped-live.vercel.app/chat"
        );

        await safeReplyHtml(ctx, html);
    });

    // Settings commands: set persona, set tone, charts toggle, show settings
    bot.command('set_persona', async (ctx) => {
        const chatId = ctx.chat.id;
        const arg = ctx.message.text.split(' ')[1]?.toUpperCase();

        // static command — reply directly (webhook should not have sent an ack)

        // Only expose the featured personas (same as web UI)
        if (!arg) {
            const buttons = Array.from(featuredPersonaKeys).map(p => Markup.button.callback(PERSONA_MAP[p]?.name || p, `set_persona:${p}`));
            // Chunk buttons into rows of 2
            const rows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                rows.push(buttons.slice(i, i + 2));
            }
            return ctx.reply('🎭 Select a Manager Persona:', Markup.inlineKeyboard(rows));
        }

        if (!Array.from(featuredPersonaKeys).includes(arg as FeaturedPersona)) {
            return ctx.reply(`❌ Unknown persona: ${arg}\nAvailable: ${Array.from(featuredPersonaKeys).join(', ')}`);
        }

        const existing = chatSettingsByChatId.get(chatId) || {};
        chatSettingsByChatId.set(chatId, { ...existing, persona: arg });
        await ctx.reply(`✅ Persona set to ${PERSONA_MAP[arg]?.name || arg}`);
    });

    bot.command('set_tone', async (ctx) => {
        const chatId = ctx.chat.id;
        const arg = ctx.message.text.split(' ')[1]?.toLowerCase();

        // static command — reply directly (webhook should not have sent an ack)

        if (!arg) {
            const buttons = TONES.map(t => Markup.button.callback(`${t.icon} ${t.label}`, `set_tone:${t.id}`));
            // Chunk into rows of 2
            const rows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                rows.push(buttons.slice(i, i + 2));
            }
            return ctx.reply('⚡ Select a Response Tone:', Markup.inlineKeyboard(rows));
        }

        if (!AVAILABLE_TONES.includes(arg as ToneId)) {
            return ctx.reply(`❌ Unknown tone: ${arg}\nAvailable: ${AVAILABLE_TONES.join(', ')}`);
        }

        const existing = chatSettingsByChatId.get(chatId) || {};
        chatSettingsByChatId.set(chatId, { ...existing, tone: arg as ToneId });
        const config = TONE_CONFIG[arg as ToneId];
        await ctx.reply(`✅ Tone set to ${config.icon} ${config.label}`);
    });

    // Handle button callbacks
    bot.on('callback_query', async (ctx) => {
        const query = ctx.callbackQuery;
        const data = query && 'data' in query ? query.data : undefined;
        const chatId = ctx.chat?.id;
        if (!chatId || !data) return;

        if (data.startsWith('set_persona:')) {
            const p = data.split(':')[1];
            await ctx.answerCbQuery();
            if (!Array.from(featuredPersonaKeys).includes(p as FeaturedPersona)) {
                await ctx.editMessageText(`❌ Unknown persona: ${p}`);
                return;
            }
            const existing = chatSettingsByChatId.get(chatId) || {};
            chatSettingsByChatId.set(chatId, { ...existing, persona: p });
            await ctx.editMessageText(`✅ Persona set to ${PERSONA_MAP[p]?.name || p}`);
        } else if (data.startsWith('set_tone:')) {
            const t = data.split(':')[1] as ToneId;
            await ctx.answerCbQuery();
            const existing = chatSettingsByChatId.get(chatId) || {};
            chatSettingsByChatId.set(chatId, { ...existing, tone: t });
            const config = TONE_CONFIG[t];
            await ctx.answerCbQuery();
            await ctx.editMessageText(`✅ Tone set to ${config.icon} ${config.label}`);
        }
    });

    bot.command('settings', async (ctx) => {
        const chatId = ctx.chat.id;
        const s = chatSettingsByChatId.get(chatId) || {};
        const personaName = s.persona ? (PERSONA_MAP[s.persona]?.name || s.persona) : 'None';
        const toneConfig = s.tone ? TONE_CONFIG[s.tone as ToneId] : TONE_CONFIG.balanced;
        const html = renderTelegramHtml(`⚙️ **Chat Settings**\n\n🎭 **Persona:** ${personaName}\n⚡ **Tone:** ${toneConfig.icon} ${toneConfig.label}\n\nUse /set_persona or /set_tone to change these.`);
        await safeReplyHtml(ctx, html);
    });

    // Allow users to reset the current conversation for their chat
    bot.command('reset', async (ctx) => {
        const chatId = ctx.chat.id;
        conversationIdsByChatId.delete(chatId);
        await ctx.reply('✅ Conversation reset. I will start fresh on your next message.');
    });

    // Removed explicit `/chat` command — users can just send messages.

    // Handle /index_manager command
    bot.command('index_manager', async (ctx) => {
        const id = ctx.message.text.split(' ')[1];
        if (!id) return ctx.reply('Usage: `/index_manager <manager_id>`');
        await handleIndexing(ctx, 'manager', id);
    });

    // Handle /index_league command
    bot.command('index_league', async (ctx) => {
        const id = ctx.message.text.split(' ')[1];
        if (!id) return ctx.reply('Usage: `/index_league <league_id>`');
        await handleIndexing(ctx, 'league', id);
    });

    // Handle text messages
    bot.on('text', async (ctx) => {
        // Only handle if it's not a command (already handled by bot.command)
        if (ctx.message.text.startsWith('/')) return;

        await handleChat(ctx, ctx.message.text);
    });

    // Ensure Telegram client command list is populated so users see the correct commands
    (async () => {
        try {
            await bot.telegram.setMyCommands([
                { command: 'start', description: 'Start the bot' },
                { command: 'index_manager', description: 'Index a team' },
                { command: 'index_league', description: 'Index a league' },
                { command: 'set_persona', description: 'Set manager persona' },
                { command: 'set_tone', description: 'Set the tone' },
                { command: 'settings', description: 'Show current settings' },
                { command: 'reset', description: 'Reset your chat session' },
                { command: 'help', description: 'Show help' }
            ]);
            console.log('[Telegram] setMyCommands applied');
        } catch (err) {
            console.error('[Telegram] setMyCommands failed', err);
        }
    })();
}

export default bot;
