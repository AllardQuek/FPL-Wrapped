import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import path from 'path';
import { TELEGRAM_COMMANDS } from '../lib/chat/telegram/commands';

// Load .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not defined in .env or .env.local');
    process.exit(1);
}

const bot = new Telegraf(token);

async function updateCommands() {
    const scopes = [
        { type: 'default' as const },
        { type: 'all_private_chats' as const },
        { type: 'all_group_chats' as const },
        { type: 'all_chat_administrators' as const }
    ];

    try {
        console.log('⏳ Updating Telegram commands for multiple scopes...');

        for (const scope of scopes) {
            try {
                await bot.telegram.setMyCommands(TELEGRAM_COMMANDS, { scope });
                console.log(`   ✅ Updated commands for scope: ${scope.type}`);
            } catch (err) {
                console.warn(`   ⚠️ Failed to update commands for scope ${scope.type}:`, err);
            }
        }

        console.log('✅ Finished attempting to update Telegram commands for all scopes.');
        TELEGRAM_COMMANDS.forEach(c => console.log(`   /${c.command} - ${c.description}`));
    } catch (error) {
        console.error('❌ Failed to update Telegram commands:', error);
        process.exit(1);
    }
}

updateCommands();
