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
                            fullContent + '...'
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
                fullContent
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

    // Handle start command
    bot.start((ctx) => {
        ctx.reply(
            "👋 Welcome to FPL Wrapped Chat!\n\n" +
            "I'm your AI assistant for all things Fantasy Premier League. You can just send me a message directly, or use these commands:\n\n" +
            "💬 /chat <question> - Ask me a question\n" +
            "❓ /help - Show this help message"
        );
    });

    // Handle help command
    bot.help((ctx) => {
        ctx.reply(
            "🔍 FPL Wrapped Help\n\n" +
            "You can send any normal message, or use commands.\n\n" +
            "Commands:\n" +
            "• /chat <question> - Ask a specific question\n" +
            "• /help - Show this help"
        );
    });

    // Handle /chat command
    bot.command('chat', async (ctx) => {
        const text = ctx.message.text.replace('/chat', '').trim();
        if (!text) {
            return ctx.reply('Please provide a question! Example: `/chat who should I captain?`');
        }
        await handleChat(ctx, text);
    });

    // Handle text messages
    bot.on('text', async (ctx) => {
        // Only handle if it's not a command (already handled by bot.command)
        if (ctx.message.text.startsWith('/')) return;

        await handleChat(ctx, ctx.message.text);
    });
}

export default bot;
