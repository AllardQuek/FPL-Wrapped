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
          for await (const chunk of streamChatWithAgent(question, conversationId, { 
            signal: req.signal 
          })) {
            // Send SSE formatted data
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send final [DONE] message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          // Don't send error if it was a user abort
          if (req.signal.aborted || error.name === 'AbortError' || error.message?.includes('aborted')) {
            console.log('Chat request aborted by client');
            try {
              controller.close();
            } catch {
              // Ignore already closed errors
            }
            return;
          }

          console.error('Chat stream error:', error);
          const errorData = `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`;
          try {
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          } catch {
            // Ignore if stream is already closed
          }
        }
      },
      cancel() {
        console.log('Chat stream cancelled by consumer');
      }
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
