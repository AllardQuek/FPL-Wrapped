import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { bot } from '@/lib/chat/telegram-bot';
import { registerWebhookAck } from '@/lib/chat/telegram/services/ack-registry';

export const runtime = 'nodejs';
// Allow longer background processing on Vercel (seconds). Adjust to your plan limits.
export const maxDuration = 180;

type TelegramWebhookPayload = {
    message?: { chat?: { id?: number }; text?: string };
    callback_query?: { message?: { chat?: { id?: number } } };
    channel_post?: { chat?: { id?: number } };
};

function toTelegramPayload(value: unknown): TelegramWebhookPayload {
    if (!value || typeof value !== 'object') return {};
    return value as TelegramWebhookPayload;
}

function extractChatId(payload: TelegramWebhookPayload): number | undefined {
    return payload.message?.chat?.id
        ?? payload.callback_query?.message?.chat?.id
        ?? payload.channel_post?.chat?.id;
}

function shouldSendThinkingAck(payload: TelegramWebhookPayload): boolean {
    const incomingText = payload.message?.text;
    if (typeof incomingText !== 'string') return false;

    const trimmed = incomingText.trim().toLowerCase();
    return !trimmed.startsWith('/') || trimmed.startsWith('/chat');
}

export async function POST(req: NextRequest) {
    if (!bot) {
        return NextResponse.json({ error: 'Telegram bot not initialized' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const payload = toTelegramPayload(body);

        // Try to send a synchronous ACK before returning so the user always
        // sees the placeholder. Use the same text as the bot placeholder to
        // make the transition seamless (avoids visible "Got it" -> "Thinking").
        try {
            const chatId = extractChatId(payload);

            if (chatId) {
                // Only send/register a quick ack for incoming messages that
                // will trigger a streaming AI/chat response. Avoid sending
                // a "Thinking..." placeholder for static slash commands or
                // UI callbacks.
                if (shouldSendThinkingAck(payload)) {
                    // Send and register an immediate ack BEFORE handling the
                    // update to avoid a race where both the webhook and the bot
                    // send a "Thinking..." message. Awaiting here keeps the
                    // behavior deterministic; the webhook handler still returns
                    // quickly because sending is typically fast.
                    try {
                        const msg = await bot.telegram.sendMessage(chatId, '🤔 Thinking...');
                        if (msg?.message_id) {
                            registerWebhookAck(chatId, msg.message_id);
                        }
                    } catch (err) {
                        console.error('Failed to send immediate ack to Telegram user:', err);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to determine chatId for immediate ack:', err);
        }

        // Return 200 immediately to stop Telegram retries, then perform the
        // full bot handling in the background via `waitUntil` so heavy work
        // doesn't block the response.
        waitUntil((async () => {
            try {
                await bot.handleUpdate(body);
            } catch (err) {
                console.error('Background bot error:', err);
            }
        })());

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown webhook error';
        console.error('Webhook error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Support GET for simple health check or manual webhook setup info
export async function GET() {
    return NextResponse.json({
        status: 'online',
        botInitialized: !!bot,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/telegram`
    });
}
