import type { Telegraf } from 'telegraf';

export type TelegramBotCommand = {
    command: string;
    description: string;
};

export const TELEGRAM_COMMANDS: TelegramBotCommand[] = [
    { command: 'start', description: 'Start the bot' },
    { command: 'index_manager', description: 'Index a team' },
    { command: 'index_league', description: 'Index a league' },
    { command: 'set_persona', description: 'Set manager persona' },
    { command: 'set_tone', description: 'Set the tone' },
    { command: 'settings', description: 'Show current settings' },
    { command: 'reset', description: 'Reset your chat session' },
    { command: 'help', description: 'Show help' }
];

export async function applyTelegramCommands(bot: Telegraf) {
    await bot.telegram.setMyCommands(TELEGRAM_COMMANDS);
}