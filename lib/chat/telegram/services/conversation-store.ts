type ConversationStoreOptions = {
    maxEntries?: number;
    ttlMs?: number;
    cleanupIntervalMs?: number;
};

type StoreEntry = {
    value: string;
    expiresAt: number;
};

export type ConversationIdStore = {
    get: (chatId: number) => string | undefined;
    set: (chatId: number, conversationId: string) => void;
    delete: (chatId: number) => boolean;
};

const DEFAULT_MAX_ENTRIES = 10_000;
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_CLEANUP_INTERVAL_MS = 1000 * 60 * 10;

export function createConversationStore(options: ConversationStoreOptions = {}): ConversationIdStore {
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    const cleanupIntervalMs = options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;

    const store = new Map<number, StoreEntry>();

    const cleanupExpired = () => {
        const now = Date.now();
        for (const [chatId, entry] of store.entries()) {
            if (entry.expiresAt <= now) {
                store.delete(chatId);
            }
        }
    };

    const cleanupTimer = setInterval(cleanupExpired, cleanupIntervalMs);
    if (typeof cleanupTimer === 'object' && cleanupTimer && 'unref' in cleanupTimer) {
        (cleanupTimer as { unref: () => void }).unref();
    }

    return {
        get(chatId: number) {
            const entry = store.get(chatId);
            if (!entry) {
                return undefined;
            }

            if (entry.expiresAt <= Date.now()) {
                store.delete(chatId);
                return undefined;
            }

            const refreshedEntry: StoreEntry = {
                value: entry.value,
                expiresAt: Date.now() + ttlMs
            };

            store.delete(chatId);
            store.set(chatId, refreshedEntry);

            return refreshedEntry.value;
        },
        set(chatId: number, conversationId: string) {
            const entry: StoreEntry = {
                value: conversationId,
                expiresAt: Date.now() + ttlMs
            };

            if (store.has(chatId)) {
                store.delete(chatId);
            }
            store.set(chatId, entry);

            while (store.size > maxEntries) {
                const oldestChatId = store.keys().next().value;
                if (oldestChatId === undefined) {
                    break;
                }
                store.delete(oldestChatId);
            }
        },
        delete(chatId: number) {
            return store.delete(chatId);
        }
    };
}