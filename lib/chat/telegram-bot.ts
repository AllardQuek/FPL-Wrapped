import { Telegraf } from 'telegraf';
import { streamChatWithAgent } from './elastic-agent';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot will not be initialized.');
}

/**
 * Initialize Telegraf bot
 */
export const bot = token ? new Telegraf(token) : null;

if (bot) {
    const conversationIdsByChatId = new Map<number, string>();
    const TELEGRAM_MESSAGE_LIMIT = 4096;
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
        reply: (text: string) => Promise<{ message_id: number }>;
        telegram: {
            editMessageText: (
                chatId: number,
                messageId: number,
                inlineMessageId: string | undefined,
                text: string
            ) => Promise<unknown>;
        };
    };

    function toErrorMessage(error: unknown): string {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        if (error == null) return 'Unknown error';
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }

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

    function renderTelegramText(markdown: string): string {
        let text = markdown;

        // Fenced code blocks -> plain code text
        text = text.replace(/```[\s\S]*?```/g, (block) => {
            const code = block
                .replace(/^```[^\n]*\n?/, '')
                .replace(/\n?```$/, '');
            return `\n${code.trim()}\n`;
        });

        // Inline code
        text = text.replace(/`([^`]+)`/g, '$1');

        // Markdown links -> label (url)
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)');

        // Headings
        text = text.replace(/^#{1,6}\s+/gm, '');

        // Bold / italic markers
        text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
        text = text.replace(/(\*|_)(.*?)\1/g, '$2');

        // Blockquotes and bullet styling
        text = text.replace(/^>\s?/gm, '');
        text = text.replace(/^\s*[-*]\s+/gm, '• ');

        // Tighten spacing
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        return text;
    }

    function toTelegramMessage(markdown: string): string {
        const rendered = renderTelegramText(markdown);

        if (!rendered) return '…';
        if (rendered.length <= TELEGRAM_MESSAGE_LIMIT) return rendered;

        return `${rendered.slice(0, TELEGRAM_MESSAGE_LIMIT - 2)}…`;
    }

    /**
     * Helper to handle chat requests
     */
    async function handleChat(ctx: ChatContext, question: string) {
        const chatId = ctx.chat.id;
        const conversationId = conversationIdsByChatId.get(chatId);

        // Send an initial "typing" or placeholder message
        const placeholder = await ctx.reply('🤔 Thinking...');

        const streamResponse = async (conversationIdForRequest?: string) => {
            let fullContent = '';
            let lastUpdate = Date.now();
            let latestConversationId = conversationIdForRequest;

            for await (const chunk of streamChatWithAgent(question, conversationIdForRequest)) {
                if (chunk.conversationId) {
                    latestConversationId = chunk.conversationId;
                }

                if (chunk.content) {
                    fullContent += chunk.content;

                    // Telegram edit limit is ~1 per second.
                    // We buffer chunks to avoid hitting rate limits.
                    if (Date.now() - lastUpdate > 1000) {
                        await ctx.telegram.editMessageText(
                            chatId,
                            placeholder.message_id,
                            undefined,
                            toTelegramMessage(fullContent + '...')
                        );
                        lastUpdate = Date.now();
                    }
                }

                if (chunk.error) {
                    throw new Error(chunk.error);
                }
            }

            return { fullContent, latestConversationId };
        };

        try {
            let result;

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

            const { fullContent, latestConversationId } = result;

            if (latestConversationId) {
                conversationIdsByChatId.set(chatId, latestConversationId);
            }

            // Final update with the complete message
            await ctx.telegram.editMessageText(
                chatId,
                placeholder.message_id,
                undefined,
                toTelegramMessage(fullContent)
            );
        } catch (error: unknown) {
            console.error('Telegram bot error:', error);
            const errorMessage = toErrorMessage(error);
            await ctx.telegram.editMessageText(
                chatId,
                placeholder.message_id,
                undefined,
                `❌ Sorry, I encountered an error: ${errorMessage}`
            );
        }
    }

    /**
     * Helper to handle indexing
     */
    async function handleIndexing(ctx: any, type: 'manager' | 'league', id: string) {
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
        } catch (error: any) {
            console.error('Indexing error:', error);
            await ctx.telegram.editMessageText(
                chatId,
                statusMessage.message_id,
                undefined,
                `❌ Indexing failed: ${error.message || 'Unknown error'}\n\nTry manual indexing at: ${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`
            );
        }
    }

    // Handle start command
    bot.start((ctx) => {
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        ctx.reply(
            "👋 Welcome to FPL Wrapped Chat!\n\n" +
            "I'm your AI assistant for all things Fantasy Premier League.\n\n" +
            "⚡ **Quick Start:**\n" +
            "If I don't have your data yet, you can index yourself directly:\n" +
            "• `/index_manager <your_id>`\n" +
            "• `/index_league <league_id>`\n\n" +
            "💬 **Chat:**\n" +
            "Just send me a message directly or use `/chat <question>`\n\n" +
            "ℹ️ **Missing Data?**\n" +
            `If commands fail, visit ${onboardUrl} to manually index your data.`
        );
    });

    // Handle help command
    bot.help((ctx) => {
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        ctx.reply(
            "🔍 **FPL Wrapped Help**\n\n" +
            "**Commands:**\n" +
            "• `/chat <question>` - Ask me anything\n" +
            "• `/index_manager <id>` - Index a specific team\n" +
            "• `/index_league <id>` - Index an entire league\n" +
            "• `/help` - Show this message\n\n" +
            "**Missing Data?**\n" +
            "We might not have indexed everyone yet. If you can't get results, index manually here:\n" +
            `${onboardUrl}`
        );
    });

    // Handle /chat command
    bot.command('chat', async (ctx) => {
        const text = ctx.message.text.replace('/chat', '').trim();
        if (!text) {
            return ctx.reply('Please provide a question! Example: `/chat Who had the biggest bench regrets in league 1305804?`');
        }
        await handleChat(ctx, text);
    });

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
}

export default bot;
