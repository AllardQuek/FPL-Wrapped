export type TelegramReplyOptions = {
    parse_mode?: 'HTML' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
};

export type TelegramChatContext = {
    reply: (text: string, extra?: Record<string, unknown>) => Promise<{ message_id: number }>;
    telegram: {
        editMessageText: (
            chatId: number,
            messageId: number,
            inlineMessageId: string | undefined,
            text: string,
            extra?: Record<string, unknown>
        ) => Promise<unknown>;
    };
};

export type TelegramTextCommandContext = TelegramChatContext & {
    chat: { id: number };
    message: { text: string };
};