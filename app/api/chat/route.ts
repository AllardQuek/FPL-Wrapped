import { NextRequest } from 'next/server';
import { streamChatWithAgent } from '@/lib/chat/elastic-agent';

export const runtime = 'nodejs'; // Use Node.js runtime for streaming
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Expect ai-sdk shape: { messages: [{ parts: [{ type: 'text', text: '...' }], role }], id?, trigger? }
    if (!Array.isArray((body as any).messages)) {
      console.warn('Invalid request shape, expected ai-sdk `messages` array:', JSON.stringify(body));
      return new Response(JSON.stringify({ error: 'messages array required (ai-sdk format)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = (body as any).messages as Array<any>;
    const conversationId: string | undefined = (body as any).conversationId || (body as any).conversation_id;

    // Extract the last user message text from `messages` parts
    const userMsg = [...messages].reverse().find((m) => m?.role === 'user' || m?.role === undefined);
    let question: string | undefined = undefined;
    if (userMsg && Array.isArray(userMsg.parts)) {
      question = userMsg.parts.map((p: any) => (p?.text ? String(p.text) : '')).join(' ').trim();
    }

    if (!question) {
      console.warn('Missing user message text in ai-sdk messages payload:', JSON.stringify(body));
      return new Response(JSON.stringify({ error: 'Question required in messages parts' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Log when a client starts the chat stream
        // eslint-disable-next-line no-console
        console.log('[API /api/chat] streaming start for question:', question?.slice(0, 120));
        try {
          for await (const chunk of streamChatWithAgent(question, conversationId)) {
            // Send SSE formatted data
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            try {
              controller.enqueue(encoder.encode(data));
            } catch (e) {
              // Controller already closed (client disconnected) — stop streaming
              // eslint-disable-next-line no-console
              console.warn('Chat stream stopped: controller closed while enqueueing');
              return;
            }
          }

          // Send final [DONE] message
          try {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (e) {
            // ignore if controller closed
          }
          // eslint-disable-next-line no-console
          console.log('[API /api/chat] streaming finished (sent [DONE])');
          try {
            controller.close();
          } catch {}
        } catch (error: any) {
          console.error('Chat stream error:', error);
          const errorData = `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`;
          try {
            controller.enqueue(encoder.encode(errorData));
          } catch {}
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process question' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
