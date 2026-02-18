import { describe, it, expect, vi } from 'vitest';
import { registerIndexingHandlers } from '../../lib/chat/telegram/handlers/indexing';

type HandlerFn = (ctx: unknown) => Promise<void> | void;
type IndexingHandlersRegistry = {
    commands: Map<string, HandlerFn>;
};

function createMockBotAndRegistry() {
    const handlers: IndexingHandlersRegistry = { commands: new Map() };
    const bot = {
        command(name: string, fn: HandlerFn) {
            handlers.commands.set(name, fn);
        }
    };

    return { handlers, bot };
}

describe('indexing handlers (simple)', () => {
    it('replies usage when no id provided for index_manager', async () => {
        const { handlers, bot } = createMockBotAndRegistry();

        registerIndexingHandlers(bot as unknown as Parameters<typeof registerIndexingHandlers>[0]);

        const handler = handlers.commands.get('index_manager');
        const reply = vi.fn();
        const ctx = { chat: { id: 1 }, message: { text: '/index_manager' }, reply };

        await handler?.(ctx);

        expect(reply).toHaveBeenCalledWith('Usage: `/index_manager [team_id]`');
    });

    it('replies usage when no id provided for index_league', async () => {
        const { handlers, bot } = createMockBotAndRegistry();

        registerIndexingHandlers(bot as unknown as Parameters<typeof registerIndexingHandlers>[0]);

        const handler = handlers.commands.get('index_league');
        const reply = vi.fn();
        const ctx = { chat: { id: 1 }, message: { text: '/index_league' }, reply };

        await handler?.(ctx);

        expect(reply).toHaveBeenCalledWith('Usage: `/index_league [league_id]`');
    });
});
