import { BenchAnalysis, Player } from '../types';
import { ManagerData } from './types';
import { getPlayer, getPlayerPointsInGameweek } from './utils';
import { ELEMENT_TYPE_TO_POSITION, type Position } from '@/lib/constants/positions';

/**
 * Analyze bench decisions for each gameweek
 */
export function analyzeBench(data: ManagerData): BenchAnalysis[] {
    const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    const analyses: BenchAnalysis[] = [];

    for (const gw of finishedGameweeks) {
        const picks = picksByGameweek.get(gw);
        if (!picks) continue;

        const starters = picks.picks.filter((p) => p.position <= 11);
        const bench = picks.picks.filter((p) => p.position > 11);

        const benchPlayers: { player: Player; points: number }[] = [];
        let totalBenchPoints = 0;

        for (const pick of bench) {
            const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
            const player = getPlayer(pick.element, bootstrap);
            if (player) {
                benchPlayers.push({ player, points });
                totalBenchPoints += points;
            }
        }

        // Find started players by position
        const startedPlayers: { player: Player; points: number; position: Position }[] = [];
        let startedKeeperPoints = 0;
        let lowestStarterPoints = Infinity;

        for (const pick of starters) {
            const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
            const player = getPlayer(pick.element, bootstrap);
            if (player) {
                const position = ELEMENT_TYPE_TO_POSITION[player.element_type];
                startedPlayers.push({ player, points, position });
                
                if (position === 'GKP') {
                    startedKeeperPoints = points;
                }
                
                if (points < lowestStarterPoints) {
                    lowestStarterPoints = points;
                }
            }
        }

        // Calculate missed points for each bench player
        let maxMissedPoints = 0;
        let bestBenchPick: { player: Player; points: number } | null = null;
        let errorPosition: Position | undefined;
        let replacedPlayerPoints = 0;
        let replacedPlayers: { player: Player; points: number }[] = [];

        for (const benchPlayer of benchPlayers) {
            if (!benchPlayer.player) continue;
            
            const benchPosition = ELEMENT_TYPE_TO_POSITION[benchPlayer.player.element_type];
            let missedPointsForThisPlayer = 0;
            let comparisonPoints = 0;
            
            if (benchPosition === 'GKP') {
                // For goalkeepers, compare with the started keeper
                comparisonPoints = startedKeeperPoints;
                missedPointsForThisPlayer = Math.max(0, benchPlayer.points - startedKeeperPoints);
            } else {
                // For other positions, can sub for any starter, so compare with lowest starter
                comparisonPoints = lowestStarterPoints === Infinity ? 0 : lowestStarterPoints;
                missedPointsForThisPlayer = Math.max(0, benchPlayer.points - comparisonPoints);
            }
            
            if (missedPointsForThisPlayer > maxMissedPoints) {
                maxMissedPoints = missedPointsForThisPlayer;
                bestBenchPick = benchPlayer;
                errorPosition = benchPosition;
                replacedPlayerPoints = comparisonPoints;

                // Determine which starter(s) would be replaced
                if (benchPosition === 'GKP') {
                    const keeper = startedPlayers.find((s) => s.position === 'GKP');
                    replacedPlayers = keeper ? [{ player: keeper.player, points: comparisonPoints }] : [];
                } else {
                    // Find all starters matching the lowest starter points (ties possible)
                    replacedPlayers = startedPlayers
                        .filter((s) => s.points === comparisonPoints)
                        .map((s) => ({ player: s.player, points: s.points }));
                }
            }
        }

        const missedPoints = maxMissedPoints;
        // Only count as a "selection error" if the difference is significant (3+ points)
        // This filters out marginal calls and focuses on genuine mistakes
        const hadBenchRegret = missedPoints > 3;

        analyses.push({
            gameweek: gw,
            benchPoints: totalBenchPoints,
            benchPlayers,
            lowestStarterPoints: lowestStarterPoints === Infinity ? 0 : lowestStarterPoints,
            missedPoints,
            bestBenchPick: hadBenchRegret ? bestBenchPick : null,
            hadBenchRegret,
            errorPosition,
            replacedPlayerPoints,
            replacedPlayers: hadBenchRegret ? replacedPlayers : undefined,
        });
    }

    return analyses;
}

/**
 * Compute the average bench points across finished gameweeks, optionally excluding a specific GW.
 * Returns 0 if no eligible gameweeks are found.
 */
export function averageBenchPoints(data: ManagerData, excludeGameweek?: number): number {
    const { picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    let total = 0;
    let count = 0;

    for (const gw of finishedGameweeks) {
        if (excludeGameweek !== undefined && gw === excludeGameweek) continue;
        const picks = picksByGameweek.get(gw);
        if (!picks) continue;

        const bench = picks.picks.filter(p => p.position > 11);
        const gwBenchPoints = bench.reduce((s, p) => s + getPlayerPointsInGameweek(p.element, gw, liveByGameweek), 0);
        total += gwBenchPoints;
        count++;
    }

    return count > 0 ? total / count : 0;
}