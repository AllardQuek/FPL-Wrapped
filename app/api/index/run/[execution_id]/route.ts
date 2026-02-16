import { NextRequest, NextResponse } from 'next/server';
import { runExecutionChunk } from '@/lib/elasticsearch/indexing-runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ execution_id: string }> }
) {
    try {
        const { execution_id } = await params;
        const body = await req.json().catch(() => ({}));
        const maxStepsRaw = body?.max_steps;
        const maxSteps = maxStepsRaw ? parseInt(maxStepsRaw, 10) : 5;

        const execution = await runExecutionChunk(execution_id, maxSteps);
        if (!execution) {
            return NextResponse.json(
                {
                    status: 'not_found',
                    message: `No indexing execution found: ${execution_id}`
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: execution.status,
            execution_id: execution.execution_id,
            type: execution.type,
            message: execution.message,
            progress: {
                managers_processed: execution.managers_processed,
                total_managers: execution.total_managers,
                gameweeks_processed: execution.gameweeks_processed,
                gameweeks_success: execution.gameweeks_success,
                gameweeks_failed: execution.gameweeks_failed,
                gameweeks_skipped: execution.gameweeks_skipped,
                current_gw: execution.current_gw,
                from_gw: execution.from_gw,
                to_gw: execution.to_gw
            },
            error: execution.error
        });
    } catch (error: unknown) {
        console.error('Run execution API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to run indexing execution chunk' },
            { status: 500 }
        );
    }
}
