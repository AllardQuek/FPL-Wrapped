import { randomUUID } from 'crypto';
import { getESClient } from './client';

export const INDEXING_EXECUTIONS_INDEX = 'fpl-indexing-executions';

export type IndexExecutionType = 'league' | 'manager';
export type IndexExecutionStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface IndexExecutionDocument {
    execution_id: string;
    type: IndexExecutionType;
    status: IndexExecutionStatus;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    message?: string;
    error?: string;

    from_gw: number;
    to_gw: number;
    current_gw: number;

    manager_id?: number;
    league_id?: number;
    manager_ids?: number[];
    current_manager_index?: number;
    total_managers?: number;
    managers_processed?: number;

    gameweeks_processed: number;
    gameweeks_success: number;
    gameweeks_failed: number;
    gameweeks_skipped: number;
}

async function ensureExecutionsIndex() {
    const client = getESClient();
    if (!client) {
        throw new Error('Elasticsearch client not available');
    }

    const exists = await client.indices.exists({ index: INDEXING_EXECUTIONS_INDEX });
    if (exists) {
        return;
    }

    await client.indices.create({
        index: INDEXING_EXECUTIONS_INDEX,
        mappings: {
            properties: {
                execution_id: { type: 'keyword' },
                type: { type: 'keyword' },
                status: { type: 'keyword' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' },
                started_at: { type: 'date' },
                completed_at: { type: 'date' },
                message: { type: 'text' },
                error: { type: 'text' },
                from_gw: { type: 'integer' },
                to_gw: { type: 'integer' },
                current_gw: { type: 'integer' },
                manager_id: { type: 'integer' },
                league_id: { type: 'integer' },
                manager_ids: { type: 'integer' },
                current_manager_index: { type: 'integer' },
                total_managers: { type: 'integer' },
                managers_processed: { type: 'integer' },
                gameweeks_processed: { type: 'integer' },
                gameweeks_success: { type: 'integer' },
                gameweeks_failed: { type: 'integer' },
                gameweeks_skipped: { type: 'integer' }
            }
        }
    });
}

export async function createLeagueExecution(params: {
    leagueId: number;
    managerIds: number[];
    fromGw: number;
    toGw: number;
}): Promise<IndexExecutionDocument> {
    await ensureExecutionsIndex();
    const client = getESClient();
    if (!client) {
        throw new Error('Elasticsearch client not available');
    }

    const now = new Date().toISOString();
    const execution_id = randomUUID();

    const doc: IndexExecutionDocument = {
        execution_id,
        type: 'league',
        status: 'queued',
        created_at: now,
        updated_at: now,
        message: `Queued league indexing for ${params.managerIds.length} managers`,
        league_id: params.leagueId,
        manager_ids: params.managerIds,
        from_gw: params.fromGw,
        to_gw: params.toGw,
        current_gw: params.fromGw,
        current_manager_index: 0,
        total_managers: params.managerIds.length,
        managers_processed: 0,
        gameweeks_processed: 0,
        gameweeks_success: 0,
        gameweeks_failed: 0,
        gameweeks_skipped: 0
    };

    await client.index({
        index: INDEXING_EXECUTIONS_INDEX,
        id: execution_id,
        document: doc,
        refresh: 'wait_for'
    });

    return doc;
}

export async function createManagerExecution(params: {
    managerId: number;
    fromGw: number;
    toGw: number;
}): Promise<IndexExecutionDocument> {
    await ensureExecutionsIndex();
    const client = getESClient();
    if (!client) {
        throw new Error('Elasticsearch client not available');
    }

    const now = new Date().toISOString();
    const execution_id = randomUUID();

    const doc: IndexExecutionDocument = {
        execution_id,
        type: 'manager',
        status: 'queued',
        created_at: now,
        updated_at: now,
        message: 'Queued manager indexing',
        manager_id: params.managerId,
        from_gw: params.fromGw,
        to_gw: params.toGw,
        current_gw: params.fromGw,
        gameweeks_processed: 0,
        gameweeks_success: 0,
        gameweeks_failed: 0,
        gameweeks_skipped: 0
    };

    await client.index({
        index: INDEXING_EXECUTIONS_INDEX,
        id: execution_id,
        document: doc,
        refresh: 'wait_for'
    });

    return doc;
}

export async function getExecution(executionId: string): Promise<IndexExecutionDocument | null> {
    await ensureExecutionsIndex();
    const client = getESClient();
    if (!client) {
        throw new Error('Elasticsearch client not available');
    }

    try {
        const res = await client.get<IndexExecutionDocument>({
            index: INDEXING_EXECUTIONS_INDEX,
            id: executionId
        });
        return res._source ?? null;
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'meta' in error &&
            typeof (error as { meta?: { statusCode?: number } }).meta?.statusCode === 'number' &&
            (error as { meta?: { statusCode?: number } }).meta?.statusCode === 404
        ) {
            return null;
        }
        throw error;
    }
}

export async function saveExecution(doc: IndexExecutionDocument): Promise<IndexExecutionDocument> {
    await ensureExecutionsIndex();
    const client = getESClient();
    if (!client) {
        throw new Error('Elasticsearch client not available');
    }

    doc.updated_at = new Date().toISOString();

    await client.index({
        index: INDEXING_EXECUTIONS_INDEX,
        id: doc.execution_id,
        document: doc,
        refresh: 'wait_for'
    });

    return doc;
}
