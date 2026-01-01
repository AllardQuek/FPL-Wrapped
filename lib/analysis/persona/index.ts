/**
 * Manager Persona Calculator
 * 
 * Main entry point for persona analysis. Orchestrates the various analysis
 * modules to determine a manager's FPL persona based on their playing style.
 */

import { BehavioralSignals } from './types';
import {
  ManagerPersona,
  TransferAnalysis,
  CaptaincyAnalysis,
  BenchAnalysis,
  ChipAnalysis,
  FPLBootstrap,
  SeasonSummary,
} from '../../types';
import { ManagerData, TransferTiming } from '../types';
import { analyzeTransferTiming } from '../transfers';
import { getPersonaImagePath } from '../../constants/persona-images';

// Local modules
import { PersonaMetrics, ChipPersonality } from './types';
import { NORMALIZATION, PERSONA_MAP, METRIC_TO_TRAIT } from './constants';
import { detectBehavioralSignals, analyzeCaptainPattern } from './signals';
import { analyzeChipPersonality } from './chips';
import {
  calculateBaseScores,
  applyBehavioralBoosts,
  applyCentroidScoring,
  applyRankBoosts,
  applyCaptainPatternBoosts,
  applyTransferTimingBoosts,
  applyExtremeMetricBoosts,
  applyChipPersonalityBoosts,
  calculateManagerVector,
  calculatePersonalityCode,
  filterEligiblePersonas,
  applyDealBreakers,
  selectBestPersona,
} from './scoring';

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Calculate the manager persona based on season stats
 */
export function calculateManagerPersona(
  data: ManagerData,
  transferEfficiency: number,
  captaincyEfficiency: number,
  avgBenchPerWeek: number,
  templateOverlap: number,
  captaincyAnalyses: Array<{ captainName?: string; wasSuccessful?: boolean }>,
  patienceMetrics?: SeasonSummary['patienceMetrics'],
  bestTransfer?: TransferAnalysis | null,
  worstTransfer?: TransferAnalysis | null,
  bestCaptain?: CaptaincyAnalysis | null,
  worstCaptain?: CaptaincyAnalysis | null,
  worstBench?: BenchAnalysis | null,
  bestChip?: ChipAnalysis,
  allChips?: ChipAnalysis[],
  bootstrapData?: FPLBootstrap
): ManagerPersona {
  const { history, transfers, bootstrap } = data;

  // Calculate base statistics
  const totalHits = history.current.reduce(
    (sum, gw) => sum + gw.event_transfers_cost / 4,
    0
  );
  const totalTransfers = transfers.length;
  const squadValue = history.current[history.current.length - 1]?.value ?? 1000;

  // Analyze patterns
  const transferTiming = analyzeTransferTiming(data);
  const chipPersonality = analyzeChipPersonality(
    allChips || [],
    bootstrapData || bootstrap
  );

  // Calculate normalized metrics
  const currentGW = history.current.length || 1;
  const metrics = calculateMetrics(
    totalTransfers,
    totalHits,
    avgBenchPerWeek,
    templateOverlap,
    transferEfficiency,
    captaincyEfficiency,
    squadValue,
    chipPersonality,
    currentGW,
    patienceMetrics,
    transferTiming
  );

  // Detect behavioral signals
  const behavioralSignals = detectBehavioralSignals(
    data,
    transfers,
    transferTiming,
    chipPersonality
  );

  // Analyze captain patterns
  const captainPattern = analyzeCaptainPattern(captaincyAnalyses);

  // Calculate and boost scores
  const scores = calculateBaseScores(metrics);
  
  applyBehavioralBoosts(scores, behavioralSignals, metrics);
  
  const currentRank = history.current[history.current.length - 1]?.overall_rank ?? 9999999;
  applyRankBoosts(scores, currentRank, behavioralSignals);
  applyCaptainPatternBoosts(scores, captainPattern, metrics);
  applyTransferTimingBoosts(scores, behavioralSignals);
  applyExtremeMetricBoosts(scores, metrics, behavioralSignals);
  applyChipPersonalityBoosts(scores, behavioralSignals, metrics);
  applyCentroidScoring(scores, metrics, behavioralSignals);

  // Filter and select persona
  const eligiblePersonas = filterEligiblePersonas(
    scores,
    metrics,
    behavioralSignals,
    currentRank
  );
  const filteredPersonas = applyDealBreakers(eligiblePersonas, metrics);
  const validPersonas = filteredPersonas.length > 0 
    ? filteredPersonas 
    : Object.entries(scores);

  const selectedPersonaKey = selectBestPersona(
    validPersonas,
    behavioralSignals,
    metrics,
    currentRank
  );

  // Build and return persona result
  return buildPersonaResult(
    selectedPersonaKey,
    metrics,
    behavioralSignals,
    bestTransfer,
    worstBench,
    bestCaptain,
    worstCaptain,
    bestChip
  );
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate normalized metrics (0-1 scale)
 */
function calculateMetrics(
  totalTransfers: number,
  totalHits: number,
  avgBenchPerWeek: number,
  templateOverlap: number,
  transferEfficiency: number,
  captaincyEfficiency: number,
  squadValue: number,
  chipPersonality: ChipPersonality,
  currentGW: number,
  patienceMetrics?: SeasonSummary['patienceMetrics'],
  transferTiming?: TransferTiming
): PersonaMetrics {
  const N = NORMALIZATION;

  // Dynamic normalization based on weeks passed
  const dynamicTransfersMax = Math.max(5, N.TRANSFERS_PER_GW_MAX * currentGW);
  const dynamicHitsMax = Math.max(2, N.HITS_PER_GW_MAX * currentGW);

  // Calculate patience score (0-1)
  // A score of 1 means high patience (many long-term holds)
  let patienceScore = 0.5; // Default
  if (patienceMetrics) {
    // Normalize longTermHoldsCount (e.g., 5+ is very patient)
    const holdsScore = Math.min(1, patienceMetrics.longTermHoldsCount / 5);
    // Normalize avgHoldLength (e.g., 8+ weeks is very patient)
    const lengthScore = Math.min(1, patienceMetrics.avgHoldLength / 8);
    patienceScore = (holdsScore + lengthScore) / 2;
  }

  // Calculate timing score (0-1)
  // 1 = Early/Planned, 0 = Late/Panic
  let timingScore = 0.5; // Default
  let timingRisk = 0.5; // Default
  if (transferTiming) {
    const total = (transferTiming.panicTransfers || 0) + 
                  (transferTiming.deadlineDayTransfers || 0) + 
                  (transferTiming.midWeekTransfers || 0) + 
                  (transferTiming.earlyStrategicTransfers || 0);
    
    if (total > 0) {
      const planned = (transferTiming.midWeekTransfers || 0) + (transferTiming.earlyStrategicTransfers || 0);
      
      // Base score from planned vs reactive
      const baseTiming = planned / total;
      
      // Penalize knee-jerks and late-night reactors
      const kneeJerkPenalty = Math.min(0.3, ((transferTiming.kneeJerkTransfers || 0) / total) * 0.5);
      const lateNightPenalty = Math.min(0.2, ((transferTiming.lateNightTransfers || 0) / total) * 0.4);
      
      timingScore = Math.max(0, Math.min(1, baseTiming - kneeJerkPenalty - lateNightPenalty));

      // Calculate timing risk (Aggressive vs Cautious)
      // 1 = Aggressive (Early), 0 = Cautious (Late)
      const earlyRisk = ((transferTiming.kneeJerkTransfers || 0) * 1.0 + 
                        (transferTiming.earlyStrategicTransfers || 0) * 0.7 +
                        (transferTiming.midWeekTransfers || 0) * 0.3) / total;
      timingRisk = Math.min(1, earlyRisk);
    }
  }

  return {
    activity: Math.min(1, totalTransfers / dynamicTransfersMax),
    chaos: Math.min(1, totalHits / dynamicHitsMax),
    overthink: Math.min(1, avgBenchPerWeek / N.BENCH_POINTS_MAX),
    template: templateOverlap / 100,
    efficiency: Math.max(0, Math.min(1, transferEfficiency / N.EFFICIENCY_MAX)),
    leadership: captaincyEfficiency / 100,
    thrift: Math.max(0, Math.min(1, (N.VALUE_BASELINE - squadValue) / N.VALUE_RANGE)),
    patience: patienceScore,
    timing: timingScore,
    timingRisk: timingRisk,
    chipMastery: chipPersonality.effectivenessScore,
    chipRisk: chipPersonality.riskScore,
  };
}

/**
 * Build the final persona result object
 */
function buildPersonaResult(
  selectedKey: string,
  metrics: PersonaMetrics,
  signals: BehavioralSignals,
  bestTransfer?: TransferAnalysis | null,
  worstBench?: BenchAnalysis | null,
  bestCaptain?: CaptaincyAnalysis | null,
  worstCaptain?: CaptaincyAnalysis | null,
  bestChip?: ChipAnalysis
): ManagerPersona {
  const personaData = PERSONA_MAP[selectedKey];

  // Calculate trait scores
  const traitScores = calculateTraitScores(personaData, metrics);
  const topTraits = selectTopTraits(traitScores, metrics);

  // Generate memorable moments
  const memorableMoments = generateMemorableMoments(
    bestTransfer,
    worstBench,
    bestCaptain,
    worstCaptain,
    bestChip
  );

  // Calculate manager's actual spectrum scores
  const managerVector = calculateManagerVector(metrics, signals);

  // Calculate 4-letter personality code based on manager's actual scores
  const managerCode = calculatePersonalityCode(managerVector);

  return {
    key: selectedKey,
    name: personaData.name,
    title: personaData.title,
    description: personaData.desc,
    quote: personaData.quote,
    quoteSource: personaData.quoteSource,
    spectrum: topTraits.slice(0, 4),
    primaryColor: personaData.color,
    traits: personaData.traits,
    emoji: personaData.emoji,
    imageUrl: getPersonaImagePath(selectedKey),
    memorableMoments: memorableMoments.slice(0, 3),
    spectrums: managerVector,
    personalityCode: managerCode, // The manager's actual code
    canonicalCode: personaData.personalityCode, // The persona's official code
  };
}

/**
 * Calculate trait scores based on persona weights and metrics
 */
function calculateTraitScores(
  personaData: typeof PERSONA_MAP[string],
  metrics: PersonaMetrics
): Array<{ trait: string; score: number; maxScore: number }> {
  const traitScores: Array<{ trait: string; score: number; maxScore: number }> = [];

  Object.entries(personaData.weights).forEach(([metric, weight]) => {
    if (metric === 'activity') return;

    const metricValue = metrics[metric as keyof PersonaMetrics];
    const contribution = metricValue * (weight as number);

    if (Math.abs(weight as number) > 0.3 && contribution > 0.1) {
      traitScores.push({
        trait: METRIC_TO_TRAIT[metric] || metric,
        score: Math.round(metricValue * 100),
        maxScore: 100,
      });
    }
  });

  return traitScores;
}

/**
 * Select top traits, with fallbacks if needed
 */
function selectTopTraits(
  traitScores: Array<{ trait: string; score: number; maxScore: number }>,
  metrics: PersonaMetrics
): Array<{ trait: string; score: number; maxScore: number }> {
  const topTraits = traitScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Add fallback traits if needed
  if (topTraits.length < 3) {
    const fallbackTraits = [
      { trait: 'Template Loyalty', score: Math.round(metrics.template * 100), maxScore: 100 },
      { trait: 'Captain Accuracy', score: Math.round(metrics.leadership * 100), maxScore: 100 },
      { trait: 'Transfer Efficiency', score: Math.round(metrics.efficiency * 100), maxScore: 100 },
    ];

    fallbackTraits.forEach((ft) => {
      if (!topTraits.find((t) => t.trait === ft.trait)) {
        topTraits.push(ft);
      }
    });
  }

  return topTraits;
}

/**
 * Generate memorable moments based on highlights
 */
function generateMemorableMoments(
  bestTransfer?: TransferAnalysis | null,
  worstBench?: BenchAnalysis | null,
  bestCaptain?: CaptaincyAnalysis | null,
  worstCaptain?: CaptaincyAnalysis | null,
  bestChip?: ChipAnalysis
): string[] {
  const moments: string[] = [];

  if (bestTransfer && bestTransfer.pointsGained > 10) {
    moments.push(
      `GW${bestTransfer.ownedGWRange.start}: Signed ${bestTransfer.playerIn.web_name} and gained ${bestTransfer.pointsGained} points`
    );
  }

  if (worstBench && worstBench.missedPoints > 15) {
    moments.push(
      `GW${worstBench.gameweek}: Benched ${worstBench.bestBenchPick?.player.web_name} who scored ${worstBench.bestBenchPick?.points} points`
    );
  }

  if (bestCaptain && bestCaptain.captainPoints > 20) {
    moments.push(
      `GW${bestCaptain.gameweek}: Captained ${bestCaptain.captainName} and he hauled ${bestCaptain.captainPoints} points`
    );
  }

  if (worstCaptain && worstCaptain.pointsLeftOnTable > 15) {
    moments.push(
      `GW${worstCaptain.gameweek}: Captained ${worstCaptain.captainName} (${worstCaptain.captainPoints}pts) but ${worstCaptain.bestPickName} had ${worstCaptain.bestPickPoints} points`
    );
  }

  if (bestChip && bestChip.used && bestChip.pointsGained > 15) {
    const chipNames: Record<string, string> = {
      bboost: 'Bench Boost',
      '3xc': 'Triple Captain',
      freehit: 'Free Hit',
      wildcard: 'Wildcard',
    };
    moments.push(
      `GW${bestChip.event}: Played ${chipNames[bestChip.name]} and gained ${bestChip.pointsGained} points`
    );
  }

  return moments;
}
