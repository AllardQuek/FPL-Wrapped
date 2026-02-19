import { Telegraf } from 'telegraf';
import { applyTelegramCommands } from './telegram/commands';
import { registerSettingsHandlers } from './telegram/handlers/settings';
import { registerIndexingHandlers } from './telegram/handlers/indexing';
import { registerCoreHandlers } from './telegram/handlers/core';
import { createTelegramChatService } from './telegram/services/chat-service';
import { consumeWebhookAck } from './telegram/services/ack-registry';
import { createUpdateDeduper } from './telegram/services/update-dedupe';
import { createConversationStore } from './telegram/services/conversation-store';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Stream inactivity timeout (minutes-based env var for readability).
const STREAM_INACTIVITY_TIMEOUT_MINUTES = Number(
    process.env.TELEGRAM_STREAM_INACTIVITY_TIMEOUT_MINUTES ?? '3'
);
const STREAM_INACTIVITY_TIMEOUT_MS = Number(
    process.env.TELEGRAM_STREAM_INACTIVITY_TIMEOUT_MS ?? String(STREAM_INACTIVITY_TIMEOUT_MINUTES * 60_000)
);

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot will not be initialized.');
}

/**
 * Initialize Telegraf bot
 */
export const bot = token ? new Telegraf(token, { handlerTimeout: STREAM_INACTIVITY_TIMEOUT_MS }) : null;

if (bot) {
    // Conversation cache tuning:
    // - max entries caps memory usage in long-running processes
    // - TTL keeps inactive chats from staying in memory forever
    // - cleanup interval removes expired entries in the background
    const MAX_CONVERSATION_ENTRIES = 10_000;
    const CONVERSATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h of inactivity before session expires
    const CONVERSATION_CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // prune expired entries every 10m

    const conversationIdsByChatId = createConversationStore({
        maxEntries: MAX_CONVERSATION_ENTRIES,
        ttlMs: CONVERSATION_TTL_MS,
        cleanupIntervalMs: CONVERSATION_CLEANUP_INTERVAL_MS
    });
    // Prevent concurrent processing for the same chat to avoid conversation races
    const chatProcessing = new Set<number>();
    // Per-chat settings: persona key, tone id.
    const chatSettingsByChatId = new Map<number, { persona?: string; tone?: string }>();
    // abort stream if no chunks for the given timeout.
    // `STREAM_INACTIVITY_TIMEOUT_MS` is computed above and used both for the
    // Telegraf handler timeout and the stream inactivity abort check.
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
