import { describe, it, expect, vi } from 'vitest';
import { registerCoreHandlers } from '../../lib/chat/telegram/handlers/core';

type HandlerFn = (ctx: unknown) => Promise<void> | void;
type CoreHandlersRegistry = {
    commands: Map<string, HandlerFn>;
    on: Map<string, HandlerFn>;
    start: HandlerFn | null;
    help: HandlerFn | null;
};

function createMockBotAndRegistry() {
    const handlers: CoreHandlersRegistry = { commands: new Map(), on: new Map(), start: null, help: null };
    const bot = {
        command(name: string, fn: HandlerFn) {
            handlers.commands.set(name, fn);
        },
        on(event: string, fn: HandlerFn) {
            handlers.on.set(event, fn);
        },
        start(fn: HandlerFn) {
            handlers.start = fn;
        },
        help(fn: HandlerFn) {
            handlers.help = fn;
        }
    };

    return { handlers, bot };
}

describe('core handlers', () => {
    it('`/reset` calls resetConversation and replies', async () => {
        const { handlers, bot } = createMockBotAndRegistry();

        const resetConversation = vi.fn();
        const deps = {
            handleChat: vi.fn().mockResolvedValue(undefined),
            resetConversation
        };

        registerCoreHandlers(bot as unknown as Parameters<typeof registerCoreHandlers>[0], deps);

        const handler = handlers.commands.get('reset');
        const reply = vi.fn();
        const ctx = { chat: { id: 999 }, reply };

        await handler?.(ctx);

        expect(resetConversation).toHaveBeenCalledWith(999);
        expect(reply).toHaveBeenCalledWith('✅ Conversation reset. I will start fresh on your next message.');
    });

    it('text handler forwards non-command messages to handleChat', async () => {
        const { handlers, bot } = createMockBotAndRegistry();

        const handleChat = vi.fn().mockResolvedValue(undefined);
        const deps = { handleChat, resetConversation: vi.fn() };

        registerCoreHandlers(bot as unknown as Parameters<typeof registerCoreHandlers>[0], deps);

        const textHandler = handlers.on.get('text');

        // command-like message should be ignored
        await textHandler?.({ message: { text: '/help' } });
        expect(handleChat).toHaveBeenCalledTimes(0);

        // normal message should be forwarded
        const ctx = { message: { text: 'Hello bot' } };
        await textHandler?.(ctx);
        expect(handleChat).toHaveBeenCalledWith(ctx, 'Hello bot');
    });
});
