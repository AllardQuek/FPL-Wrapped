import { NextRequest, NextResponse } from 'next/server';
import { getExecution } from '@/lib/elasticsearch/indexing-executions';

export const runtime = 'nodejs';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ execution_id: string }> }
) {
    try {
        const { execution_id } = await params;
        const execution = await getExecution(execution_id);

        if (!execution) {
            return NextResponse.json(
                {
                    status: 'not_found',
                    message: `No indexing execution found with ID: ${execution_id}. Make sure you use the indexing execution_id returned in the API response body (not the workflow execution id).`
                },
                { status: 404 }
            );
        }

        const totalGameweeks = execution.to_gw - execution.from_gw + 1;
        const managerProgressTotal = execution.total_managers || 0;
        const managerProgressCurrent = execution.managers_processed || 0;
        const managerPercentage = managerProgressTotal > 0
            ? Math.round((managerProgressCurrent / managerProgressTotal) * 100)
            : undefined;

        const gameweekPercentage = totalGameweeks > 0
            ? Math.round((execution.gameweeks_processed / (execution.type === 'league'
                ? totalGameweeks * (execution.total_managers || 0)
                : totalGameweeks)) * 100)
            : 0;

        return NextResponse.json({
            status: execution.status,
            execution_id: execution.execution_id,
            type: execution.type,
            message: execution.message,
            progress: {
                managers_processed: managerProgressCurrent,
                total_managers: managerProgressTotal,
                managers_percentage: managerPercentage,
                gameweeks_processed: execution.gameweeks_processed,
                gameweeks_success: execution.gameweeks_success,
                gameweeks_failed: execution.gameweeks_failed,
                gameweeks_skipped: execution.gameweeks_skipped,
                gameweeks_percentage: gameweekPercentage,
                current_gw: execution.current_gw,
                from_gw: execution.from_gw,
                to_gw: execution.to_gw
            },
            timestamps: {
                created_at: execution.created_at,
                started_at: execution.started_at,
                updated_at: execution.updated_at,
                completed_at: execution.completed_at
            },
            error: execution.error
        });
    } catch (error: unknown) {
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to check indexing status' },
            { status: 500 }
        );
    }
}
