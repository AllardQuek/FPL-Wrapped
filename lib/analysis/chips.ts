import { ChipAnalysis } from '../types';
import { ManagerData } from './types';
import { getPlayer, getPlayerPointsInGameweek, formatPoints } from './utils';
import { CHIP_THRESHOLDS, getVerdictLabel, determineChipVerdictTier, type ChipName } from '@/lib/constants/chipThresholds';
import { averageBenchPoints } from './bench';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';

/**
 * Analyze chip usage
 */
export function analyzeChips(data: ManagerData): ChipAnalysis[] {
    const { history, bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    const analyses: ChipAnalysis[] = [];
    const allChipNames: ChipName[] = [CHIP_NAMES.THREE_XC, CHIP_NAMES.BBOOST, CHIP_NAMES.FREEHIT, CHIP_NAMES.WILDCARD];

    for (const chipName of allChipNames) {
        const chip = history.chips.find(c => c.name === chipName);
        const used = !!chip && finishedGameweeks.includes(chip.event);

        let pointsGained = 0;
        let verdict = "Pending";
        let verdictTier: 'excellent' | 'decent' | 'wasted' | undefined = undefined;
        let details = "You haven't used this chip yet.";
        let isExcellent = false;
        const event = chip?.event || 0;
        let metadata: ChipAnalysis['metadata'] = undefined;

        if (used && chip) {
            if (chip.name === CHIP_NAMES.BBOOST) {
                const picks = picksByGameweek.get(chip.event);
                if (picks) {
                    const bench = picks.picks.filter(p => p.position > 11);
                    const benchPlayers: { name: string; points: number }[] = [];
                    pointsGained = bench.reduce((sum, p) => {
                        const pts = getPlayerPointsInGameweek(p.element, chip.event, liveByGameweek);
                        const player = getPlayer(p.element, bootstrap);
                        if (player) {
                            benchPlayers.push({ name: player.web_name, points: pts });
                        }
                        return sum + pts;
                    }, 0);

                    // Compute your average bench points across finished gameweeks (excluding this chip GW)
                    const avgBenchOther = averageBenchPoints(data, chip.event);
                    const benchDiff = pointsGained - avgBenchOther;

                    // Determine tier via helper
                    verdictTier = determineChipVerdictTier(CHIP_NAMES.BBOOST, { points: pointsGained, diff: benchDiff });
                    isExcellent = verdictTier === 'excellent';
                    verdict = getVerdictLabel(chip.name as ChipName, verdictTier) ?? (verdictTier === 'excellent' ? 'Masterstroke' : verdictTier === 'decent' ? 'Decent' : 'Wasted');

                    details = `Your bench delivered ${formatPoints(pointsGained)}. That's (${formatPoints(Math.round(benchDiff), false)}) vs your average bench of ${formatPoints(Math.round(avgBenchOther))}.`;
                    metadata = { benchPlayers, benchAverage: Math.round(avgBenchOther), benchDiff: Math.round(benchDiff) };
                }
            } else if (chip.name === CHIP_NAMES.THREE_XC) {
                const picks = picksByGameweek.get(chip.event);
                const captain = picks?.picks.find(p => p.is_captain);
                if (captain) {
                    const basePoints = getPlayerPointsInGameweek(captain.element, chip.event, liveByGameweek);
                    const player = getPlayer(captain.element, bootstrap);
                    pointsGained = basePoints;
                    verdictTier = determineChipVerdictTier(CHIP_NAMES.THREE_XC, { points: pointsGained });
                    isExcellent = verdictTier === 'excellent';
                    verdict = getVerdictLabel(CHIP_NAMES.THREE_XC, verdictTier) ?? (isExcellent ? 'Elite Timing' : pointsGained >= CHIP_THRESHOLDS['3xc'].solidPoints ? 'Solid' : 'Unfortunate');
                    details = `${player?.web_name} added ${formatPoints(pointsGained)} net points.`;
                    metadata = {
                        captainName: player?.web_name,
                        captainBasePoints: basePoints
                    };
                }
            } else if (chip.name === CHIP_NAMES.FREEHIT) {
                const currentPicks = picksByGameweek.get(chip.event);
                const previousPicks = picksByGameweek.get(chip.event - 1);
                if (currentPicks && previousPicks) {
                    const fhPoints = currentPicks.entry_history.points;
                    let noChipPoints = 0;
                    
                    // Capture Free Hit team players
                    const freeHitPlayers: { name: string; points: number; multiplier: number }[] = [];
                    for (const pick of currentPicks.picks) {
                        if (pick.position <= 11) {
                            const pts = getPlayerPointsInGameweek(pick.element, chip.event, liveByGameweek);
                            const multiplier = pick.is_captain ? 2 : pick.is_vice_captain ? 1 : 1;
                            const player = getPlayer(pick.element, bootstrap);
                            if (player) {
                                freeHitPlayers.push({ 
                                    name: player.web_name, 
                                    points: pts,
                                    multiplier 
                                });
                            }
                        }
                    }
                    
                    // Capture previous team players
                    const previousTeamPlayers: { name: string; points: number; multiplier: number }[] = [];
                    for (const pick of previousPicks.picks) {
                        if (pick.position <= 11) {
                            const pts = getPlayerPointsInGameweek(pick.element, chip.event, liveByGameweek);
                            const multiplier = pick.is_captain ? 2 : pick.is_vice_captain ? 1 : 1;
                            const player = getPlayer(pick.element, bootstrap);
                            if (player) {
                                previousTeamPlayers.push({ 
                                    name: player.web_name, 
                                    points: pts,
                                    multiplier 
                                });
                            }
                            noChipPoints += pts * multiplier;
                        }
                    }
                    
                    pointsGained = fhPoints - noChipPoints;
                    verdictTier = determineChipVerdictTier(CHIP_NAMES.FREEHIT, { points: pointsGained });
                    isExcellent = verdictTier === 'excellent';
                    verdict = getVerdictLabel('freehit' as ChipName, verdictTier) ?? (isExcellent ? 'Clutch' : pointsGained > 0 ? 'Effective' : 'Backfired');
                    details = `${formatPoints(pointsGained)} vs your old team.`;
                    metadata = {
                        freeHitPoints: fhPoints,
                        previousTeamPoints: noChipPoints,
                        freeHitPlayers,
                        previousTeamPlayers
                    };
                }
            } else if (chip.name === CHIP_NAMES.WILDCARD) {
                const before = finishedGameweeks.filter(g => g < chip.event && g >= chip.event - 4);
                const after = finishedGameweeks.filter(g => g >= chip.event && g < chip.event + 4);
                if (before.length > 0 && after.length > 0) {
                    const beforeData = before.map(g => {
                        const h = history.current.find(h => h.event === g);
                        const avg = bootstrap.events.find(e => e.id === g)?.average_entry_score || 0;
                        const points = h?.points || 0;
                        const hits = h?.event_transfers_cost || 0;
                        return { gw: g, points, hits, avg, net: points - hits - avg };
                    });
                    const afterData = after.map(g => {
                        const h = history.current.find(h => h.event === g);
                        const avg = bootstrap.events.find(e => e.id === g)?.average_entry_score || 0;
                        const points = h?.points || 0;
                        const hits = h?.event_transfers_cost || 0;
                        return { gw: g, points, hits, avg, net: points - hits - avg };
                    });

                    const avgBefore = beforeData.reduce((sum, d) => sum + d.net, 0) / beforeData.length;
                    const avgAfter = afterData.reduce((sum, d) => sum + d.net, 0) / afterData.length;
                    pointsGained = Math.round(avgAfter - avgBefore);
                    verdictTier = determineChipVerdictTier(CHIP_NAMES.WILDCARD, { points: pointsGained });
                    isExcellent = verdictTier === 'excellent';
                    verdict = getVerdictLabel(CHIP_NAMES.WILDCARD, verdictTier) ?? (isExcellent ? 'Transformed' : pointsGained >= 0 ? 'Improved' : 'Tough Run');
                    details = `${formatPoints(pointsGained, 'pts/GW')} relative to average.`;
                    metadata = {
                        gameweeksBefore: before,
                        pointsBefore: beforeData.map(d => d.net),
                        avgBefore: Math.round(avgBefore),
                        gameweeksAfter: after,
                        pointsAfter: afterData.map(d => d.net),
                        avgAfter: Math.round(avgAfter),
                        wildcardDetails: {
                            before: beforeData,
                            after: afterData
                        }
                    };
                }
            }
        }

        analyses.push({
            name: chipName,
            event,
            pointsGained,
            verdict,
            verdictTier,
            details,
            isExcellent,
            used,
            metadata
        });
    }

    return analyses;
}
