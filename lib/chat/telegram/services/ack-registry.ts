const webhookAcks = new Map<number, number>();

export function registerWebhookAck(chatId: number, messageId: number) {
    webhookAcks.set(chatId, messageId);
    setTimeout(() => webhookAcks.delete(chatId), 60_000).unref?.();
}

export function consumeWebhookAck(chatId: number): number | undefined {
    const messageId = webhookAcks.get(chatId);
    if (messageId) {
        webhookAcks.delete(chatId);
    }
    return messageId;
}