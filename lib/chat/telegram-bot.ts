import { Telegraf } from 'telegraf';
import { applyTelegramCommands } from './telegram/commands';
import { registerSettingsHandlers } from './telegram/handlers/settings';
import { registerIndexingHandlers } from './telegram/handlers/indexing';
import { registerCoreHandlers } from './telegram/handlers/core';
import { createTelegramChatService } from './telegram/services/chat-service';
import { consumeWebhookAck } from './telegram/services/ack-registry';
import { createUpdateDeduper } from './telegram/services/update-dedupe';

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
    // Prevent concurrent processing for the same chat to avoid conversation races
    const chatProcessing = new Set<number>();
    // Per-chat settings: persona key, tone id.
    const chatSettingsByChatId = new Map<number, { persona?: string; tone?: string }>();
    const STREAM_INACTIVITY_TIMEOUT_MS = 30_000; // abort stream if no chunks for 30s
    const updateDeduper = createUpdateDeduper(1000);

    // Middleware to deduplicate updates (Telegram retries on timeout)
    bot.use(async (ctx, next) => {
        const updateId = ctx.update.update_id;
        if (!updateDeduper.shouldProcess(updateId)) {
            console.log(`[Telegram] Skipping duplicate update ${updateId}`);
            return;
        }

        return next();
    });

    const handleChat = createTelegramChatService({
        conversationIdsByChatId,
        chatProcessing,
        chatSettingsByChatId,
        consumeWebhookAck,
        streamInactivityTimeoutMs: STREAM_INACTIVITY_TIMEOUT_MS
    });

    registerSettingsHandlers(bot, chatSettingsByChatId);
    registerIndexingHandlers(bot);
    registerCoreHandlers(bot, {
        handleChat,
        resetConversation: (chatId) => {
            conversationIdsByChatId.delete(chatId);
        }
    });

    // Ensure Telegram client command list is populated so users see the correct commands
    (async () => {
        try {
            await applyTelegramCommands(bot);
            console.log('[Telegram] setMyCommands applied');
        } catch (err) {
            console.error('[Telegram] setMyCommands failed', err);
        }
    })();
}

export default bot;
