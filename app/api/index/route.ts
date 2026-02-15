import { NextRequest, NextResponse } from 'next/server';
import {
    indexManagerAllGameweeks,
    indexLeagueAllGameweeks
} from '@/lib/elasticsearch/indexing-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { type, id } = await req.json();

        if (!type || !id || isNaN(parseInt(id))) {
            return NextResponse.json({ error: 'Invalid type or ID' }, { status: 400 });
        }

        const targetId = parseInt(id);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendProgress = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    if (type === 'manager') {
                        await indexManagerAllGameweeks(targetId, 1, undefined, (progress) => {
                            sendProgress(progress);
                        });
                    } else if (type === 'league') {
                        await indexLeagueAllGameweeks(targetId, 1, undefined, (progress) => {
                            sendProgress(progress);
                        });
                    } else {
                        sendProgress({ error: 'Unsupported indexing type' });
                    }

                    sendProgress({ done: true, message: 'Indexing complete' });
                    controller.close();
                } catch (error: any) {
                    sendProgress({ error: error.message || 'Indexing failed' });
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
