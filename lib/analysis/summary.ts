import { Player, SeasonSummary } from '../types';
import { ManagerData } from './types';
import { analyzeTransfers } from './transfers';
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
 * Generate complete season summary with all analysis
 */
export function generateSeasonSummary(data: ManagerData): SeasonSummary {
    const { managerInfo, history, transfers } = data;

    // Run all analyses
    const transferAnalyses = analyzeTransfers(data);
    const captaincyAnalyses = analyzeCaptaincy(data);
    const benchAnalyses = analyzeBench(data);
    const chipAnalyses = analyzeChips(data);
    const templateOverlap = calculateTemplateOverlap(data);

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
    const transferGrade = calculateGrade(transferEfficiency, {
        a: 30,
        b: 10,
        c: -10,
        d: -30,
    });

    // Captaincy stats
    const totalCaptaincyPoints = captaincyAnalyses.reduce(
        (sum, c) => sum + c.captainPoints,
        0
    );
    const optimalCaptaincyPoints = captaincyAnalyses.reduce(
        (sum, c) => sum + c.bestPickPoints,
        0
    );
    const captaincyPointsLost = optimalCaptaincyPoints - totalCaptaincyPoints;
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

    return {
        managerId: managerInfo.id,
        managerName: `${managerInfo.player_first_name} ${managerInfo.player_last_name}`,
        teamName: managerInfo.name,
        totalPoints: history.current[history.current.length - 1]?.total_points ?? 0,
        overallRank: history.current[history.current.length - 1]?.overall_rank ?? 0,
        totalTransfers,
        totalTransfersCost,
        netTransferPoints,
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
        overallDecisionGrade: 'A',
        bestGameweek: history.current.reduce((best, gw) => gw.points > best.points ? { event: gw.event, points: gw.points } : best, { event: 0, points: 0 }),
        worstGameweek: history.current.reduce((worst, gw) => gw.points < worst.points ? { event: gw.event, points: gw.points } : worst, { event: 0, points: 1000 }),
        rankProgression: history.current.map(gw => ({ event: gw.event, rank: gw.overall_rank })),
        chipsUsed: history.chips,
        allPlayers: data.bootstrap.elements.map(p => ({ id: p.id, web_name: p.web_name, team: p.team }))
    };
}
