import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { bot, registerWebhookAck } from '@/lib/chat/telegram-bot';

export const runtime = 'nodejs';
// Allow longer background processing on Vercel (seconds). Adjust to your plan limits.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    if (!bot) {
        return NextResponse.json({ error: 'Telegram bot not initialized' }, { status: 500 });
    }

    try {
        const body = await req.json();

        // Try to send a synchronous ACK before returning so the user always
        // sees the placeholder. Use the same text as the bot placeholder to
        // make the transition seamless (avoids visible "Got it" -> "Thinking").
        try {
            const chatId = (body as any)?.message?.chat?.id
                || (body as any)?.callback_query?.message?.chat?.id
                || (body as any)?.channel_post?.chat?.id;

            if (chatId) {
                try {
                    const msg = await bot.telegram.sendMessage(
                        chatId,
                        '🤔 Thinking...'
                    );
                    if (msg && (msg as any).message_id) {
                        registerWebhookAck(chatId, (msg as any).message_id);
                    }
                } catch (err) {
                    console.error('Failed to send immediate ack to Telegram user:', err);
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
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
