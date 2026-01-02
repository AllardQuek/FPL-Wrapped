import { Player, SeasonSummary } from '../types';
import { ManagerData } from './types';
import { analyzeTransfers, analyzeTransferTiming } from './transfers';
import { analyzeCaptaincy } from './captaincy';
import { analyzeBench } from './bench';
import { analyzeChips } from './chips';
import { calculateManagerPersona } from './persona';
import { calculateGrade, getPlayer, getPlayerPointsInGameweek } from './utils';
import { ELEMENT_TYPE_TO_POSITION, type Position } from '@/lib/constants/positions';

/**
 * Calculate the template overlap percentage of the manager's team.
 * 
 * The "template" is defined as any player with ownership >= 15% (selected_by_percent).
 * This represents highly-owned players that most managers have. We calculate what 
 * percentage of the manager's squad (across all finished gameweeks) consists of 
 * these template picks.
 * 
 * @returns Percentage (0-100) representing template overlap
 */
export function calculateTemplateOverlap(data: ManagerData): number {
    const { bootstrap, picksByGameweek, finishedGameweeks } = data;
    if (finishedGameweeks.length === 0) return 0;

    // Template threshold: players with 15%+ ownership are considered "template picks"
    const TEMPLATE_OWNERSHIP_THRESHOLD = 15.0;

    // Build set of template player IDs (ownership >= 15%)
    const templatePlayerIds = new Set(
        bootstrap.elements
            .filter(p => parseFloat(p.selected_by_percent) >= TEMPLATE_OWNERSHIP_THRESHOLD)
            .map(p => p.id)
    );
    
    // Count how many of the manager's squad slots are template picks
    let totalTemplateMatches = 0;
    let totalSquadSlots = 0;

    for (const gw of finishedGameweeks) {
        const picks = picksByGameweek.get(gw);
        if (!picks || !picks.picks || picks.picks.length === 0) continue;

        // Check all 15 squad members
        totalSquadSlots += picks.picks.length;

        for (const pick of picks.picks) {
            if (templatePlayerIds.has(pick.element)) {
                totalTemplateMatches++;
            }
        }
    }

    return totalSquadSlots > 0 ? (totalTemplateMatches / totalSquadSlots) * 100 : 0;
}

/**
 * Calculate the top point contributors (MVPs)
 */
export function calculateTopContributors(data: ManagerData): { player: Player; points: number; percentage: number }[] {
    const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
    const playerPoints = new Map<number, number>();
    let totalSquadPoints = 0;

    for (const gw of finishedGameweeks) {
        const picks = picksByGameweek.get(gw);
        if (!picks) continue;

        const starters = picks.picks.filter((p) => p.position <= 11);

        for (const pick of starters) {
            const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
            const multipliedPoints = points * pick.multiplier;

            const current = playerPoints.get(pick.element) ?? 0;
            playerPoints.set(pick.element, current + multipliedPoints);
            totalSquadPoints += multipliedPoints;
        }
    }

    const contributors = Array.from(playerPoints.entries())
        .map(([playerId, points]) => {
            const player = getPlayer(playerId, bootstrap);
            return {
                player: player!,
                points,
                percentage: totalSquadPoints > 0 ? Math.round((points / totalSquadPoints) * 100) : 0
            };
        })
        .filter(c => c.player && c.points > 0)
        .sort((a, b) => b.points - a.points);

    return contributors;
}

/**
 * Calculate patience metrics (longest held player, etc.)
 */
export function calculatePatienceMetrics(data: ManagerData): SeasonSummary['patienceMetrics'] {
    const { picksByGameweek, finishedGameweeks, bootstrap } = data;
    if (finishedGameweeks.length === 0) {
        return { longestHeldPlayer: null, longTermHoldsCount: 0, avgHoldLength: 0 };
    }

    const playerDurations = new Map<number, number>();
    
    for (const gw of finishedGameweeks) {
        const picks = picksByGameweek.get(gw);
        if (!picks) continue;
        
        for (const pick of picks.picks) {
            playerDurations.set(pick.element, (playerDurations.get(pick.element) || 0) + 1);
        }
    }

    let maxWeeks = 0;
    let longestHeldPlayerId = -1;
    let totalWeeks = 0;
    let longTermHoldsCount = 0;
    const LONG_TERM_THRESHOLD = 10; // 10 weeks is a solid long-term hold

    playerDurations.forEach((weeks, playerId) => {
        totalWeeks += weeks;
        if (weeks > maxWeeks) {
            maxWeeks = weeks;
            longestHeldPlayerId = playerId;
        }
        if (weeks >= LONG_TERM_THRESHOLD) {
            longTermHoldsCount++;
        }
    });

    const avgHoldLength = playerDurations.size > 0 ? totalWeeks / playerDurations.size : 0;
    
    let longestHeldPlayer = null;
    if (longestHeldPlayerId !== -1) {
        const player = getPlayer(longestHeldPlayerId, bootstrap);
        if (player) {
            longestHeldPlayer = { player, weeks: maxWeeks };
        }
    }

    return {
        longestHeldPlayer,
        longTermHoldsCount,
        avgHoldLength: Math.round(avgHoldLength * 10) / 10
    };
}

/**
 * Generate complete season summary with all analysis
 */
export function generateSeasonSummary(data: ManagerData): SeasonSummary {
    const { managerInfo, history } = data;

    // Run all analyses
    const transferAnalyses = analyzeTransfers(data);
    const captaincyAnalyses = analyzeCaptaincy(data);
    const benchAnalyses = analyzeBench(data);
    const chipAnalyses = analyzeChips(data);
    const templateOverlap = calculateTemplateOverlap(data);
    const patienceMetrics = calculatePatienceMetrics(data);
    const transferTiming = analyzeTransferTiming(data);

    // Transfer stats
    const totalTransfers = transferAnalyses.length; // Count actual analyzed transfers (Free Hits excluded, Wildcards consolidated)
    const totalTransfersCost = history.current.reduce(
        (sum, gw) => sum + gw.event_transfers_cost,
        0
    );
    const netTransferPoints = transferAnalyses.reduce(
        (sum, t) => sum + t.pointsGained,
        0
    );

    const sortedTransfers = [...transferAnalyses].sort(
        (a, b) => b.pointsGained - a.pointsGained
    );
    const bestTransfer = sortedTransfers[0] ?? null;
    const worstTransfer = sortedTransfers[sortedTransfers.length - 1] ?? null;

    const transferEfficiency = netTransferPoints - totalTransfersCost;
    
    // Calculate actual transfer-gameweek opportunities based on actual transfers
    // This accounts for when transfers were actually made and how long they were held
    const actualTransferGWs = transferAnalyses.reduce((sum, t) => sum + t.gameweeksHeld, 0);
    
    // If no transfers or no GWs held, use reasonable defaults
    const effectiveTransferGWs = actualTransferGWs > 0 ? actualTransferGWs : totalTransfers * 10;
    
    // Thresholds: points per transfer per gameweek actually held
    // A: +2.0 pt/transfer/GW (elite - consistently brilliant picks)
    // B: +1.5 pt/transfer/GW (very good returns)
    // C: +1.0 pt/transfer/GW (expected baseline - decent edge)
    // D: +0.5 pt/transfer/GW (below average but acceptable)
    // F: <0.5 pt/transfer/GW (poor/losing value)
    //
    // Example: 20 transfers held for avg 15 GWs = 300 transfer-GWs
    // A: +600 pts, B: +450 pts, C: +300 pts, D: +150 pts
    const transferGrade = calculateGrade(transferEfficiency, {
        a: effectiveTransferGWs * 2.0,
        b: effectiveTransferGWs * 1.5,
        c: effectiveTransferGWs * 1.0,
        d: effectiveTransferGWs * 0.5,
    });

    // Captaincy stats
    const totalCaptaincyPoints = captaincyAnalyses.reduce(
        (sum, c) => sum + c.captainPoints,
        0
    );
    // Optimal captaincy points: sum of best starter raw points multiplied by the captain multiplier used that GW
    const optimalCaptaincyPoints = captaincyAnalyses.reduce(
        (sum, c) => sum + (c.bestPickPoints * (c.captainMultiplier ?? 2)),
        0
    );
    // Points left on table is the net team difference per GW, already computed in analyses
    const captaincyPointsLost = captaincyAnalyses.reduce((sum, c) => sum + c.pointsLeftOnTable, 0);
    const successfulCaptaincies = captaincyAnalyses.filter((c) => c.wasSuccessful).length;
    const captaincySuccessRate = captaincyAnalyses.length > 0
        ? (successfulCaptaincies / captaincyAnalyses.length) * 100
        : 0;

    const sortedCaptaincy = [...captaincyAnalyses].sort(
        (a, b) => b.captainPoints - a.captainPoints
    );
    const bestCaptainPick = sortedCaptaincy[0] ?? null;
    const sortedWorstCaptaincy = [...captaincyAnalyses].sort(
        (a, b) => b.pointsLeftOnTable - a.pointsLeftOnTable
    );
    const worstCaptainPick = sortedWorstCaptaincy[0] ?? null;

    const captaincyEfficiency = optimalCaptaincyPoints > 0
        ? (totalCaptaincyPoints / optimalCaptaincyPoints) * 100
        : 100;
    const captaincyGrade = calculateGrade(captaincyEfficiency, {
        a: 85,
        b: 75,
        c: 65,
        d: 55,
    });

    // Bench stats
    const totalBenchPoints = benchAnalyses.reduce(
        (sum, b) => sum + b.benchPoints,
        0
    );
    const benchRegrets = benchAnalyses.filter((b) => b.hadBenchRegret).length;

    const sortedBench = [...benchAnalyses].sort(
        (a, b) => b.missedPoints - a.missedPoints
    );
    const worstBenchMiss = sortedBench[0]?.hadBenchRegret ? sortedBench[0] : null;

    const avgBenchPerWeek = benchAnalyses.length > 0
        ? totalBenchPoints / benchAnalyses.length
        : 0;
    const benchGrade = calculateGrade(100 - avgBenchPerWeek * 5, {
        a: 70,
        b: 50,
        c: 30,
        d: 10,
    });

    // Manager Persona
    const persona = calculateManagerPersona(
        data,
        transferEfficiency,
        captaincyEfficiency,
        avgBenchPerWeek,
        templateOverlap,
        captaincyAnalyses,  // NEW: Pass captaincy analyses for pattern detection
        patienceMetrics,
        bestTransfer || undefined,
        worstTransfer || undefined,
        bestCaptainPick || undefined,
        worstCaptainPick || undefined,
        worstBenchMiss || undefined,
        chipAnalyses.find(c => c.used && c.isExcellent) || undefined,
        chipAnalyses,      // NEW: Pass ALL chips for comprehensive personality analysis
        data.bootstrap     // NEW: Pass bootstrap data for chip popularity comparison
    );

    const topContributors = calculateTopContributors(data);
    const mvpPlayer = topContributors[0] || null;

    // Calculate position breakdown
    const positionPoints = new Map<string, { points: number; playerIds: Set<number> }>();
    let totalPoints = 0;

    topContributors.forEach(contributor => {
        const position = ELEMENT_TYPE_TO_POSITION[contributor.player.element_type];
        if (!position) return;

        const current = positionPoints.get(position) || { points: 0, playerIds: new Set() };
        current.points += contributor.points;
        current.playerIds.add(contributor.player.id);
        positionPoints.set(position, current);
        totalPoints += contributor.points;
    });

    const positionBreakdown = (['GKP', 'DEF', 'MID', 'FWD'] as Position[]).map(position => ({
        position,
        points: positionPoints.get(position)?.points || 0,
        percentage: totalPoints > 0 ? Math.round(((positionPoints.get(position)?.points || 0) / totalPoints) * 100) : 0,
        playerCount: positionPoints.get(position)?.playerIds.size || 0
    }));

    // Get current squad value from latest gameweek
    const currentSquadValue = history.current[history.current.length - 1]?.value ?? 1000;
    const hitsTaken = totalTransfersCost / 4;

    // Calculate squad value trend
    const valueProgression = history.current.map(gw => ({
        event: gw.event,
        value: gw.value
    }));
    const firstValue = valueProgression[0]?.value ?? 1000;
    const lastValue = currentSquadValue;
    const squadValueChange = lastValue - firstValue;
    const avgGrowthPerGW = valueProgression.length > 1 
        ? squadValueChange / valueProgression.length 
        : 0;
    
    let squadValueTrend: 'rising' | 'stable' | 'falling';
    if (avgGrowthPerGW >= 1.5) {
        squadValueTrend = 'rising';
    } else if (avgGrowthPerGW <= -0.5) {
        squadValueTrend = 'falling';
    } else {
        squadValueTrend = 'stable';
    }

    // Determine squad value archetype
    let squadValueArchetype: 'value-builder' | 'bank-hoarder' | 'fully-invested' | 'value-burner' | null = null;
    
    if (avgGrowthPerGW >= 2.0) {
        squadValueArchetype = 'value-builder'; // Consistent value growth
    } else if (avgGrowthPerGW <= -1.0) {
        squadValueArchetype = 'value-burner'; // Losing value through churn
    } else if (currentSquadValue > 1040) {
        // High squad value but not rapidly growing - likely holding bank
        squadValueArchetype = 'bank-hoarder';
    } else if (currentSquadValue >= 990 && currentSquadValue <= 1010 && totalTransfers > 25) {
        // Normal value range with high activity - fully invested strategy
        squadValueArchetype = 'fully-invested';
    }

    // Calculate overall decision grade based on component grades AND rank performance
    const gradeToScore = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const scoreToGrade = { 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' } as const;
    
    // Get current overall rank
    const currentOverallRank = history.current[history.current.length - 1]?.overall_rank ?? 0;
    
    // Calculate rank-based grade (outcome quality)
    // Assuming ~10M FPL players
    const totalPlayers = 10000000;
    const percentile = currentOverallRank > 0 ? ((totalPlayers - currentOverallRank) / totalPlayers) * 100 : 0;
    
    let rankGradeScore: number;
    if (percentile >= 95) rankGradeScore = 4; // A: Top 5% (~500K)
    else if (percentile >= 85) rankGradeScore = 3; // B: Top 15% (~1.5M)
    else if (percentile >= 60) rankGradeScore = 2; // C: Top 40% (~4M)
    else if (percentile >= 30) rankGradeScore = 1; // D: Top 70% (~7M)
    else rankGradeScore = 0; // F: Below 70%
    
    // Calculate decision-based grade average (process quality)
    const decisionAvgScore = (gradeToScore[transferGrade] + gradeToScore[captaincyGrade] + gradeToScore[benchGrade]) / 3;
    
    // Weighted blend: 65% rank outcome, 35% decision process
    // This recognizes that results matter more than process, but process still contributes
    const blendedScore = Math.round((rankGradeScore * 0.65) + (decisionAvgScore * 0.35));
    const overallDecisionGrade = scoreToGrade[blendedScore as keyof typeof scoreToGrade] || 'C';

    return {
        managerId: managerInfo.id,
        managerName: `${managerInfo.player_first_name} ${managerInfo.player_last_name}`,
        teamName: managerInfo.name,
        totalPoints: history.current[history.current.length - 1]?.total_points ?? 0,
        overallRank: history.current[history.current.length - 1]?.overall_rank ?? 0,
        currentSquadValue,
        squadValueTrend,
        squadValueChange,
        valueProgression,
        squadValueArchetype,
        hitsTaken,
        totalTransfers,
        totalTransfersCost,
        netTransferPoints,
        transferEfficiency, // Add transfer efficiency metric
        actualTransferGWs: effectiveTransferGWs,
        captaincyEfficiency, // Add captaincy efficiency metric
        avgPointsOnBench: avgBenchPerWeek, // Add avg bench points
        bestTransfer,
        worstTransfer,
        transferGrade,
        totalCaptaincyPoints,
        optimalCaptaincyPoints,
        captaincyPointsLost,
        captaincySuccessRate,
        bestCaptainPick,
        worstCaptainPick,
        captaincyGrade,
        totalBenchPoints,
        benchRegrets,
        worstBenchMiss,
        benchGrade,
        chipAnalyses,
        persona,
        mvpPlayer,
        topContributors: topContributors.slice(0, 5), // Keep top 5
        positionBreakdown,
        transferAnalyses,
        captaincyAnalyses,
        benchAnalyses,
        templateOverlap,
        patienceMetrics,
        overallDecisionGrade,
        bestGameweek: history.current.reduce((best, gw) => gw.points > best.points ? { event: gw.event, points: gw.points } : best, { event: 0, points: 0 }),
        worstGameweek: history.current.reduce((worst, gw) => gw.points < worst.points ? { event: gw.event, points: gw.points } : worst, { event: 0, points: 1000 }),
        rankProgression: history.current.map(gw => ({ event: gw.event, rank: gw.overall_rank })),
        chipsUsed: history.chips,
        allPlayers: data.bootstrap.elements.map(p => ({ id: p.id, web_name: p.web_name, team: p.team, element_type: p.element_type })),
        transferTiming
    };
}
