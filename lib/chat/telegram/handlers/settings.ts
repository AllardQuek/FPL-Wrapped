import { Markup, Telegraf } from 'telegraf';
import { AVAILABLE_TONES, TONES, TONE_CONFIG, ToneId } from '../../constants';
import { PERSONA_MAP } from '../../../analysis/persona/constants';
import { renderTelegramHtml } from '../render';
import { safeReplyHtml } from '../safe-telegram';

const featuredPersonaKeys = ['PEP', 'ARTETA', 'AMORIM', 'MOURINHO'] as const;
type FeaturedPersona = (typeof featuredPersonaKeys)[number];

type ChatSettings = { persona?: string; tone?: string };

export function registerSettingsHandlers(
    bot: Telegraf,
    chatSettingsByChatId: Map<number, ChatSettings>
) {
    bot.command('set_persona', async (ctx) => {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const arg = ctx.message.text.split(' ')[1]?.toUpperCase();

        if (!arg) {
            const buttons = Array.from(featuredPersonaKeys).map((personaKey) =>
                Markup.button.callback(PERSONA_MAP[personaKey]?.name || personaKey, `set_persona:${personaKey}`)
            );
            const rows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                rows.push(buttons.slice(i, i + 2));
            }
            await ctx.reply('🎭 Select a Manager Persona:', Markup.inlineKeyboard(rows));
            return;
        }

        if (!Array.from(featuredPersonaKeys).includes(arg as FeaturedPersona)) {
            await ctx.reply(`❌ Unknown persona: ${arg}\nAvailable: ${Array.from(featuredPersonaKeys).join(', ')}`);
            return;
        }

        const existing = chatSettingsByChatId.get(chatId) || {};
        chatSettingsByChatId.set(chatId, { ...existing, persona: arg });
        await ctx.reply(`✅ Persona set to ${PERSONA_MAP[arg]?.name || arg}`);
    });

    bot.command('set_tone', async (ctx) => {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const arg = ctx.message.text.split(' ')[1]?.toLowerCase();

        if (!arg) {
            const buttons = TONES.map((tone) => Markup.button.callback(`${tone.icon} ${tone.label}`, `set_tone:${tone.id}`));
            const rows = [];
            for (let i = 0; i < buttons.length; i += 2) {
                rows.push(buttons.slice(i, i + 2));
            }
            await ctx.reply('⚡ Select a Response Tone:', Markup.inlineKeyboard(rows));
            return;
        }

        if (!AVAILABLE_TONES.includes(arg as ToneId)) {
            await ctx.reply(`❌ Unknown tone: ${arg}\nAvailable: ${AVAILABLE_TONES.join(', ')}`);
            return;
        }

        const existing = chatSettingsByChatId.get(chatId) || {};
        chatSettingsByChatId.set(chatId, { ...existing, tone: arg as ToneId });
        const config = TONE_CONFIG[arg as ToneId];
        await ctx.reply(`✅ Tone set to ${config.icon} ${config.label}`);
    });

    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
        const chatId = ctx.chat?.id;
        if (!chatId || !data) return;

        if (data.startsWith('set_persona:')) {
            const persona = data.split(':')[1];
            await ctx.answerCbQuery();
            if (!Array.from(featuredPersonaKeys).includes(persona as FeaturedPersona)) {
                await ctx.editMessageText(`❌ Unknown persona: ${persona}`);
                return;
            }

            const existing = chatSettingsByChatId.get(chatId) || {};
            chatSettingsByChatId.set(chatId, { ...existing, persona });
            await ctx.editMessageText(`✅ Persona set to ${PERSONA_MAP[persona]?.name || persona}`);
            return;
        }

        if (data.startsWith('set_tone:')) {
            const tone = data.split(':')[1] as ToneId;
            await ctx.answerCbQuery();
            const existing = chatSettingsByChatId.get(chatId) || {};
            chatSettingsByChatId.set(chatId, { ...existing, tone });
            const config = TONE_CONFIG[tone];
            await ctx.editMessageText(`✅ Tone set to ${config.icon} ${config.label}`);
        }
    });

    bot.command('settings', async (ctx) => {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const settings = chatSettingsByChatId.get(chatId) || {};
        const personaName = settings.persona ? (PERSONA_MAP[settings.persona]?.name || settings.persona) : 'None';
        const toneConfig = settings.tone ? TONE_CONFIG[settings.tone as ToneId] : TONE_CONFIG.balanced;
        const html = renderTelegramHtml(
            `⚙️ **Chat Settings**\n\n🎭 **Persona:** ${personaName}\n⚡ **Tone:** ${toneConfig.icon} ${toneConfig.label}\n\nUse /set_persona or /set_tone to change these.`
        );
        await safeReplyHtml(ctx, html);
    });
}