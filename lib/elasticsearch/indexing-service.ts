import { getESClient } from './client';
import { transformToGameweekDecision } from './transformer';
import {
    getBootstrapData,
    getGameWeekPicks,
    getLiveGameWeek,
    getManagerInfo,
    getManagerTransfers,
    getLeagueStandings
} from '../fpl-api';

const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';

export interface IndexingProgress {
    type: 'manager' | 'league' | 'gameweek';
    id: number;
    name?: string;
    current: number;
    total: number;
    message: string;
}

export type ProgressCallback = (progress: IndexingProgress) => void;

/**
 * Index a single manager's gameweek decisions
 */
export async function indexManagerGameweek(
    managerId: number,
    gameweek: number,
    leagueIds: number[] = []
): Promise<boolean> {
    try {
        // Fetch required data
        const [bootstrap, managerInfo, picks, transfers, liveGW] = await Promise.all([
            getBootstrapData(),
            getManagerInfo(managerId),
            getGameWeekPicks(managerId, gameweek),
            getManagerTransfers(managerId),
            getLiveGameWeek(gameweek),
        ]);

        // Transform to ES document
        const document = transformToGameweekDecision(
            managerId,
            managerInfo,
            gameweek,
            picks,
            transfers,
            liveGW,
            bootstrap,
            leagueIds
        );

        // Index to ES
        const client = getESClient();
        if (!client) {
            throw new Error('Elasticsearch client not available');
        }

        const docId = `${managerId}-gw${gameweek}`;
        await client.index({
            index: indexName,
            id: docId,
            document,
        });

        return true;
    } catch (error) {
        console.error(`❌ Failed to index manager ${managerId} for GW${gameweek}:`, error);
        return false;
    }
}

/**
 * Index all gameweeks for a single manager
 */
export async function indexManagerAllGameweeks(
    managerId: number,
    fromGW: number = 1,
    toGW?: number,
    onProgress?: ProgressCallback
): Promise<{ success: number; failed: number; skipped: number }> {
    try {
        // Get bootstrap to determine current gameweek
        const bootstrap = await getBootstrapData();
        const currentGW = toGW || bootstrap.events.find(e => e.is_current)?.id || 38;
        const totalGWs = currentGW - fromGW + 1;

        let managerName = `Manager ${managerId}`;
        try {
            const info = await getManagerInfo(managerId);
            managerName = info.name;
        } catch (e) {
            // Ignore if info fails, we'll try again inside indexManagerGameweek
        }

        let success = 0;
        let failed = 0;
        let skipped = 0;

        for (let gw = fromGW; gw <= currentGW; gw++) {
            const gwEvent = bootstrap.events.find(e => e.id === gw);
            if (gwEvent && !gwEvent.finished && !gwEvent.is_current) {
                skipped++;
                onProgress?.({
                    type: 'gameweek',
                    id: gw,
                    current: gw - fromGW + 1,
                    total: totalGWs,
                    message: `GW${gw}: Not started yet, skipping`
                });
                continue;
            }

            const result = await indexManagerGameweek(managerId, gw);
            if (result) {
                success++;
                onProgress?.({
                    type: 'gameweek',
                    id: gw,
                    current: gw - fromGW + 1,
                    total: totalGWs,
                    message: `Successfully indexed GW${gw}`
                });
            } else {
                failed++;
                onProgress?.({
                    type: 'gameweek',
                    id: gw,
                    current: gw - fromGW + 1,
                    total: totalGWs,
                    message: `Failed to index GW${gw}`
                });
            }

            // Small delay between gameweeks to be nice to FPL API
            if (gw < currentGW) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return { success, failed, skipped };
    } catch (error) {
        console.error(`❌ Failed to index manager ${managerId}:`, error);
        return { success: 0, failed: 1, skipped: 0 };
    }
}

/**
 * Index all managers in a league for all gameweeks
 */
export async function indexLeagueAllGameweeks(
    leagueId: number,
    fromGW: number = 1,
    toGW?: number,
    onProgress?: ProgressCallback
): Promise<{ managersProcessed: number; totalSuccess: number; totalFailed: number }> {
    try {
        // Fetch league standings
        const standings = await getLeagueStandings(leagueId, 1);
        const managers = standings.standings.results;

        onProgress?.({
            type: 'league',
            id: leagueId,
            current: 0,
            total: managers.length,
            message: `Found ${managers.length} managers in league. Starting bulk index...`
        });

        let totalSuccess = 0;
        let totalFailed = 0;

        for (let i = 0; i < managers.length; i++) {
            const manager = managers[i];
            onProgress?.({
                type: 'manager',
                id: manager.entry,
                name: manager.player_name,
                current: i + 1,
                total: managers.length,
                message: `Processing manager ${i + 1}/${managers.length}: ${manager.player_name}`
            });

            const result = await indexManagerAllGameweeks(manager.entry, fromGW, toGW);
            totalSuccess += result.success;
            totalFailed += result.failed;

            // Delay between managers
            if (i < managers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return {
            managersProcessed: managers.length,
            totalSuccess,
            totalFailed
        };
    } catch (error) {
        console.error(`❌ Failed to index league ${leagueId}:`, error);
        throw error;
    }
}
