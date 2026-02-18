import { Telegraf } from 'telegraf';
import { renderTelegramHtml } from '../render';
import { safeReplyHtml } from '../safe-telegram';
import type { TelegramTextCommandContext } from '../types';

type CoreHandlerDeps = {
    handleChat: (ctx: TelegramTextCommandContext, question: string) => Promise<void>;
    resetConversation: (chatId: number) => void;
};

export function registerCoreHandlers(bot: Telegraf, deps: CoreHandlerDeps) {
    bot.start(async (ctx) => {
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        const html = renderTelegramHtml(
            "👋 Welcome to FPL Wrapped Chat!\n\n" +
                "I'm your AI assistant for all things Fantasy Premier League.\n\n" +
                "⚡ **Quick Start:**\n" +
                "If I don't have your data yet, you can index yourself directly:\n" +
                "• `/index_manager [team_id]`\n" +
                "• `/index_league [league_id]`\n\n" +
                "🔎 **Chat:**\n" +
                "Just send me a message directly — no command needed.\n\n" +
                "⚙️ **Settings:**\n" +
                "Customize my personality and tone:\n" +
                "• `/set_persona PEP` - Set manager persona (PEP, ARTETA, etc.)\n" +
                "• `/set_tone roast` - Set tone (balanced, roast, optimist, delulu)\n" +
                "• `/settings` - View current chat settings\n\n" +
                "🛠️ **Troubleshooting:**\n" +
                "If I hang or don't respond, try:\n" +
                "• `/reset` — reset the conversation for your chat\n" +
                "• Send a follow-up message (sometimes the request didn't reach me)\n" +
                "• Restart the bot (ask the bot owner)\n\n" +
                "ℹ️ **Missing Data?**\n" +
                `If commands fail, visit ${onboardUrl} to manually index your data.` +
                "\n\n" +
                'Or try the web chat: https://fpl-wrapped-live.vercel.app/chat'
        );

        await safeReplyHtml(ctx, html);
    });

    bot.help(async (ctx) => {
        console.log('[Telegram] help handler invoked for chat', ctx.chat?.id);
        const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`;
        const html = renderTelegramHtml(
            "🔍 **FPL Wrapped Help**\n\n" +
                "**Core Commands:**\n" +
                '• Send a message to ask me anything\n' +
                '• `/index_manager [team_id]` - Index a specific team\n' +
                '• `/index_league [league_id]` - Index an entire league\n\n' +
                "**Customization:**\n" +
                '• `/set_persona [manager]` - e.g. PEP, ARTETA, MOURINHO\n' +
                '• `/set_tone [tone]` - balanced, roast, optimist, delulu\n' +
                '• `/settings` - Show current personality settings\n\n' +
                '🛠️ **Troubleshooting:**\n' +
                "If I hang or don't respond, try:\n" +
                '• `/reset` — reset the conversation for your chat\n' +
                '• Send a follow-up message\n' +
                '• Ask the bot owner to restart the bot\n\n' +
                '**Missing Data?** \n' +
                "We might not have indexed everyone yet. If you can't get results, index manually here:\n" +
                `${onboardUrl}` +
                '\n\n' +
                'Or try the web chat: https://fpl-wrapped-live.vercel.app/chat'
        );

        await safeReplyHtml(ctx, html);
    });

    bot.command('reset', async (ctx) => {
        const chatId = ctx.chat.id;
        deps.resetConversation(chatId);
        await ctx.reply('✅ Conversation reset. I will start fresh on your next message.');
    });

    bot.on('text', async (ctx) => {
        if (ctx.message.text.startsWith('/')) return;
        await deps.handleChat(ctx, ctx.message.text);
    });
}