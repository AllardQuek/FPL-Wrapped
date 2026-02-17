import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not defined in .env or .env.local');
    process.exit(1);
}

const bot = new Telegraf(token);

const commands = [
    { command: 'index_manager', description: 'Index a team' },
    { command: 'index_league', description: 'Index a league' },
    { command: 'set_persona', description: 'Set manager persona' },
    { command: 'set_tone', description: 'Set the tone' },
    { command: 'settings', description: 'Show current settings' },
    { command: 'reset', description: 'Reset your chat session' },
    { command: 'help', description: 'Show help' },
    { command: 'start', description: 'Start the bot' }
];

async function updateCommands() {
    const scopes = [
        { type: 'default' },
        { type: 'all_private_chats' },
        { type: 'all_group_chats' },
        { type: 'all_chat_administrators' }
    ];

    try {
        console.log('⏳ Updating Telegram commands for multiple scopes...');

        for (const scope of scopes) {
            try {
                await bot.telegram.setMyCommands(commands, { scope });
                console.log(`   ✅ Updated commands for scope: ${scope.type}`);
            } catch (err) {
                console.warn(`   ⚠️ Failed to update commands for scope ${scope.type}:`, err);
            }
        }

        console.log('✅ Finished attempting to update Telegram commands for all scopes.');
        commands.forEach(c => console.log(`   /${c.command} - ${c.description}`));
    } catch (error) {
        console.error('❌ Failed to update Telegram commands:', error);
        process.exit(1);
    }
}

updateCommands();
