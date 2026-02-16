import { NextRequest, NextResponse } from 'next/server';
import { getBootstrapData, getLeagueStandings } from '@/lib/fpl-api';
import {
    createLeagueExecution,
    createManagerExecution,
    IndexExecutionDocument,
    IndexExecutionType
} from '@/lib/elasticsearch/indexing-executions';
import { runExecutionChunk } from '@/lib/elasticsearch/indexing-runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isTerminal(status: string): boolean {
    return status === 'completed' || status === 'failed';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const type = body?.type as IndexExecutionType | undefined;
        const leagueIdRaw = body?.league_id;
        const managerIdRaw = body?.manager_id;
        const fromGwRaw = body?.from_gw;
        const toGwRaw = body?.to_gw;
        const maxStepsRaw = body?.max_steps;
        const maxIterationsRaw = body?.max_iterations;

        if (type !== 'league' && type !== 'manager') {
            return NextResponse.json(
                { error: 'type must be one of: league, manager' },
                { status: 400 }
            );
        }

        const bootstrap = await getBootstrapData();
        const currentGw = bootstrap.events.find(e => e.is_current)?.id || 38;

        const fromGw = fromGwRaw ? parseInt(fromGwRaw, 10) : 1;
        const toGw = toGwRaw ? parseInt(toGwRaw, 10) : currentGw;
        const maxSteps = maxStepsRaw ? parseInt(maxStepsRaw, 10) : 5;
        const maxIterations = maxIterationsRaw ? parseInt(maxIterationsRaw, 10) : 8;

        if (Number.isNaN(fromGw) || Number.isNaN(toGw) || fromGw < 1 || toGw < fromGw) {
            return NextResponse.json({ error: 'Invalid from_gw/to_gw range' }, { status: 400 });
        }

        if (Number.isNaN(maxSteps) || maxSteps < 1 || maxSteps > 50) {
            return NextResponse.json({ error: 'max_steps must be between 1 and 50' }, { status: 400 });
        }

        if (Number.isNaN(maxIterations) || maxIterations < 1 || maxIterations > 30) {
            return NextResponse.json({ error: 'max_iterations must be between 1 and 30' }, { status: 400 });
        }

        let execution: IndexExecutionDocument;

        if (type === 'league') {
            const leagueId = parseInt(leagueIdRaw, 10);
            if (Number.isNaN(leagueId)) {
                return NextResponse.json({ error: 'Invalid league_id' }, { status: 400 });
            }

            const standings = await getLeagueStandings(leagueId, 1);
            const managerIds = standings.standings.results.map(m => m.entry);
            if (managerIds.length === 0) {
                return NextResponse.json({ error: 'No managers found for league_id' }, { status: 404 });
            }

            execution = await createLeagueExecution({
                leagueId,
                managerIds,
                fromGw,
                toGw
            });
        } else {
            const managerId = parseInt(managerIdRaw, 10);
            if (Number.isNaN(managerId)) {
                return NextResponse.json({ error: 'Invalid manager_id' }, { status: 400 });
            }

            execution = await createManagerExecution({
                managerId,
                fromGw,
                toGw
            });
        }

        let current = execution;
        for (let i = 0; i < maxIterations; i++) {
            const updated = await runExecutionChunk(current.execution_id, maxSteps);
            if (!updated) {
                return NextResponse.json(
                    { error: `Execution not found: ${current.execution_id}` },
                    { status: 404 }
                );
            }
            current = updated;

            if (isTerminal(current.status)) {
                break;
            }
        }

        const responsePayload = {
            status: current.status,
            execution_id: current.execution_id,
            type: current.type,
            message: current.message,
            progress: {
                managers_processed: current.managers_processed,
                total_managers: current.total_managers,
                gameweeks_processed: current.gameweeks_processed,
                gameweeks_success: current.gameweeks_success,
                gameweeks_failed: current.gameweeks_failed,
                gameweeks_skipped: current.gameweeks_skipped,
                current_gw: current.current_gw,
                from_gw: current.from_gw,
                to_gw: current.to_gw
            },
            error: current.error,
            next: isTerminal(current.status)
                ? undefined
                : {
                    run: `/api/index/run/${current.execution_id}`,
                    status: `/api/index/status/${current.execution_id}`
                }
        };

        return NextResponse.json(
            responsePayload,
            { status: current.status === 'completed' ? 200 : 202 }
        );
    } catch (error: unknown) {
        console.error('Orchestrate indexing API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to orchestrate indexing' },
            { status: 500 }
        );
    }
}
