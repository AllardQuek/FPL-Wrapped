import { NextRequest } from 'next/server';
import { streamChatWithAgent } from '@/lib/chat/elastic-agent';

export const runtime = 'nodejs'; // Use Node.js runtime for streaming
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function POST(req: NextRequest) {
  try {
    const { question, conversationId } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatWithAgent(question, conversationId)) {
            // Send SSE formatted data
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send final [DONE] message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Chat stream error:', error);
          const errorData = `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
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
