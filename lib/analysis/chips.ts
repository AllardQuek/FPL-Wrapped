import { ChipAnalysis } from '../types';
import { ManagerData } from './types';
import { getPlayer, getPlayerPointsInGameweek } from './utils';

/**
 * Analyze chip usage
 */
export function analyzeChips(data: ManagerData): ChipAnalysis[] {
    const { history, bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    const analyses: ChipAnalysis[] = [];
    const allChipNames = ['3xc', 'bboost', 'freehit', 'wildcard'];

    for (const chipName of allChipNames) {
        const chip = history.chips.find(c => c.name === chipName);
        const used = !!chip && finishedGameweeks.includes(chip.event);

        let pointsGained = 0;
        let verdict = "Pending";
        let details = "You haven't used this chip yet.";
        let isExcellent = false;
        const event = chip?.event || 0;
        let metadata: ChipAnalysis['metadata'] = undefined;

        if (used && chip) {
            if (chip.name === 'bboost') {
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
                    isExcellent = pointsGained >= 15;
                    verdict = isExcellent ? "Masterstroke" : pointsGained >= 5 ? "Decent" : "Wasted";
                    details = `Your bench delivered ${pointsGained} extra points.`;
                    metadata = { benchPlayers };
                }
            } else if (chip.name === '3xc') {
                const picks = picksByGameweek.get(chip.event);
                const captain = picks?.picks.find(p => p.is_captain);
                if (captain) {
                    const basePoints = getPlayerPointsInGameweek(captain.element, chip.event, liveByGameweek);
                    const player = getPlayer(captain.element, bootstrap);
                    pointsGained = basePoints;
                    isExcellent = pointsGained >= 12;
                    verdict = isExcellent ? "Elite Timing" : pointsGained >= 4 ? "Solid" : "Unfortunate";
                    details = `${player?.web_name} added ${pointsGained} net points.`;
                    metadata = {
                        captainName: player?.web_name,
                        captainBasePoints: basePoints
                    };
                }
            } else if (chip.name === 'freehit') {
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
                    isExcellent = pointsGained >= 10;
                    verdict = isExcellent ? "Clutch" : pointsGained > 0 ? "Effective" : "Backfired";
                    details = `${pointsGained >= 0 ? 'Gained' : 'Lost'} ${Math.abs(pointsGained)} points vs your old team.`;
                    metadata = {
                        freeHitPoints: fhPoints,
                        previousTeamPoints: noChipPoints,
                        freeHitPlayers,
                        previousTeamPlayers
                    };
                }
            } else if (chip.name === 'wildcard') {
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
                    isExcellent = pointsGained >= 5;
                    verdict = isExcellent ? "Transformed" : pointsGained >= 0 ? "Improved" : "Tough Run";
                    details = `${pointsGained >= 0 ? 'Up' : 'Down'} ${Math.abs(pointsGained)} pts/GW relative to average.`;
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
            details,
            isExcellent,
            used,
            metadata
        });
    }

    return analyses;
}
