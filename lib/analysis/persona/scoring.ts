/**
 * Persona scoring and selection logic
 * Handles base scoring, signal boosts, eligibility filters, and final selection
 */

import {
  PersonaMetrics,
  BehavioralSignals,
  CaptainPattern,
} from './types';
import { PERSONA_MAP, RANK_THRESHOLDS } from './constants';

// ============================================================================
// BASE SCORING
// ============================================================================

/**
 * Calculate base scores for all personas using their weights
 */
export function calculateBaseScores(metrics: PersonaMetrics): Record<string, number> {
  const scores: Record<string, number> = {};

  Object.entries(PERSONA_MAP).forEach(([key, persona]) => {
    let score = 0;
    Object.entries(persona.weights).forEach(([metric, weight]) => {
      const metricValue = metrics[metric as keyof PersonaMetrics];
      score += metricValue * (weight as number) * 100;
    });
    scores[key] = score;
  });

  return scores;
}

// ============================================================================
// SIGNAL BOOSTS
// ============================================================================

/**
 * Apply behavioral signal boosts to scores
 * Strong patterns trump pure metrics for variability
 */
export function applyBehavioralBoosts(
  scores: Record<string, number>,
  signals: BehavioralSignals,
  metrics: PersonaMetrics
): void {
  // Long-term conviction signals
  if (signals.longTermBacker && metrics.efficiency > 0.6) {
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.0;
  }
  if (metrics.efficiency > 0.55 && metrics.activity < 0.35 && metrics.chaos < 0.15) {
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.2;
  }

  // Activity & chaos signals
  if (signals.hitAddict && signals.constantTinkerer) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 2.2;
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;
  } else if (signals.constantTinkerer && !signals.hitAddict) {
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 2.0;
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.6;
  }

  // Maresca tactical flexibility
  if (metrics.activity > 0.4 && metrics.activity < 0.65 && 
      metrics.overthink > 0.35 && metrics.overthink < 0.65) {
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 2.3;
  }
  if (metrics.overthink > 0.3 && metrics.overthink < 0.6 && metrics.efficiency > 0.5) {
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.9;
  }

  // Discipline & efficiency signals
  if (signals.disciplined && metrics.efficiency > 0.65) {
    scores['EMERY'] = (scores['EMERY'] || 0) * 1.8;
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.7;
  }
  if (signals.disciplined && metrics.thrift > 0.4 && metrics.chaos < 0.10) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 2.5;
  }
  if (metrics.thrift > 0.35 && metrics.thrift < 0.65 && metrics.chaos < 0.15) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 1.7;
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.6;
  }

  // Chip timing signals
  if (signals.earlyAggression) {
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.6;
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.4;
  }
  if (!signals.earlyAggression && !signals.chipHoarder) {
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.5;
    scores['PEP'] = (scores['PEP'] || 0) * 1.6;
  }
  if (signals.chipHoarder && metrics.efficiency > 0.6) {
    scores['EMERY'] = (scores['EMERY'] || 0) * 1.5;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.5;
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 1.7;
  }

  // Rotation pain is exclusive Pep signal
  if (signals.rotationPain) {
    scores['PEP'] = (scores['PEP'] || 0) * 3.0;
  }

  // Knee-jerk reactive behavior
  if (signals.kneeJerker && metrics.activity > 0.6) {
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.5;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 2.2;
  }

  // Long-term backing with high efficiency
  if (signals.longTermBacker && metrics.efficiency > 0.75) {
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.6;
  }

  // Ultra-contrarian with success
  if (signals.ultraContrarian && metrics.leadership > 0.50) {
    scores['WENGER'] = (scores['WENGER'] || 0) * 2.7;
  }

  // Budget mastery
  if (metrics.thrift > 0.5 && metrics.efficiency > 0.5 && metrics.chaos < 0.2) {
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 2.4;
  }

  // Defensive grinder
  if (metrics.thrift > 0.6 && metrics.chaos < 0.08 && metrics.template > 0.5) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 2.7;
  }

  // Bench & rotation signals
  if (signals.benchMaster && metrics.activity > 0.5) {
    scores['SLOT'] = (scores['SLOT'] || 0) * 1.8;
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.8;
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 1.6;
  }
  if (metrics.overthink > 0.3 && metrics.overthink < 0.55 && !signals.rotationPain) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 2.0;
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.9;
  }

  // Performance patterns
  if (signals.boomBust && metrics.template < 0.35) {
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.8;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.6;
  }
  if (signals.consistent && metrics.template > 0.55) {
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.9;
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 1.5;
  }
  if (signals.consistent && metrics.thrift > 0.4) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 2.1;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.9;
  }

  // Ancelotti patterns
  if (metrics.leadership > 0.55 && metrics.chaos < 0.25 && metrics.template > 0.45) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 2.1;
  }
  if (signals.consistent && metrics.leadership > 0.5) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.9;
  }
  if (metrics.template > 0.4 && metrics.template < 0.7 && 
      metrics.efficiency > 0.45 && metrics.chaos < 0.2) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.8;
  }
  if (metrics.overthink < 0.5 && metrics.activity > 0.35 && metrics.activity < 0.65) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.7;
  }
  if (signals.disciplined && metrics.efficiency > 0.5 && metrics.efficiency < 0.75) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.8;
  }

  // Redknapp patterns
  if (metrics.activity > 0.55 && metrics.efficiency > 0.4 && metrics.chaos > 0.15) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.9;
  }
  if (signals.constantTinkerer && metrics.efficiency > 0.45) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.8;
  }
}

/**
 * Apply rank-based boosts
 */
export function applyRankBoosts(
  scores: Record<string, number>,
  currentRank: number,
  signals: BehavioralSignals
): void {
  const R = RANK_THRESHOLDS;
  const topPercentile = (currentRank / R.TOTAL_PLAYERS) * 100;

  // Top 10k = THE GOAT
  if (currentRank <= R.ELITE) {
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 5.0;
    scores['SLOT'] = (scores['SLOT'] || 0) * 2.2;
  }
  // Top 50k
  else if (currentRank <= R.TOP_50K) {
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 4.2;
    scores['SLOT'] = (scores['SLOT'] || 0) * 3.0;
    scores['EMERY'] = (scores['EMERY'] || 0) * 2.5;
  }
  // Top 0.1%
  else if (topPercentile <= 0.1) {
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 4.0;
    scores['SLOT'] = (scores['SLOT'] || 0) * 2.6;
    scores['EMERY'] = (scores['EMERY'] || 0) * 2.2;
  }
  // Top 1%
  else if (topPercentile <= 1.0) {
    scores['SLOT'] = (scores['SLOT'] || 0) * 2.8;
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 2.5;
    scores['EMERY'] = (scores['EMERY'] || 0) * 2.5;
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 1.8;
  }
  // Top 10%
  else if (topPercentile <= 10.0) {
    scores['SLOT'] = (scores['SLOT'] || 0) * 1.8;
    scores['EMERY'] = (scores['EMERY'] || 0) * 1.6;
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.7;
  }
  // Top 25%
  else if (topPercentile <= 25.0) {
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.7;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.8;
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 1.9;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.7;
  }
  // Bottom 50%
  else if (topPercentile > 50.0) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 2.3;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 2.0;
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.4;
    scores['PEP'] = (scores['PEP'] || 0) * 1.6;
  }

  // Elite rank with disciplined behavior (50k-150k range)
  if (currentRank > R.TOP_50K && currentRank <= R.TOP_150K && signals.disciplined) {
    scores['SLOT'] = (scores['SLOT'] || 0) * 2.5;
    scores['EMERY'] = (scores['EMERY'] || 0) * 2.2;
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 1.9;
  }
}

/**
 * Apply captain pattern boosts
 */
export function applyCaptainPatternBoosts(
  scores: Record<string, number>,
  captainPattern: CaptainPattern,
  metrics: PersonaMetrics
): void {
  if (captainPattern.differential && metrics.template < 0.30) {
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 2.2;
    scores['WENGER'] = (scores['WENGER'] || 0) * 2.0;
  }
  if (captainPattern.loyalty && metrics.leadership > 0.5) {
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.0;
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 1.7;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.6;
  }
  if (captainPattern.chaser && metrics.leadership < 0.35) {
    scores['PEP'] = (scores['PEP'] || 0) * 2.3;
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.5;
  }
  if (captainPattern.safePicker && metrics.template > 0.60) {
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.8;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.6;
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 1.7;
  }
}

/**
 * Apply transfer timing boosts
 */
export function applyTransferTimingBoosts(
  scores: Record<string, number>,
  signals: BehavioralSignals
): void {
  if (signals.panicBuyer) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 2.0;
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.8;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.7;
  }
  if (signals.deadlineDayScrambler) {
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.8;
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.6;
    scores['PEP'] = (scores['PEP'] || 0) * 1.5;
  }
  if (signals.earlyPlanner) {
    scores['EMERY'] = (scores['EMERY'] || 0) * 2.0;
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 2.0;
    scores['SLOT'] = (scores['SLOT'] || 0) * 1.6;
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.7;
  }
  if (signals.kneeJerker) {
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.1;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.9;
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.8;
  }
  if (signals.lateNightReactor) {
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.7;
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.5;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.5;
  }
}

/**
 * Apply extreme metric boosts
 */
export function applyExtremeMetricBoosts(
  scores: Record<string, number>,
  metrics: PersonaMetrics,
  signals: BehavioralSignals
): void {
  // Extreme bench regret
  if (metrics.overthink > 0.75 && signals.rotationPain) {
    scores['PEP'] = (scores['PEP'] || 0) * 1.5;
  }
  if (metrics.overthink > 0.5 && metrics.overthink < 0.75 && !signals.rotationPain) {
    scores['PEP'] = (scores['PEP'] || 0) * 1.8;
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.7;
  }
  if (metrics.activity > 0.5 && metrics.overthink > 0.6) {
    scores['PEP'] = (scores['PEP'] || 0) * 1.9;
  }

  // Extreme activity
  if (metrics.activity > 0.85 && signals.constantTinkerer) {
    scores['TENHAG'] = (scores['TENHAG'] || 0) * 1.6;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.4;
  }

  // Extreme chaos
  if (metrics.chaos > 0.6) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.7;
  }
  if (metrics.chaos > 0.35 && metrics.chaos <= 0.6) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.9;
  }
  if (metrics.activity > 0.6 && metrics.chaos > 0.25) {
    scores['REDKNAPP'] = (scores['REDKNAPP'] || 0) * 1.8;
  }

  // Ultra-contrarian
  if (metrics.template < 0.20) {
    scores['WENGER'] = (scores['WENGER'] || 0) * 2.2;
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 2.0;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.8;
  }
  if (metrics.template < 0.25 && metrics.template >= 0.20) {
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.7;
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.6;
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.4;
  }
  if (metrics.template >= 0.25 && metrics.template < 0.40 && metrics.efficiency > 0.5) {
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.6;
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 1.7;
  }

  // Elite captaincy
  if (metrics.leadership > 0.85) {
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 2.0;
    scores['SLOT'] = (scores['SLOT'] || 0) * 1.5;
  }
  if (metrics.leadership > 0.7 && metrics.leadership <= 0.85 && metrics.chaos < 0.15) {
    scores['FERGUSON'] = (scores['FERGUSON'] || 0) * 1.7;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.6;
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.5;
  }

  // Pure template
  if (metrics.template > 0.8 && metrics.chaos < 0.08) {
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.9;
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.6;
  }
  if (metrics.template > 0.65 && metrics.template <= 0.8 && metrics.efficiency > 0.55) {
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.8;
    scores['MOYES'] = (scores['MOYES'] || 0) * 1.5;
  }

  // Extreme budget
  if (metrics.thrift > 0.7) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 2.5;
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 2.2;
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.8;
  }

  // Moderate efficiency with low activity
  if (metrics.efficiency > 0.5 && metrics.efficiency <= 0.7 && metrics.activity < 0.4) {
    scores['AMORIM'] = (scores['AMORIM'] || 0) * 2.0;
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.7;
  }

  // System builder patterns
  if (metrics.activity > 0.45 && metrics.activity < 0.7 && metrics.efficiency > 0.45) {
    scores['MARESCA'] = (scores['MARESCA'] || 0) * 1.8;
  }
}

/**
 * Apply chip personality boosts
 */
export function applyChipPersonalityBoosts(
  scores: Record<string, number>,
  signals: BehavioralSignals,
  metrics: PersonaMetrics
): void {
  if (signals.chipMaster && metrics.chipMastery > 0.7) {
    scores['SLOT'] = (scores['SLOT'] || 0) * 1.5;
  }
  if (signals.chipGambler && metrics.chipRisk > 0.65) {
    scores['KLOPP'] = (scores['KLOPP'] || 0) * 1.3;
  }
  if (signals.strategicChipper) {
    scores['EMERY'] = (scores['EMERY'] || 0) * 1.4;
  }
  if (signals.contrarian && metrics.template < 0.25) {
    scores['WENGER'] = (scores['WENGER'] || 0) * 1.4;
  }
  if (signals.templateChipper && metrics.template > 0.65) {
    scores['ARTETA'] = (scores['ARTETA'] || 0) * 1.4;
  }
  if (signals.chipGambler && metrics.chipRisk > 0.6) {
    scores['POSTECOGLOU'] = (scores['POSTECOGLOU'] || 0) * 1.3;
  }
  if (signals.chipMaster && metrics.chipMastery > 0.6) {
    scores['ANCELOTTI'] = (scores['ANCELOTTI'] || 0) * 1.3;
  }
  if (signals.strategicChipper && metrics.thrift > 0.4) {
    scores['MOURINHO'] = (scores['MOURINHO'] || 0) * 1.3;
  }
  if (signals.templateChipper && metrics.thrift > 0.5) {
    scores['SIMEONE'] = (scores['SIMEONE'] || 0) * 1.3;
  }
}

// ============================================================================
// ELIGIBILITY FILTERS
// ============================================================================

/**
 * Filter personas based on eligibility criteria
 */
export function filterEligiblePersonas(
  scores: Record<string, number>,
  metrics: PersonaMetrics,
  signals: BehavioralSignals,
  currentRank: number
): Array<[string, number]> {
  const R = RANK_THRESHOLDS;

  return Object.entries(scores).filter(([key]) => {
    switch (key) {
      case 'FERGUSON':
        return currentRank <= R.ELITE || 
          (metrics.efficiency > 0.65 && metrics.leadership > 0.75 && currentRank <= R.TOP_50K);

      case 'SLOT':
        return currentRank <= R.TOP_100K && metrics.efficiency > 0.60 && metrics.leadership > 0.55;

      case 'EMERY':
        return currentRank <= R.TOP_300K || signals.earlyPlanner || 
          (signals.disciplined && metrics.efficiency > 0.65);

      case 'REDKNAPP':
        return metrics.chaos > 0.35 && metrics.activity > 0.5;

      case 'MOYES':
        return metrics.chaos < 0.12 && metrics.activity < 0.45 && metrics.template > 0.5;

      case 'KLOPP':
        return (metrics.template < 0.25 && metrics.activity > 0.60 && metrics.chaos > 0.10) ||
          (metrics.template < 0.30 && metrics.activity > 0.75 && metrics.chaos > 0.15) ||
          (signals.boomBust && metrics.template < 0.35 && metrics.activity > 0.55);

      case 'POSTECOGLOU':
        return (metrics.template < 0.30 && metrics.activity > 0.60) ||
          (metrics.template < 0.40 && metrics.activity > 0.80 && metrics.chaos > 0.10) ||
          (signals.earlyAggression && metrics.template < 0.45);

      case 'PEP':
        return metrics.overthink > 0.60 && metrics.efficiency < 0.95;

      case 'WENGER':
        return (metrics.template < 0.35 && metrics.chaos < 0.15 && metrics.efficiency > 0.4) ||
          (metrics.template < 0.40 && metrics.chaos < 0.10 && signals.disciplined);

      case 'ARTETA':
        return metrics.template > 0.65 && metrics.efficiency > 0.5;

      case 'MOURINHO':
        return (metrics.chaos < 0.15 && metrics.thrift > 0.35) ||
          (metrics.chaos < 0.10 && metrics.template > 0.50);

      case 'SIMEONE':
        return metrics.chaos < 0.12 && metrics.thrift > 0.45;

      case 'AMORIM':
        return (metrics.efficiency > 0.75 && signals.longTermBacker && metrics.activity < 0.50) ||
          (metrics.efficiency > 0.80 && metrics.activity < 0.45 && metrics.chaos < 0.10);

      case 'TENHAG':
        return metrics.activity > 0.70;

      case 'ANCELOTTI':
        return (metrics.chaos < 0.3 && metrics.leadership > 0.5) ||
          (metrics.leadership > 0.60 && metrics.template > 0.45 && metrics.template < 0.70);

      case 'MARESCA':
        return metrics.activity > 0.35 && metrics.activity < 0.75;

      default:
        return true;
    }
  });
}

/**
 * Apply deal-breaker logic to filter impossible combinations
 */
export function applyDealBreakers(
  personas: Array<[string, number]>,
  metrics: PersonaMetrics
): Array<[string, number]> {
  return personas.filter(([key]) => {
    // High template followers CANNOT be differential hunters
    if (metrics.template > 0.7 && ['WENGER', 'KLOPP', 'POSTECOGLOU'].includes(key)) {
      return false;
    }

    // Very low chaos players CANNOT be hit specialists
    if (metrics.chaos < 0.1 && ['REDKNAPP', 'TENHAG'].includes(key)) {
      return false;
    }

    // Very low overthink players CANNOT be Pep
    if (metrics.overthink < 0.3 && key === 'PEP') {
      return false;
    }

    // Very low activity players CANNOT be active tinkerers
    if (metrics.activity < 0.25 && ['REDKNAPP', 'TENHAG', 'POSTECOGLOU', 'MARESCA'].includes(key)) {
      return false;
    }

    // Anti-template players CANNOT be template followers
    if (metrics.template < 0.4 && ['MOYES', 'ARTETA', 'SIMEONE'].includes(key)) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// FINAL SELECTION
// ============================================================================

/**
 * Select the best persona from competitive candidates
 */
export function selectBestPersona(
  validPersonas: Array<[string, number]>,
  signals: BehavioralSignals,
  metrics: PersonaMetrics
): string {
  // Sort by score
  const sortedPersonas = validPersonas.sort((a, b) => b[1] - a[1]);
  const topScore = sortedPersonas[0][1];

  // Find competitive personas (within 10% of top)
  const competitiveThreshold = topScore * 0.90;
  const competitivePersonas = sortedPersonas.filter(
    ([, score]) => score >= competitiveThreshold
  );

  if (competitivePersonas.length <= 1) {
    return competitivePersonas[0][0];
  }

  // Use behavioral matches to differentiate
  const personaMatches = competitivePersonas.map(([key]) => ({
    key,
    matchStrength: calculateMatchStrength(key, signals, metrics),
  }));

  personaMatches.sort((a, b) => {
    if (b.matchStrength !== a.matchStrength) return b.matchStrength - a.matchStrength;
    const scoreA = competitivePersonas.find(([k]) => k === a.key)?.[1] || 0;
    const scoreB = competitivePersonas.find(([k]) => k === b.key)?.[1] || 0;
    return scoreB - scoreA;
  });

  return personaMatches[0].key;
}

/**
 * Calculate behavioral match strength for a persona
 */
function calculateMatchStrength(
  key: string,
  signals: BehavioralSignals,
  metrics: PersonaMetrics
): number {
  let matchStrength = 0;

  // Strong behavioral matches (3 points)
  if (key === 'TENHAG' && signals.constantTinkerer && metrics.activity > 0.75) matchStrength += 3;
  if (key === 'REDKNAPP' && signals.hitAddict && metrics.chaos > 0.4) matchStrength += 3;
  if (key === 'WENGER' && metrics.template < 0.20 && signals.disciplined) matchStrength += 3;
  if (key === 'KLOPP' && signals.boomBust && metrics.template < 0.30) matchStrength += 3;
  if (key === 'PEP' && signals.rotationPain && metrics.overthink > 0.70) matchStrength += 3;
  if (key === 'AMORIM' && signals.longTermBacker && metrics.efficiency > 0.85) matchStrength += 3;
  if (key === 'POSTECOGLOU' && signals.earlyAggression && metrics.template < 0.35) matchStrength += 3;
  if (key === 'EMERY' && signals.disciplined && metrics.efficiency > 0.75) matchStrength += 3;
  if (key === 'SLOT' && signals.benchMaster && metrics.leadership > 0.65) matchStrength += 3;
  if (key === 'MOYES' && signals.consistent && metrics.template > 0.60) matchStrength += 3;

  // Chip personality matches (2-3 points)
  if (key === 'SLOT' && signals.chipMaster && metrics.chipMastery > 0.7) matchStrength += 3;
  if (key === 'KLOPP' && signals.chipGambler && metrics.chipRisk > 0.65) matchStrength += 2;
  if (key === 'EMERY' && signals.strategicChipper) matchStrength += 2;
  if (key === 'WENGER' && signals.contrarian && metrics.template < 0.25) matchStrength += 2;
  if (key === 'ARTETA' && signals.templateChipper && metrics.template > 0.65) matchStrength += 2;
  if (key === 'POSTECOGLOU' && signals.chipGambler && metrics.chipRisk > 0.6) matchStrength += 2;
  if (key === 'ANCELOTTI' && signals.chipMaster && metrics.chipMastery > 0.6) matchStrength += 2;
  if (key === 'MOURINHO' && signals.strategicChipper && metrics.thrift > 0.4) matchStrength += 2;
  if (key === 'SIMEONE' && signals.templateChipper && metrics.thrift > 0.5) matchStrength += 2;

  // Moderate matches (2 points)
  if (key === 'MARESCA' && signals.constantTinkerer && metrics.activity > 0.45) matchStrength += 2;
  if (key === 'ANCELOTTI' && signals.benchMaster && metrics.chaos < 0.20) matchStrength += 2;
  if (key === 'ARTETA' && metrics.template > 0.65 && metrics.efficiency > 0.60) matchStrength += 2;
  if (key === 'MOURINHO' && metrics.chaos < 0.10 && metrics.thrift > 0.40) matchStrength += 2;

  // Uniqueness boosts (2 points)
  if (key === 'TENHAG' && metrics.activity > 0.80) matchStrength += 2;
  if (key === 'REDKNAPP' && metrics.chaos > 0.50) matchStrength += 2;
  if (key === 'WENGER' && metrics.template < 0.22) matchStrength += 2;
  if (key === 'PEP' && metrics.overthink > 0.75) matchStrength += 2;

  return matchStrength;
}
