/**
 * Behavioral signal detection for persona analysis
 * Detects specific behavioral patterns that strongly indicate certain personas
 */

import { Transfer } from '../../types';
import { ManagerData } from '../types';
import {
  BehavioralSignals,
  CaptainPattern,
  ChipPersonality,
  TransferTimingAnalysis,
} from './types';
import { SIGNAL_THRESHOLDS, PREMIUM_CAPTAINS } from './constants';

/**
 * Detect behavioral signals from manager data
 * These patterns are strong indicators for specific personas
 */
export function detectBehavioralSignals(
  data: ManagerData,
  transfers: Transfer[],
  transferTiming: TransferTimingAnalysis,
  chipPersonality?: ChipPersonality
): BehavioralSignals {
  const { history } = data;
  const lastGW = history.current[history.current.length - 1]?.event || 18;
  const finishedGWs = history.current.filter((gw) => gw.event <= lastGW);

  const signals: BehavioralSignals = createDefaultSignals();

  // Calculate chip gameweeks for filtering
  const chipGWs = new Set(history.chips.map((c) => c.event));

  // Detect each category of signals
  detectActivityPatterns(signals, finishedGWs, chipGWs);
  detectBenchPatterns(signals, finishedGWs);
  detectHoldingPatterns(signals, transfers, lastGW);
  detectChipTimingPatterns(signals, history.chips);
  detectPerformancePatterns(signals, finishedGWs);
  detectTransferTimingPatterns(signals, transferTiming);
  detectChipPersonalityPatterns(signals, chipPersonality);

  return signals;
}

/**
 * Create default signals object with all false values
 */
function createDefaultSignals(): BehavioralSignals {
  return {
    // Activity patterns
    constantTinkerer: false,
    hitAddict: false,
    disciplined: false,

    // Bench management
    rotationPain: false,
    benchMaster: false,

    // Template & conviction
    ultraContrarian: false,
    longTermBacker: false,

    // Chip timing
    earlyAggression: false,
    chipHoarder: false,

    // Performance patterns
    boomBust: false,
    consistent: false,

    // Transfer timing patterns
    panicBuyer: false,
    deadlineDayScrambler: false,
    earlyPlanner: false,
    kneeJerker: false,
    lateNightReactor: false,

    // Chip personality patterns
    chipMaster: false,
    chipGambler: false,
    strategicChipper: false,
    contrarian: false,
    templateChipper: false,
  };
}

interface GWHistory {
  event: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
  value: number;
  points: number;
}

/**
 * Detect activity-related patterns (tinkering, hits, discipline)
 */
function detectActivityPatterns(
  signals: BehavioralSignals,
  finishedGWs: GWHistory[],
  chipGWs: Set<number>
): void {
  const T = SIGNAL_THRESHOLDS;

  // 1. CONSTANT TINKERER: Count non-chip GWs with multiple transfers
  const nonChipMultiTransferGWs = finishedGWs.filter(
    (gw) => !chipGWs.has(gw.event) && gw.event_transfers >= 2
  ).length;
  signals.constantTinkerer = nonChipMultiTransferGWs >= T.CONSTANT_TINKERER_GWS;

  // 2. HIT ADDICT: Multiple consecutive hit weeks
  let consecutiveHits = 0;
  let maxConsecutiveHits = 0;
  finishedGWs.forEach((gw) => {
    if (gw.event_transfers_cost > 0) {
      consecutiveHits++;
      maxConsecutiveHits = Math.max(maxConsecutiveHits, consecutiveHits);
    } else {
      consecutiveHits = 0;
    }
  });
  signals.hitAddict = maxConsecutiveHits >= T.CONSECUTIVE_HITS_MIN;

  // 3. DISCIPLINED: Low hits despite activity
  const totalHits = finishedGWs.reduce(
    (sum, gw) => sum + gw.event_transfers_cost / 4,
    0
  );
  const nonChipTransfers = finishedGWs
    .filter((gw) => !chipGWs.has(gw.event))
    .reduce((sum, gw) => sum + gw.event_transfers, 0);
  signals.disciplined =
    totalHits <= T.DISCIPLINED_MAX_HITS &&
    nonChipTransfers >= T.DISCIPLINED_MIN_TRANSFERS;
}

/**
 * Detect bench management patterns
 */
function detectBenchPatterns(
  signals: BehavioralSignals,
  finishedGWs: GWHistory[]
): void {
  const T = SIGNAL_THRESHOLDS;

  const avgBenchPoints =
    finishedGWs.reduce((sum, gw) => sum + gw.points_on_bench, 0) /
    finishedGWs.length;
  const avgSquadValue =
    finishedGWs.reduce((sum, gw) => sum + gw.value, 0) / finishedGWs.length;
  const highBenchGWs = finishedGWs.filter((gw) => gw.points_on_bench >= 10).length;

  // ROTATION PAIN: High bench + high squad value
  signals.rotationPain =
    avgSquadValue >= T.ROTATION_PAIN_MIN_VALUE &&
    avgBenchPoints >= T.ROTATION_PAIN_MIN_BENCH &&
    highBenchGWs >= T.ROTATION_PAIN_MIN_HIGH_GWS;

  // BENCH MASTER: Consistently low bench points
  signals.benchMaster =
    avgBenchPoints < T.BENCH_MASTER_MAX_BENCH &&
    highBenchGWs <= T.BENCH_MASTER_MAX_HIGH_GWS;
}

/**
 * Detect long-term holding patterns
 */
function detectHoldingPatterns(
  signals: BehavioralSignals,
  transfers: Transfer[],
  currentGW: number
): void {
  const T = SIGNAL_THRESHOLDS;

  // Build ownership timeline
  const playerFirstOwned = new Map<number, number>();
  const playerLastOwned = new Map<number, number>();

  const sortedTransfers = [...transfers].sort((a, b) => a.event - b.event);

  sortedTransfers.forEach((t) => {
    if (!playerFirstOwned.has(t.element_in)) {
      playerFirstOwned.set(t.element_in, t.event);
    }
    playerLastOwned.set(t.element_out, t.event);
  });

  // Count long holds
  let longHoldCount = 0;
  playerFirstOwned.forEach((boughtGW, playerId) => {
    const soldGW = playerLastOwned.get(playerId) || currentGW + 1;
    const holdLength = soldGW - boughtGW;
    if (holdLength >= T.LONG_TERM_HOLD_GWS) {
      longHoldCount++;
    }
  });

  signals.longTermBacker = longHoldCount >= T.LONG_TERM_HOLD_PLAYERS;
}

interface ChipHistory {
  event: number;
  name: string;
}

/**
 * Detect chip timing patterns
 */
function detectChipTimingPatterns(
  signals: BehavioralSignals,
  chips: ChipHistory[]
): void {
  const T = SIGNAL_THRESHOLDS;

  // Early wildcard
  const wildcardChip = chips.find((c) => c.name === 'wildcard');
  signals.earlyAggression = wildcardChip
    ? wildcardChip.event < T.EARLY_WILDCARD_GW
    : false;

  // Chip hoarder: all chips used late
  const allChipsUsed = chips.length;
  const lateChipsCount = chips.filter((c) => c.event > T.LATE_CHIPS_GW).length;
  signals.chipHoarder = allChipsUsed >= 2 && lateChipsCount === allChipsUsed;
}

/**
 * Detect performance volatility patterns
 */
function detectPerformancePatterns(
  signals: BehavioralSignals,
  finishedGWs: GWHistory[]
): void {
  const T = SIGNAL_THRESHOLDS;

  if (finishedGWs.length < 10) return;

  const points = finishedGWs.map((gw) => gw.points);
  const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
  const variance =
    points.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) /
    points.length;
  const stdDev = Math.sqrt(variance);

  const highScoreGWs = finishedGWs.filter(
    (gw) => gw.points >= T.HIGH_SCORE_THRESHOLD
  ).length;
  const lowScoreGWs = finishedGWs.filter(
    (gw) => gw.points < T.LOW_SCORE_THRESHOLD
  ).length;

  signals.boomBust =
    stdDev > T.BOOM_BUST_STD_DEV &&
    highScoreGWs >= T.BOOM_BUST_MIN_GWS &&
    lowScoreGWs >= T.BOOM_BUST_MIN_GWS;

  signals.consistent =
    stdDev < T.CONSISTENT_STD_DEV &&
    highScoreGWs <= T.CONSISTENT_MAX_GWS &&
    lowScoreGWs <= T.CONSISTENT_MAX_GWS;
}

/**
 * Detect transfer timing patterns (panic, deadline, early planner, etc.)
 */
function detectTransferTimingPatterns(
  signals: BehavioralSignals,
  timing: TransferTimingAnalysis
): void {
  const T = SIGNAL_THRESHOLDS;

  const totalMeaningfulTransfers =
    timing.panicTransfers +
    timing.deadlineDayTransfers +
    timing.midWeekTransfers +
    timing.earlyStrategicTransfers;

  if (totalMeaningfulTransfers < T.MIN_TRANSFERS_FOR_TIMING) return;

  // Panic buyer: 20%+ within 3 hours of deadline
  signals.panicBuyer =
    timing.panicTransfers >= T.PANIC_BUYER_MIN &&
    timing.panicTransfers / totalMeaningfulTransfers >= T.PANIC_BUYER_PCT;

  // Deadline scrambler: 40%+ on deadline day
  signals.deadlineDayScrambler =
    timing.deadlineDayTransfers >= T.DEADLINE_SCRAMBLER_MIN &&
    timing.deadlineDayTransfers / totalMeaningfulTransfers >= T.DEADLINE_SCRAMBLER_PCT;

  // Early planner: 35%+ of transfers >96h before deadline
  signals.earlyPlanner =
    timing.earlyStrategicTransfers >= T.EARLY_PLANNER_MIN &&
    timing.earlyStrategicTransfers / totalMeaningfulTransfers >= T.EARLY_PLANNER_PCT;

  // Knee-jerker: 25%+ within 48h of previous GW starting
  signals.kneeJerker =
    timing.kneeJerkTransfers >= T.KNEE_JERKER_MIN &&
    timing.kneeJerkTransfers / totalMeaningfulTransfers >= T.KNEE_JERKER_PCT;

  // Late night: 30%+ between 11pm-5am
  signals.lateNightReactor =
    timing.lateNightTransfers >= T.LATE_NIGHT_MIN &&
    timing.lateNightTransfers / totalMeaningfulTransfers >= T.LATE_NIGHT_PCT;
}

/**
 * Detect chip personality patterns
 */
function detectChipPersonalityPatterns(
  signals: BehavioralSignals,
  chipPersonality?: ChipPersonality
): void {
  if (!chipPersonality) return;

  const T = SIGNAL_THRESHOLDS;

  signals.chipMaster = chipPersonality.effectivenessScore > T.CHIP_MASTER_THRESHOLD;
  signals.chipGambler = chipPersonality.riskScore > T.CHIP_GAMBLER_THRESHOLD;
  signals.strategicChipper = chipPersonality.isStrategic;
  signals.contrarian = chipPersonality.popularityScore < T.CHIP_CONTRARIAN_THRESHOLD;
  signals.templateChipper = chipPersonality.popularityScore > T.CHIP_TEMPLATE_THRESHOLD;
}

/**
 * Analyze captain choice patterns to detect personality traits
 */
export function analyzeCaptainPattern(
  captaincyAnalyses: Array<{ captainName?: string; wasSuccessful?: boolean }>
): CaptainPattern {
  const pattern: CaptainPattern = {
    loyalty: false,
    chaser: false,
    differential: false,
    safePicker: false,
  };

  if (captaincyAnalyses.length < 8) return pattern;

  const first12GWs = captaincyAnalyses.slice(0, 12);

  // Count captain frequency
  const captainCounts = new Map<string, number>();
  first12GWs.forEach((gw) => {
    const name = gw.captainName || '';
    captainCounts.set(name, (captainCounts.get(name) || 0) + 1);
  });

  const mostCaptained = Math.max(...captainCounts.values());
  const uniqueCaptains = captainCounts.size;
  const nonPremiumCaptains = first12GWs.filter(
    (gw) => !PREMIUM_CAPTAINS.includes(gw.captainName as typeof PREMIUM_CAPTAINS[number])
  ).length;

  pattern.loyalty = mostCaptained >= 8;
  pattern.chaser = uniqueCaptains >= 5;
  pattern.differential = nonPremiumCaptains >= 3;
  pattern.safePicker = nonPremiumCaptains === 0 && uniqueCaptains <= 2;

  return pattern;
}
