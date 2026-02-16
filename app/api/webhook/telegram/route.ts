import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/chat/telegram-bot';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    if (!bot) {
        return NextResponse.json({ error: 'Telegram bot not initialized' }, { status: 500 });
    }

    try {
        const body = await req.json();

        // Process the update in the background and respond immediately.
        // This prevents Telegram from retrying while we wait for AI/indexing.
        // We catch errors internally to prevent unhandled promise rejections.
        bot.handleUpdate(body).catch((err) => {
            console.error('Background bot error:', err);
        });

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
