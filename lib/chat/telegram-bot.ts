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
    /**
     * Helper to handle chat requests
     */
    async function handleChat(ctx: any, question: string) {
        const chatId = ctx.chat.id;
        const conversationId = `tg-${chatId}`;

        // Send an initial "typing" or placeholder message
        const placeholder = await ctx.reply('🤔 Thinking...');
        let fullContent = '';
        let lastUpdate = Date.now();

        try {
            for await (const chunk of streamChatWithAgent(question, conversationId)) {
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

            // Final update with the complete message
            await ctx.telegram.editMessageText(
                chatId,
                placeholder.message_id,
                undefined,
                fullContent
            );
        } catch (error: any) {
            console.error('Telegram bot error:', error);
            await ctx.telegram.editMessageText(
                chatId,
                placeholder.message_id,
                undefined,
                `❌ Sorry, I encountered an error: ${error.message}`
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
            "🔍 **FPL Wrapped Help**\n\n" +
            "You can chat with me naturally about your FPL team, stats, and choices.\n\n" +
            "**Commands:**\n" +
            "/chat - Followed by your question\n" +
            "/help - Shows help information"
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
