/**
 * Chip personality analysis
 * Analyzes chip effectiveness, risk profile, and strategic timing
 */

import { ChipAnalysis, FPLBootstrap } from '../../types';
import { ChipPersonality } from './types';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';

const PREMIUM_TRIPLE_CAPTAIN_CHOICES = ['Haaland', 'M.Salah', 'Palmer', 'Son'];

/**
 * Analyze chip usage patterns to determine personality
 */
export function analyzeChipPersonality(
  chips: ChipAnalysis[],
  bootstrap: FPLBootstrap
): ChipPersonality {
  const usedChips = chips.filter((c) => c.used);

  // Default values for managers who haven't used chips yet
  if (usedChips.length === 0) {
    return createDefaultChipPersonality();
  }

  const effectivenessScore = calculateEffectivenessScore(usedChips);
  const riskScore = calculateRiskScore(usedChips);
  const popularityScore = calculatePopularityScore(usedChips, bootstrap);

  const earliestChipGW = Math.min(...usedChips.map((c) => c.event));

  return {
    effectivenessScore,
    riskScore,
    isStrategic: effectivenessScore > 0.6 && popularityScore > 0.4,
    isGambler: riskScore > 0.65,
    isEfficient: effectivenessScore > 0.7,
    chipTimingProfile: determineChipTimingProfile(
      earliestChipGW,
      popularityScore,
      effectivenessScore
    ),
    popularityScore,
  };
}

/**
 * Create default chip personality for managers without chip usage
 */
function createDefaultChipPersonality(): ChipPersonality {
  return {
    effectivenessScore: 0.5,
    riskScore: 0.5,
    isStrategic: false,
    isGambler: false,
    isEfficient: false,
    chipTimingProfile: 'Pending',
    popularityScore: 0.5,
  };
}

/**
 * Calculate effectiveness score based on chip results
 * Normalizes points gained for each chip type
 */
function calculateEffectivenessScore(usedChips: ChipAnalysis[]): number {
  const chipScores = usedChips.map((chip) => {
    const points = chip.pointsGained || 0;

    // Normalize based on chip type expectations
    switch (chip.name) {
      case CHIP_NAMES.BBOOST:
        // Bench Boost: -5 to 20 pts → 0-1
        return Math.min(1, Math.max(0, (points + 5) / 25));
      case CHIP_NAMES.THREE_XC:
        // Triple Captain: -2 to 18 pts → 0-1
        return Math.min(1, Math.max(0, (points + 2) / 20));
      case CHIP_NAMES.FREEHIT:
        // Free Hit: -5 to 15 pts → 0-1
        return Math.min(1, Math.max(0, (points + 5) / 20));
      case CHIP_NAMES.WILDCARD:
        // Wildcard: -10 to 15 pts/gw → 0-1 (Normalized relative to average)
        return Math.min(1, Math.max(0, (points + 10) / 25));
      default:
        return 0.5;
    }
  });

  return chipScores.length > 0
    ? chipScores.reduce((sum, s) => sum + s, 0) / chipScores.length
    : 0.5;
}

/**
 * Calculate risk score based on chip usage patterns
 */
function calculateRiskScore(usedChips: ChipAnalysis[]): number {
  let riskPoints = 0;
  let riskFactors = 0;

  // Check Triple Captain risk
  const tripleCaptain = usedChips.find((c) => c.name === CHIP_NAMES.THREE_XC);
  if (tripleCaptain?.metadata?.captainName) {
    const captainName = tripleCaptain.metadata.captainName as string;
    const isDifferential = !PREMIUM_TRIPLE_CAPTAIN_CHOICES.includes(captainName);
    if (isDifferential) {
      riskPoints += 1; // Triple captain on differential = risky
    }
    riskFactors += 1;
  }

  // Check Bench Boost risk
  const benchBoost = usedChips.find((c) => c.name === CHIP_NAMES.BBOOST);
  if (benchBoost?.metadata?.benchPlayers) {
    const benchPlayers = benchBoost.metadata.benchPlayers as Array<{
      name: string;
      points: number;
    }>;
    const avgBenchPoints =
      benchPlayers.reduce((sum, p) => sum + p.points, 0) / benchPlayers.length;
    // High bench points per player = risky premium bench strategy
    if (avgBenchPoints >= 4) {
      riskPoints += 0.7;
    }
    riskFactors += 1;
  }

  // Check chip timing risk
  const earliestChipGW = Math.min(...usedChips.map((c) => c.event));
  if (earliestChipGW <= 5) {
    riskPoints += 0.8; // Very early chips = high risk
  } else if (earliestChipGW <= 10) {
    riskPoints += 0.4; // Early-ish chips = moderate risk
  }
  riskFactors += 1;

  return riskFactors > 0 ? riskPoints / riskFactors : 0.5;
}

/**
 * Calculate popularity score based on when chips were used vs. the masses
 */
function calculatePopularityScore(
  usedChips: ChipAnalysis[],
  bootstrap: FPLBootstrap
): number {
  let popularitySum = 0;
  let popularityCount = 0;

  usedChips.forEach((chip) => {
    const gameweek = bootstrap.events.find((e) => e.id === chip.event);
    if (gameweek?.chip_plays) {
      const chipPlay = gameweek.chip_plays.find(
        (cp) => cp.chip_name === chip.name
      );
      if (chipPlay && !gameweek.is_current) {
        // Only count finished GWs
        const totalPlayers = bootstrap.total_players;
        const usageRate = totalPlayers > 0 ? chipPlay.num_played / totalPlayers : 0;

        // 10% usage = 1.0 score
        popularitySum += Math.min(1, usageRate * 10);
        popularityCount += 1;
      }
    }
  });

  return popularityCount > 0 ? popularitySum / popularityCount : 0.5;
}

/**
 * Determine the chip timing profile based on usage patterns
 */
function determineChipTimingProfile(
  earliestChipGW: number,
  popularityScore: number,
  effectivenessScore: number
): string {
  if (earliestChipGW <= 7) {
    return 'Early Aggressor';
  }
  if (earliestChipGW >= 25) {
    return 'Hoarder';
  }
  if (popularityScore > 0.7) {
    return 'Template Follower';
  }
  if (popularityScore < 0.3) {
    return 'Contrarian';
  }
  if (effectivenessScore > 0.7) {
    return 'Strategic Planner';
  }
  if (effectivenessScore < 0.4) {
    return 'Reactive';
  }
  return 'Balanced';
}
