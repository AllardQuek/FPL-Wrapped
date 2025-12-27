import {
  FPLBootstrap,
  ManagerInfo,
  ManagerHistory,
  Transfer,
  GameWeekPicks,
  LiveGameWeek,
  Player,
  TransferAnalysis,
  CaptaincyAnalysis,
  BenchAnalysis,
  SeasonSummary,
  ChipUsage,
} from './types';

interface ManagerData {
  bootstrap: FPLBootstrap;
  managerInfo: ManagerInfo;
  history: ManagerHistory;
  transfers: Transfer[];
  picksByGameweek: Map<number, GameWeekPicks>;
  liveByGameweek: Map<number, LiveGameWeek>;
  finishedGameweeks: number[];
}

/**
 * Get player points for a specific gameweek from live data
 */
function getPlayerPointsInGameweek(
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
function getPlayer(playerId: number, bootstrap: FPLBootstrap): Player | undefined {
  return bootstrap.elements.find((p) => p.id === playerId);
}

/**
 * Analyze all transfers made by a manager
 */
export function analyzeTransfers(data: ManagerData): TransferAnalysis[] {
  const { bootstrap, transfers, liveByGameweek, finishedGameweeks, picksByGameweek } = data;
  const analyses: TransferAnalysis[] = [];

  for (const transfer of transfers) {
    const playerIn = getPlayer(transfer.element_in, bootstrap);
    const playerOut = getPlayer(transfer.element_out, bootstrap);

    if (!playerIn || !playerOut) continue;

    // Calculate points from transfer gameweek onwards while player was owned
    let pointsIn = 0;
    let pointsOut = 0;
    let gameweeksHeld = 0;

    // Find gameweeks where the player was in the team
    for (const gw of finishedGameweeks) {
      if (gw < transfer.event) continue;

      const picks = picksByGameweek.get(gw);
      if (!picks) continue;

      // Check if player is still in the team
      const playerStillOwned = picks.picks.some(
        (p) => p.element === transfer.element_in
      );
      
      if (!playerStillOwned) break;

      gameweeksHeld++;
      pointsIn += getPlayerPointsInGameweek(transfer.element_in, gw, liveByGameweek);
      pointsOut += getPlayerPointsInGameweek(transfer.element_out, gw, liveByGameweek);
    }

    const pointsGained = pointsIn - pointsOut;

    // Determine verdict based on points gained
    let verdict: TransferAnalysis['verdict'];
    if (pointsGained >= 20) verdict = 'excellent';
    else if (pointsGained >= 5) verdict = 'good';
    else if (pointsGained >= -5) verdict = 'neutral';
    else if (pointsGained >= -15) verdict = 'poor';
    else verdict = 'terrible';

    analyses.push({
      transfer,
      playerIn,
      playerOut,
      pointsGained,
      gameweeksHeld,
      verdict,
    });
  }

  return analyses;
}

/**
 * Analyze captaincy decisions for each gameweek
 */
export function analyzeCaptaincy(data: ManagerData): CaptaincyAnalysis[] {
  const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
  const analyses: CaptaincyAnalysis[] = [];

  for (const gw of finishedGameweeks) {
    const picks = picksByGameweek.get(gw);
    if (!picks) continue;

    // Find captain
    const captainPick = picks.picks.find((p) => p.is_captain);
    if (!captainPick) continue;

    const captain = getPlayer(captainPick.element, bootstrap);
    if (!captain) continue;

    // Get captain points (with multiplier)
    const rawCaptainPoints = getPlayerPointsInGameweek(captainPick.element, gw, liveByGameweek);
    const captainPoints = rawCaptainPoints * captainPick.multiplier;

    // Find best pick from starting XI (positions 1-11)
    const startingPicks = picks.picks.filter((p) => p.position <= 11);
    let bestPickId = captainPick.element;
    let bestPickPoints = rawCaptainPoints;

    for (const pick of startingPicks) {
      const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
      if (points > bestPickPoints) {
        bestPickPoints = points;
        bestPickId = pick.element;
      }
    }

    const bestPlayer = getPlayer(bestPickId, bootstrap);
    const optimalCaptainPoints = bestPickPoints * captainPick.multiplier;
    const pointsLeftOnTable = optimalCaptainPoints - captainPoints;

    analyses.push({
      gameweek: gw,
      captainId: captainPick.element,
      captainName: captain.web_name,
      captainPoints,
      bestPickId,
      bestPickName: bestPlayer?.web_name ?? 'Unknown',
      bestPickPoints: optimalCaptainPoints,
      pointsLeftOnTable,
      wasOptimal: bestPickId === captainPick.element,
      wasSuccessful: rawCaptainPoints >= 6, // 6+ points before multiplier is good
    });
  }

  return analyses;
}

/**
 * Analyze bench decisions for each gameweek
 */
export function analyzeBench(data: ManagerData): BenchAnalysis[] {
  const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
  const analyses: BenchAnalysis[] = [];

  for (const gw of finishedGameweeks) {
    const picks = picksByGameweek.get(gw);
    if (!picks) continue;

    // Separate starters and bench
    const starters = picks.picks.filter((p) => p.position <= 11);
    const bench = picks.picks.filter((p) => p.position > 11);

    // Calculate bench points
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

    // Find lowest scoring starter (excluding goalkeeper usually, but we'll include all)
    let lowestStarterPoints = Infinity;
    for (const pick of starters) {
      const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
      if (points < lowestStarterPoints) {
        lowestStarterPoints = points;
      }
    }

    // Find best bench player
    const bestBenchPlayer = benchPlayers.reduce(
      (best, current) => (current.points > best.points ? current : best),
      benchPlayers[0] || { player: null, points: 0 }
    );

    const missedPoints = Math.max(0, bestBenchPlayer.points - lowestStarterPoints);
    const hadBenchRegret = missedPoints > 0;

    analyses.push({
      gameweek: gw,
      benchPoints: totalBenchPoints,
      benchPlayers,
      lowestStarterPoints: lowestStarterPoints === Infinity ? 0 : lowestStarterPoints,
      missedPoints,
      hadBenchRegret,
    });
  }

  return analyses;
}

/**
 * Calculate a grade based on a score relative to expected
 */
function calculateGrade(
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
 * Find the MVP (player who contributed most points)
 */
function findMVP(data: ManagerData): { player: Player; points: number } | null {
  const { bootstrap, picksByGameweek, liveByGameweek, finishedGameweeks } = data;
  const playerPoints = new Map<number, number>();

  for (const gw of finishedGameweeks) {
    const picks = picksByGameweek.get(gw);
    if (!picks) continue;

    // Only count starting XI
    const starters = picks.picks.filter((p) => p.position <= 11);
    
    for (const pick of starters) {
      const points = getPlayerPointsInGameweek(pick.element, gw, liveByGameweek);
      const multipliedPoints = points * pick.multiplier;
      
      const current = playerPoints.get(pick.element) ?? 0;
      playerPoints.set(pick.element, current + multipliedPoints);
    }
  }

  let mvpId = 0;
  let mvpPoints = 0;

  for (const [playerId, points] of playerPoints) {
    if (points > mvpPoints) {
      mvpId = playerId;
      mvpPoints = points;
    }
  }

  const mvpPlayer = getPlayer(mvpId, bootstrap);
  if (!mvpPlayer) return null;

  return { player: mvpPlayer, points: mvpPoints };
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

  // Transfer stats
  const totalTransfers = transfers.length;
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

  // Transfer grade based on net points minus cost
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

  // Captaincy grade based on % of optimal points captured
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

  // Bench grade - lower bench points is better (means you picked the right starters)
  // Average around 8-15 points per week on bench is normal
  const avgBenchPerWeek = benchAnalyses.length > 0
    ? totalBenchPoints / benchAnalyses.length
    : 0;
  const benchGrade = calculateGrade(100 - avgBenchPerWeek * 5, {
    a: 70,
    b: 50,
    c: 30,
    d: 10,
  });

  // Overall grade (weighted average)
  const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const overallScore =
    (gradeValues[transferGrade] * 0.35 +
      gradeValues[captaincyGrade] * 0.4 +
      gradeValues[benchGrade] * 0.25);
  
  let overallDecisionGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 3.5) overallDecisionGrade = 'A';
  else if (overallScore >= 2.5) overallDecisionGrade = 'B';
  else if (overallScore >= 1.5) overallDecisionGrade = 'C';
  else if (overallScore >= 0.5) overallDecisionGrade = 'D';
  else overallDecisionGrade = 'F';

  // Best/worst gameweeks
  const gwHistory = [...history.current].sort((a, b) => b.points - a.points);
  const bestGameweek = gwHistory[0]
    ? { event: gwHistory[0].event, points: gwHistory[0].points }
    : { event: 1, points: 0 };
  const worstGameweek = gwHistory[gwHistory.length - 1]
    ? { event: gwHistory[gwHistory.length - 1].event, points: gwHistory[gwHistory.length - 1].points }
    : { event: 1, points: 0 };

  // Rank progression
  const rankProgression = history.current.map((gw) => ({
    event: gw.event,
    rank: gw.overall_rank,
  }));

  // MVP
  const mvpPlayer = findMVP(data);

  return {
    managerId: managerInfo.id,
    managerName: `${managerInfo.player_first_name} ${managerInfo.player_last_name}`,
    teamName: managerInfo.name,
    totalPoints: managerInfo.summary_overall_points,
    overallRank: managerInfo.summary_overall_rank,

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

    overallDecisionGrade,

    bestGameweek,
    worstGameweek,
    rankProgression,
    chipsUsed: history.chips,
    mvpPlayer,
  };
}



