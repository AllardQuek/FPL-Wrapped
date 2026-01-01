import { TransferAnalysis } from '../types';
import { ManagerData, TransferTiming } from './types';
import { getPlayer, getPlayerPointsInGameweek } from './utils';
import { calculateHoursBeforeDeadline, getLocalHourOfDay, getTimezoneForRegion, isWithinPriceRiseWindow } from './timezone';

/**
 * Calculate enhanced metrics from points history
 */
function calculateEnhancedMetrics(
    pointsHistory: { gw: number; in: number; out: number }[],
    gameweeksHeld: number,
    pointsGained: number,
    hitCost: number
): {
    ppgDifferential: number;
    winRate: number;
    bestStreak: number;
    worstStreak: number;
    netGainAfterHit: number;
} {
    if (pointsHistory.length === 0) {
        return { ppgDifferential: 0, winRate: 0, bestStreak: 0, worstStreak: 0, netGainAfterHit: -hitCost };
    }

    // PPG differential (normalized for ownership duration)
    const ppgDifferential = gameweeksHeld > 0 ? pointsGained / gameweeksHeld : 0;

    // Win rate: % of weeks playerIn outscored playerOut
    const wins = pointsHistory.filter(h => h.in > h.out).length;
    const winRate = (wins / pointsHistory.length) * 100;

    // Calculate streaks
    let bestStreak = 0;
    let worstStreak = 0;
    let currentWinStreak = 0;
    let currentLoseStreak = 0;

    for (const week of pointsHistory) {
        if (week.in > week.out) {
            currentWinStreak++;
            currentLoseStreak = 0;
            bestStreak = Math.max(bestStreak, currentWinStreak);
        } else if (week.out > week.in) {
            currentLoseStreak++;
            currentWinStreak = 0;
            worstStreak = Math.max(worstStreak, currentLoseStreak);
        } else {
            // Draw - reset both streaks
            currentWinStreak = 0;
            currentLoseStreak = 0;
        }
    }

    return {
        ppgDifferential: Math.round(ppgDifferential * 10) / 10,
        winRate: Math.round(winRate),
        bestStreak,
        worstStreak,
        netGainAfterHit: pointsGained - hitCost
    };
}

/**
 * Analyze all transfers made by a manager
 */
export function analyzeTransfers(data: ManagerData): TransferAnalysis[] {
    const { bootstrap, transfers, liveByGameweek, finishedGameweeks, picksByGameweek, history } = data;
    const analyses: TransferAnalysis[] = [];

    // Get chip usage to filter out wildcard/freehit transfers
    const chipsByGW = new Map<number, string>();
    history.chips.forEach(chip => {
        chipsByGW.set(chip.event, chip.name);
    });

    // Build a map of hit costs per gameweek
    const hitCostByGW = new Map<number, number>();
    history.current.forEach(gw => {
        hitCostByGW.set(gw.event, gw.event_transfers_cost);
    });

    // Count transfers per GW to distribute hit cost
    const transfersPerGW = new Map<number, number>();
    for (const transfer of transfers) {
        const chipUsed = chipsByGW.get(transfer.event);
        if (chipUsed === 'freehit' || chipUsed === 'wildcard') continue;
        transfersPerGW.set(transfer.event, (transfersPerGW.get(transfer.event) || 0) + 1);
    }

    const sortedFinishedGWs = [...finishedGameweeks].sort((a, b) => a - b);

    for (const transfer of transfers) {
        const chipUsed = chipsByGW.get(transfer.event);

        // Skip Free Hit transfers entirely (they're temporary)
        if (chipUsed === 'freehit') {
            continue;
        }

        // Skip Wildcard transfers from API (we'll calculate net transfers separately)
        if (chipUsed === 'wildcard') {
            continue;
        }

        const playerIn = getPlayer(transfer.element_in, bootstrap);
        const playerOut = getPlayer(transfer.element_out, bootstrap);

        if (!playerIn || !playerOut) continue;

        // Calculate hit cost for this transfer (distributed among transfers in same GW)
        const gwHitCost = hitCostByGW.get(transfer.event) || 0;
        const gwTransferCount = transfersPerGW.get(transfer.event) || 1;
        const hitCost = gwHitCost / gwTransferCount;

        // Calculate points comparison: playerIn vs playerOut
        let pointsIn = 0;
        let pointsOut = 0;
        let gameweeksHeld = 0;
        let lastGW = transfer.event;
        const pointsHistory: { gw: number; in: number; out: number }[] = [];

        for (const gw of sortedFinishedGWs) {
            if (gw < transfer.event) continue;

            const picks = picksByGameweek.get(gw);
            if (!picks) continue;

            const playerStillOwned = picks.picks.some(p => p.element === transfer.element_in);
            if (!playerStillOwned) {
                // Check if they appear in the next gameweek (might be a Free Hit or data gap)
                const nextGW = gw + 1;
                const nextPicks = picksByGameweek.get(nextGW);
                const ownedNext = nextPicks?.picks.some(p => p.element === transfer.element_in);

                if (!ownedNext) break;
                // If owned next, we skip this week's points (as they weren't in the active squad)
                continue;
            }

            gameweeksHeld++;
            lastGW = gw;
            const pIn = getPlayerPointsInGameweek(transfer.element_in, gw, liveByGameweek);
            const pOut = getPlayerPointsInGameweek(transfer.element_out, gw, liveByGameweek);

            pointsIn += pIn;
            pointsOut += pOut;
            pointsHistory.push({ gw, in: pIn, out: pOut });
        }

        const pointsGained = pointsIn - pointsOut;
        
        // Calculate enhanced metrics
        const enhanced = calculateEnhancedMetrics(pointsHistory, gameweeksHeld, pointsGained, hitCost);
        
        let verdict: TransferAnalysis['verdict'];
        if (pointsGained >= 20) verdict = 'excellent';
        else if (pointsGained >= 5) verdict = 'good';
        else if (pointsGained >= -5) verdict = 'neutral';
        else if (pointsGained >= -15) verdict = 'poor';
        else verdict = 'terrible';

        analyses.push({
            transfer: { ...transfer },
            playerIn,
            playerOut,
            pointsGained,
            gameweeksHeld,
            ownedGWRange: { start: transfer.event, end: lastGW },
            verdict,
            breakdown: {
                pointsIn,
                pointsOut,
                gwRange: `GW${transfer.event}-GW${lastGW}`,
                pointsHistory
            },
            // Enhanced metrics
            ppgDifferential: enhanced.ppgDifferential,
            winRate: enhanced.winRate,
            hitCost,
            netGainAfterHit: enhanced.netGainAfterHit,
            bestStreak: enhanced.bestStreak,
            worstStreak: enhanced.worstStreak
        });
    }

    // Final Wildcard Net Transfer Calculation (The Fix)
    for (const [gw, chipName] of chipsByGW.entries()) {
        if (chipName !== 'wildcard') continue;
        if (!sortedFinishedGWs.includes(gw)) continue;

        const prevGW = gw - 1;
        const prevPicks = picksByGameweek.get(prevGW);
        const currPicks = picksByGameweek.get(gw);

        if (!prevPicks || !currPicks) continue;

        const prevPlayerIds = new Set(prevPicks.picks.map(p => p.element));
        const currPlayerIds = new Set(currPicks.picks.map(p => p.element));

        // Get players that changed
        const netInIds = currPicks.picks
            .map(p => p.element)
            .filter(id => !prevPlayerIds.has(id));

        const netOutIds = prevPicks.picks
            .map(p => p.element)
            .filter(id => !currPlayerIds.has(id));

        // Group by position (element_type) to make logical pairs
        const playersByPosIn: Record<number, number[]> = {};
        const playersByPosOut: Record<number, number[]> = {};

        netInIds.forEach(id => {
            const p = getPlayer(id, bootstrap);
            if (p) {
                if (!playersByPosIn[p.element_type]) playersByPosIn[p.element_type] = [];
                playersByPosIn[p.element_type].push(id);
            }
        });

        netOutIds.forEach(id => {
            const p = getPlayer(id, bootstrap);
            if (p) {
                if (!playersByPosOut[p.element_type]) playersByPosOut[p.element_type] = [];
                playersByPosOut[p.element_type].push(id);
            }
        });

        // Loop through positions 1-4 (GKP, DEF, MID, FWD)
        for (let pos = 1; pos <= 4; pos++) {
            const posIn = playersByPosIn[pos] || [];
            const posOut = playersByPosOut[pos] || [];
            const numTransfers = Math.min(posIn.length, posOut.length);

            for (let i = 0; i < numTransfers; i++) {
                const playerIn = getPlayer(posIn[i], bootstrap);
                const playerOut = getPlayer(posOut[i], bootstrap);

                if (!playerIn || !playerOut) continue;

                let pointsIn = 0;
                let pointsOut = 0;
                let gameweeksHeld = 0;
                let lastGW = gw;
                const pointsHistory: { gw: number; in: number; out: number }[] = [];

                for (const fGW of sortedFinishedGWs) {
                    if (fGW < gw) continue;
                    const picks = picksByGameweek.get(fGW);

                    const playerStillOwned = picks?.picks.some(p => p.element === playerIn.id);
                    if (!playerStillOwned) {
                        const nextGW = fGW + 1;
                        const nextPicks = picksByGameweek.get(nextGW);
                        const ownedNext = nextPicks?.picks.some(p => p.element === playerIn.id);
                        if (!ownedNext) break;
                        continue;
                    }

                    gameweeksHeld++;
                    lastGW = fGW;
                    const pIn = getPlayerPointsInGameweek(playerIn.id, fGW, liveByGameweek);
                    const pOut = getPlayerPointsInGameweek(playerOut.id, fGW, liveByGameweek);

                    pointsIn += pIn;
                    pointsOut += pOut;
                    pointsHistory.push({ gw: fGW, in: pIn, out: pOut });
                }

                const pointsGained = pointsIn - pointsOut;
                
                // Enhanced metrics (wildcards have no hit cost)
                const enhanced = calculateEnhancedMetrics(pointsHistory, gameweeksHeld, pointsGained, 0);
                
                let verdict: TransferAnalysis['verdict'];
                if (pointsGained >= 20) verdict = 'excellent';
                else if (pointsGained >= 5) verdict = 'good';
                else if (pointsGained >= -5) verdict = 'neutral';
                else if (pointsGained >= -15) verdict = 'poor';
                else verdict = 'terrible';

                analyses.push({
                    transfer: {
                        element_in: playerIn.id,
                        element_out: playerOut.id,
                        event: gw,
                        entry: 0,
                        element_in_cost: 0,
                        element_out_cost: 0,
                        time: ''
                    },
                    playerIn,
                    playerOut,
                    pointsGained,
                    gameweeksHeld,
                    ownedGWRange: { start: gw, end: lastGW },
                    verdict,
                    isWildcard: true,
                    breakdown: {
                        pointsIn,
                        pointsOut,
                        gwRange: `GW${gw}-GW${lastGW}`,
                        pointsHistory
                    },
                    // Enhanced metrics
                    ppgDifferential: enhanced.ppgDifferential,
                    winRate: enhanced.winRate,
                    hitCost: 0,
                    netGainAfterHit: enhanced.netGainAfterHit,
                    bestStreak: enhanced.bestStreak,
                    worstStreak: enhanced.worstStreak
                });
            }
        }
    }

    return analyses;
}

/**
 * Analyze the timing of transfers relative to gameweek deadlines
 * Detects patterns like panic buying (last minute), early planning, or reactive behavior
 * Note: FPL deadline is typically 90 mins before first fixture kickoff
 */
export function analyzeTransferTiming(data: ManagerData): TransferTiming {
    const { bootstrap, transfers, history, managerInfo } = data;
    
    // Get user's timezone from their region
    const userTimezone = getTimezoneForRegion(managerInfo.player_region_name);
    
    // Get chip usage to filter out wildcard/freehit transfers
    const chipsByGW = new Map<number, string>();
    history.chips.forEach(chip => {
        chipsByGW.set(chip.event, chip.name);
    });
    
    // Filter to non-chip transfers only (more meaningful for timing analysis)
    const meaningfulTransfers = transfers.filter(t => {
        const chipUsed = chipsByGW.get(t.event);
        return !chipUsed || (chipUsed !== 'wildcard' && chipUsed !== 'freehit');
    });
    
    if (meaningfulTransfers.length === 0) {
        return {
            panicTransfers: 0,
            deadlineDayTransfers: 0,
            midWeekTransfers: 0,
            earlyStrategicTransfers: 0,
            kneeJerkTransfers: 0,
            avgHoursBeforeDeadline: 0,
            avgLocalHourOfDay: 12,
            lateNightTransfers: 0,
            priceRiseChasers: 0,
        };
    }
    
    let panicCount = 0;
    let deadlineDayCount = 0;
    let midWeekCount = 0;
    let earlyStrategicCount = 0;
    let kneeJerkCount = 0;
    let lateNightCount = 0;
    let priceRiseChaserCount = 0;
    let totalHoursBeforeDeadline = 0;
    let totalLocalHour = 0;
    let validTransfers = 0;
    
    for (const transfer of meaningfulTransfers) {
        // Find the gameweek deadline for this transfer
        const gameweek = bootstrap.events.find(gw => gw.id === transfer.event);
        if (!gameweek || !transfer.time) continue;
        
        // Also find the PREVIOUS gameweek deadline to detect knee-jerk reactions
        const previousGameweek = bootstrap.events.find(gw => gw.id === transfer.event - 1);
        
        const hoursBeforeDeadline = calculateHoursBeforeDeadline(
            transfer.time,
            gameweek.deadline_time
        );
        
        const localHour = getLocalHourOfDay(transfer.time, userTimezone);
        
        // Only count transfers made before the deadline (positive hours)
        if (hoursBeforeDeadline > 0) {
            validTransfers++;
            totalHoursBeforeDeadline += hoursBeforeDeadline;
            totalLocalHour += localHour;
            
            // Check for knee-jerk: Transfer made within 48h of PREVIOUS GW deadline
            // This means they're reacting to early fixtures, not full GW data
            if (previousGameweek) {
                const transferTime = new Date(transfer.time);
                const previousDeadline = new Date(previousGameweek.deadline_time);
                const hoursAfterPreviousDeadline = (transferTime.getTime() - previousDeadline.getTime()) / (1000 * 60 * 60);
                
                // Knee-jerk: Made transfer within 48h of previous GW starting
                if (hoursAfterPreviousDeadline < 48 && hoursAfterPreviousDeadline > 0) {
                    kneeJerkCount++;
                }
            }
            
            // Categorize by timing relative to THIS GW's deadline
            if (hoursBeforeDeadline <= 3) {
                // Panic: < 3 hours before deadline (extreme last-minute)
                panicCount++;
            } else if (hoursBeforeDeadline <= 24) {
                // Deadline day: 3-24 hours (scrambling on deadline day)
                deadlineDayCount++;
            } else if (hoursBeforeDeadline <= 96) {
                // Mid-week: 24-96 hours (measured adjustment)
                midWeekCount++;
            } else {
                // Early strategic: 96+ hours (methodical planning after full data)
                earlyStrategicCount++;
            }
            
            // Check for late night transfers (11pm-5am local time)
            // Indicates reactive/emotional decision-making
            if (localHour >= 23 || localHour <= 5) {
                lateNightCount++;
            }
            
            // Check for price rise chasers (transfers made 7:30am-9:30am SGT)
            // Price changes happen at 9:30am SGT daily
            if (transfer.time && isWithinPriceRiseWindow(transfer.time)) {
                priceRiseChaserCount++;
            }
        }
    }
    
    return {
        panicTransfers: panicCount,
        deadlineDayTransfers: deadlineDayCount,
        midWeekTransfers: midWeekCount,
        earlyStrategicTransfers: earlyStrategicCount,
        kneeJerkTransfers: kneeJerkCount,
        avgHoursBeforeDeadline: validTransfers > 0 ? totalHoursBeforeDeadline / validTransfers : 0,
        avgLocalHourOfDay: validTransfers > 0 ? totalLocalHour / validTransfers : 12,
        lateNightTransfers: lateNightCount,
        priceRiseChasers: priceRiseChaserCount,
    };
}
