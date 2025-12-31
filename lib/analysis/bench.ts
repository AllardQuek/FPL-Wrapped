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

        let lowestStarterPoints = Infinity;
        for (const pick of starters) {
            const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
            if (points < lowestStarterPoints) {
                lowestStarterPoints = points;
            }
        }

        const bestBenchPlayer = benchPlayers.reduce(
            (best, current) => (current.points > best.points ? current : best),
            benchPlayers[0] || { player: null, points: 0 }
        );

        const missedPoints = Math.max(0, (bestBenchPlayer.points || 0) - (lowestStarterPoints === Infinity ? 0 : lowestStarterPoints));
        // Only count as a "selection error" if the difference is significant (3+ points)
        // This filters out marginal calls and focuses on genuine mistakes
        const hadBenchRegret = missedPoints > 3;

        // Track position of the error for granular insights
        let errorPosition: Position | undefined;
        if (hadBenchRegret && bestBenchPlayer.player) {
            const positionId = bestBenchPlayer.player.element_type;
            errorPosition = ELEMENT_TYPE_TO_POSITION[positionId];
        }

        analyses.push({
            gameweek: gw,
            benchPoints: totalBenchPoints,
            benchPlayers,
            lowestStarterPoints: lowestStarterPoints === Infinity ? 0 : lowestStarterPoints,
            missedPoints,
            bestBenchPick: hadBenchRegret ? (bestBenchPlayer as { player: Player; points: number }) : null,
            hadBenchRegret,
            errorPosition,
        });
    }

    return analyses;
}
