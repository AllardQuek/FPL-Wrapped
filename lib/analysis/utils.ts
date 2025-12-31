import { FPLBootstrap, LiveGameWeek, Player } from '../types';

/**
 * Get player points for a specific gameweek from live data
 */
export function getPlayerPointsInGameweek(
    playerId: number,
    gameweek: number,
    liveByGameweek: Map<number, LiveGameWeek>
): number {
    const live = liveByGameweek.get(gameweek);
    if (!live) return 0;

    const element = live.elements.find((e) => e.id === playerId);
    return element?.stats.total_points ?? 0;
}

/**
 * Get player by ID from bootstrap data
 */
export function getPlayer(playerId: number, bootstrap: FPLBootstrap): Player | undefined {
    return bootstrap.elements.find((p) => p.id === playerId);
}

/**
 * Calculate a grade based on a score relative to expected
 */
export function calculateGrade(
    score: number,
    thresholds: { a: number; b: number; c: number; d: number }
): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= thresholds.a) return 'A';
    if (score >= thresholds.b) return 'B';
    if (score >= thresholds.c) return 'C';
    if (score >= thresholds.d) return 'D';
    return 'F';
}
