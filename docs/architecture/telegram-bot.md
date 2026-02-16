# Telegram Bot Architecture

This document outlines the architectural decisions and implementation details for the FPL Wrapped Telegram Bot, specifically focusing on handling long-running AI queries and data indexing tasks.

## 1. The Challenge: Webhook Retries

Telegram's Bot API expects a `200 OK` response to its webhook requests within **30 seconds**. If the server does not respond within this window, Telegram assumes the delivery failed and automatically retries the request multiple times.

In FPL Wrapped, many bot actions (like AI-powered chat or full-league indexing) can take significantly longer than 30 seconds.

### The Problem Symptoms
- Multiple "🤔 Thinking..." messages appearing for a single user input.
- Multiple duplicate indexing processes starting simultaneously.
- Increased server load and API rate limiting issues.

## 2. The Solution: Non-Blocking Webhooks

To prevent retries, we decoupling the **Inbound Acknowledgment** from the **Outbound Processing**.

### Implementation Detail
In the webhook route (`app/api/webhook/telegram/route.ts`), we immediately return a success response to Telegram before the bot logic starts.

```typescript
// app/api/webhook/telegram/route.ts

export async function POST(req: NextRequest) {
    const body = await req.json();

    // Fire-and-forget the bot processing
    bot.handleUpdate(body).catch((err) => {
        console.error('Background bot error:', err);
    });

    // Respond immediately to Telegram to prevent retries
    return NextResponse.json({ ok: true });
}
```

This ensures Telegram receives its `200 OK` in milliseconds, while the bot continues to push updates to the user via separate "outbound" API calls (`editMessageText`, `reply`).

## 3. The Safety Net: Deduplication Middleware

Even with immediate acknowledgment, network jitter or server restarts might occasionally cause duplicate updates to arrive. To handle this, we implemented a **Deduplication Middleware**.

### How it works
Every Telegram update includes a unique `update_id`. We track these IDs in a recent cache.

- **Location**: `lib/chat/telegram-bot.ts`
- **Mechanism**:
    1. Read the `update_id` from the incoming message.
    2. Check if it exists in a `processedUpdates` Set.
    3. If it exists, exit early (skip processing).
    4. If not, add to the Set and continue.
    5. Periodically prune the Set to manage memory.

```typescript
bot.use(async (ctx, next) => {
    const updateId = ctx.update.update_id;
    if (processedUpdates.has(updateId)) {
        console.log(`[Telegram] Skipping duplicate update ${updateId}`);
        return;
    }
    processedUpdates.add(updateId);
    // ... cache management ...
    return next();
});
```

## 4. Deployment Considerations (Serverless)

When deploying on serverless platforms like **Vercel**, the runtime environment typically terminates as soon as the HTTP response is sent.

### Solution: `waitUntil`
To ensure the background task continues after the response is sent, we use (or should use) the `waitUntil` utility provided by modern Next.js/Vercel runtimes.

```typescript
import { waitUntil } from 'next/server';

// ... in the POST handler ...
waitUntil(bot.handleUpdate(body));
return NextResponse.json({ ok: true });
```
*Note: If `waitUntil` is unavailable in the specific environment, a custom implementation or a persistent background worker may be required for very long-running tasks.*
