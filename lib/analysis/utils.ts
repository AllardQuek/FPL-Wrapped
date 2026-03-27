import { FPLBootstrap, LiveGameWeek, Player } from '../types';

// Memoization caches for expensive lookups
const pointsCache = new WeakMap<LiveGameWeek, Map<number, number>>();
const playerCache = new WeakMap<FPLBootstrap, Map<number, Player>>();

/**
 * Get player points for a specific gameweek from live data.
 * Optimized with a WeakMap cache to avoid O(N) linear search in live elements.
 */
export function getPlayerPointsInGameweek(
    playerId: number,
    gameweek: number,
    liveByGameweek: Map<number, LiveGameWeek>
): number {
    const live = liveByGameweek.get(gameweek);
    if (!live) return 0;

    let pointsMap = pointsCache.get(live);
    if (!pointsMap) {
        pointsMap = new Map();
        for (const element of live.elements) {
            pointsMap.set(element.id, element.stats.total_points);
        }
        pointsCache.set(live, pointsMap);
    }

    return pointsMap.get(playerId) ?? 0;
}

/**
 * Get player by ID from bootstrap data.
 * Optimized with a WeakMap cache to avoid O(N) linear search in bootstrap elements.
 */
export function getPlayer(playerId: number, bootstrap: FPLBootstrap): Player | undefined {
    let playersMap = playerCache.get(bootstrap);
    if (!playersMap) {
        playersMap = new Map();
        for (const p of bootstrap.elements) {
            playersMap.set(p.id, p);
        }
        playerCache.set(bootstrap, playersMap);
    }
    return playersMap.get(playerId);
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

/**
 * Format a points number with a sign and optional unit.
 * Examples:
 *  formatPoints(5) => '+5 pts'
 *  formatPoints(-2) => '-2 pts'
 *  formatPoints(0) => '0 pts'
 *  formatPoints(3, 'pts/GW') => '+3 pts/GW'
 *  formatPoints(3, false) => '+3'
 */
export function formatPoints(value: number, unit: string | false = 'pts'): string {
    const signed = value > 0 ? `+${value}` : `${value}`;
    return unit === false ? signed : `${signed} ${unit}`;
}
