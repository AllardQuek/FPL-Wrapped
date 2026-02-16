import { getBootstrapData } from '@/lib/fpl-api';
import { indexManagerGameweek } from '@/lib/elasticsearch/indexing-service';
import {
    getExecution,
    saveExecution,
    IndexExecutionDocument,
    IndexExecutionStatus
} from '@/lib/elasticsearch/indexing-executions';

function isTerminalStatus(status: IndexExecutionStatus): boolean {
    return status === 'completed' || status === 'failed';
}

function markRunning(doc: IndexExecutionDocument) {
    if (!doc.started_at) {
        doc.started_at = new Date().toISOString();
    }
    doc.status = 'running';
}

function markCompleted(doc: IndexExecutionDocument, message: string) {
    doc.status = 'completed';
    doc.completed_at = new Date().toISOString();
    doc.message = message;
}

function markFailed(doc: IndexExecutionDocument, error: unknown) {
    doc.status = 'failed';
    doc.completed_at = new Date().toISOString();
    doc.error = error instanceof Error ? error.message : String(error);
    doc.message = 'Indexing failed';
}

function resolveLeagueProgressMessage(doc: IndexExecutionDocument): string {
    const managersProcessed = doc.managers_processed ?? 0;
    const totalManagers = doc.total_managers ?? 0;
    return `Indexing league ${doc.league_id}: ${managersProcessed}/${totalManagers} managers, ${doc.gameweeks_processed} gameweeks processed`;
}

function resolveManagerProgressMessage(doc: IndexExecutionDocument): string {
    const total = doc.to_gw - doc.from_gw + 1;
    return `Indexing manager ${doc.manager_id}: ${doc.gameweeks_processed}/${total} gameweeks processed`;
}

async function processManagerGameweekStep(doc: IndexExecutionDocument, bootstrapCurrentGw: number) {
    const managerId = doc.manager_id;
    if (!managerId) {
        throw new Error('Invalid manager execution: manager_id missing');
    }

    const gw = doc.current_gw;
    if (gw > doc.to_gw) {
        markCompleted(
            doc,
            `Manager ${managerId} indexing complete: ${doc.gameweeks_success} success, ${doc.gameweeks_failed} failed, ${doc.gameweeks_skipped} skipped`
        );
        return;
    }

    const isFutureGw = gw > bootstrapCurrentGw;
    if (isFutureGw) {
        doc.gameweeks_skipped += 1;
        doc.gameweeks_processed += 1;
    } else {
        const ok = await indexManagerGameweek(managerId, gw);
        if (ok) {
            doc.gameweeks_success += 1;
        } else {
            doc.gameweeks_failed += 1;
        }
        doc.gameweeks_processed += 1;
    }

    doc.current_gw += 1;
    doc.message = resolveManagerProgressMessage(doc);

    if (doc.current_gw > doc.to_gw) {
        markCompleted(
            doc,
            `Manager ${managerId} indexing complete: ${doc.gameweeks_success} success, ${doc.gameweeks_failed} failed, ${doc.gameweeks_skipped} skipped`
        );
    }
}

async function processLeagueGameweekStep(doc: IndexExecutionDocument, bootstrapCurrentGw: number) {
    const leagueId = doc.league_id;
    const managerIds = doc.manager_ids ?? [];
    if (!leagueId || managerIds.length === 0) {
        throw new Error('Invalid league execution: missing league_id or manager_ids');
    }

    const currentManagerIndex = doc.current_manager_index ?? 0;
    const managerId = managerIds[currentManagerIndex];

    if (managerId === undefined) {
        markCompleted(
            doc,
            `League ${leagueId} indexing complete: ${doc.managers_processed ?? 0}/${doc.total_managers ?? 0} managers`
        );
        return;
    }

    const gw = doc.current_gw;
    if (gw > doc.to_gw) {
        doc.current_manager_index = currentManagerIndex + 1;
        doc.managers_processed = (doc.current_manager_index ?? 0);
        doc.current_gw = doc.from_gw;

        if ((doc.current_manager_index ?? 0) >= managerIds.length) {
            markCompleted(
                doc,
                `League ${leagueId} indexing complete: ${doc.managers_processed ?? 0}/${doc.total_managers ?? 0} managers, ${doc.gameweeks_success} success, ${doc.gameweeks_failed} failed, ${doc.gameweeks_skipped} skipped`
            );
            return;
        }

        doc.message = resolveLeagueProgressMessage(doc);
        return;
    }

    const isFutureGw = gw > bootstrapCurrentGw;
    if (isFutureGw) {
        doc.gameweeks_skipped += 1;
        doc.gameweeks_processed += 1;
    } else {
        const ok = await indexManagerGameweek(managerId, gw, [leagueId]);
        if (ok) {
            doc.gameweeks_success += 1;
        } else {
            doc.gameweeks_failed += 1;
        }
        doc.gameweeks_processed += 1;
    }

    doc.current_gw += 1;
    doc.message = resolveLeagueProgressMessage(doc);
}

export async function runExecutionChunk(executionId: string, maxSteps: number = 5) {
    const doc = await getExecution(executionId);
    if (!doc) {
        return null;
    }

    if (isTerminalStatus(doc.status)) {
        return doc;
    }

    try {
        markRunning(doc);

        const bootstrap = await getBootstrapData();
        const currentGw = bootstrap.events.find(e => e.is_current)?.id || doc.to_gw;

        const steps = Math.max(1, Math.min(maxSteps, 50));
        for (let i = 0; i < steps; i++) {
            if (doc.type === 'manager') {
                await processManagerGameweekStep(doc, currentGw);
            } else {
                await processLeagueGameweekStep(doc, currentGw);
            }

            if (isTerminalStatus(doc.status)) {
                break;
            }
        }
    } catch (error) {
        markFailed(doc, error);
    }

    return saveExecution(doc);
}
