import { describe, it, expect, vi } from 'vitest';

// Mock safeReplyHtml before importing the handler module
vi.mock('../../lib/chat/telegram/safe-telegram', () => ({
    safeReplyHtml: vi.fn()
}));

import { registerSettingsHandlers } from '../../lib/chat/telegram/handlers/settings';
import { safeReplyHtml } from '../../lib/chat/telegram/safe-telegram';

type ChatSettings = { persona?: string; tone?: string };
type HandlerFn = (ctx: unknown) => Promise<void> | void;
type HandlersRegistry = {
    commands: Map<string, HandlerFn>;
    on: Map<string, HandlerFn>;
};

function createMockBotAndRegistry() {
    const handlers: HandlersRegistry = { commands: new Map(), on: new Map() };
    const bot = {
        command(name: string, fn: HandlerFn) {
            handlers.commands.set(name, fn);
        },
        on(event: string, fn: HandlerFn) {
            handlers.on.set(event, fn);
        }
    };

    return { handlers, bot };
}

describe('settings handlers', () => {
    it('`/set_persona` with arg sets persona and replies', async () => {
        const chatSettings = new Map<number, ChatSettings>();
        const { handlers, bot } = createMockBotAndRegistry();

        registerSettingsHandlers(bot as unknown as Parameters<typeof registerSettingsHandlers>[0], chatSettings);

        const handler = handlers.commands.get('set_persona');
        const reply = vi.fn();
        const ctx = { chat: { id: 11 }, message: { text: '/set_persona PEP' }, reply };

        await handler?.(ctx);

        expect(chatSettings.get(11)?.persona).toBe('PEP');
        expect(reply).toHaveBeenCalledWith(expect.stringContaining('✅ Persona set'));
    });

    it('callback `set_persona:` updates settings and edits message', async () => {
        const chatSettings = new Map<number, ChatSettings>();
        const { handlers, bot } = createMockBotAndRegistry();

        registerSettingsHandlers(bot as unknown as Parameters<typeof registerSettingsHandlers>[0], chatSettings);

        const cb = handlers.on.get('callback_query');

        const answerCbQuery = vi.fn().mockResolvedValue(undefined);
        const editMessageText = vi.fn().mockResolvedValue(undefined);

        const ctx = {
            chat: { id: 22 },
            callbackQuery: { data: 'set_persona:PEP' },
            answerCbQuery,
            editMessageText
        };

        await cb?.(ctx);

        expect(answerCbQuery).toHaveBeenCalled();
        expect(editMessageText).toHaveBeenCalledWith(expect.any(String));
        expect(chatSettings.get(22)?.persona).toBe('PEP');
    });

    it('`/settings` uses `safeReplyHtml` to show current settings', async () => {
        const chatSettings = new Map<number, ChatSettings>();
        const { handlers, bot } = createMockBotAndRegistry();

        registerSettingsHandlers(bot as unknown as Parameters<typeof registerSettingsHandlers>[0], chatSettings);

        // pre-populate settings
        chatSettings.set(33, { persona: 'PEP', tone: 'balanced' });

        const handler = handlers.commands.get('settings');
        const ctx = { chat: { id: 33 } };

        await handler?.(ctx);

        expect(safeReplyHtml).toHaveBeenCalled();
        // first argument passed to safeReplyHtml should be the ctx object
        expect(vi.mocked(safeReplyHtml).mock.calls[0]?.[0]).toBe(ctx);
    });
});
