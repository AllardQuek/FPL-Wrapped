import { Telegraf } from 'telegraf';
import { isServiceDownError, SERVICE_DOWN_MESSAGE, toErrorMessage } from '../../utils';
import type { TelegramTextCommandContext } from '../types';

type IndexingContext = TelegramTextCommandContext;

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
                    ctx.telegram
                        .editMessageText(
                            chatId,
                            statusMessage.message_id,
                            undefined,
                            `⏳ Indexing Manager ${targetId}...\n\n${renderProgressBar(progress.current, progress.total)}\n${progress.message}`
                        )
                        .catch(() => {});
                    lastUpdate = Date.now();
                }
            });
        } else {
            await indexLeagueAllGameweeks(targetId, 1, undefined, (progress) => {
                if (Date.now() - lastUpdate > 1500) {
                    const progressText =
                        progress.type === 'manager'
                            ? `⏳ Indexing League ${targetId}...\nManager ${progress.current}/${progress.total}: ${progress.name || 'Unknown'}\n\n${renderProgressBar(progress.current, progress.total)}`
                            : `⏳ Indexing League ${targetId}...\n${progress.message}`;

                    ctx.telegram.editMessageText(chatId, statusMessage.message_id, undefined, progressText).catch(() => {});
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

        const message = isServiceDownError(errStr) ? SERVICE_DOWN_MESSAGE : `❌ Indexing failed: ${errStr}`;

        await ctx.telegram
            .editMessageText(
                chatId,
                statusMessage.message_id,
                undefined,
                `${message}\n\nTry manual indexing at: ${process.env.NEXT_PUBLIC_APP_URL || 'fpl-wrapped-live.vercel.app'}/onboard`
            )
            .catch(() => {});
    }
}

export function registerIndexingHandlers(bot: Telegraf) {
    bot.command('index_manager', async (ctx) => {
        const indexingCtx = ctx as unknown as IndexingContext;
        const id = indexingCtx.message.text.split(' ')[1];
        if (!id) {
            await indexingCtx.reply('Usage: `/index_manager [team_id]`');
            return;
        }
        await handleIndexing(indexingCtx, 'manager', id);
    });

    bot.command('index_league', async (ctx) => {
        const indexingCtx = ctx as unknown as IndexingContext;
        const id = indexingCtx.message.text.split(' ')[1];
        if (!id) {
            await indexingCtx.reply('Usage: `/index_league [league_id]`');
            return;
        }
        await handleIndexing(indexingCtx, 'league', id);
    });
}