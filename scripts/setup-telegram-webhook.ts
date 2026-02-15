/**
 * Utility script to set the Telegram Webhook
 * Usage: npx tsx scripts/setup-telegram-webhook.ts <webhook_url>
 */
import * as dotenv from 'dotenv';

// Next.js projects commonly store local secrets in .env.local
dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;

async function setupWebhook() {
    const rawUrl = process.argv[2];

    if (!token) {
        console.error('❌ Error: TELEGRAM_BOT_TOKEN is not defined in .env.local');
        process.exit(1);
    }

    if (!rawUrl) {
        console.error('❌ Error: Webhook URL is required.');
        console.log('Usage: npx tsx scripts/setup-telegram-webhook.ts <your_app_url>/api/webhook/telegram');
        process.exit(1);
    }

    const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `https://${rawUrl}`;

    console.log(`📡 Setting webhook to: ${url}...`);

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log('✅ Webhook set successfully!');
        } else {
            console.error('❌ Failed to set webhook:', result.description);
        }
    } catch (error) {
        console.error('❌ Error calling Telegram API:', error);
    }
}

setupWebhook();
