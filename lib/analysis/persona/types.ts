/**
 * Types for the persona analysis system
 */

import { FPLBootstrap, ChipAnalysis } from '../../types';

/**
 * Normalized metrics (0-1 scale) used for persona scoring
 */
export interface PersonaMetrics {
  /** Transfer activity level (transfers/80) */
  activity: number;
  /** Hit-taking frequency (hits/30) */
  chaos: number;
  /** Bench points regret (avgBench/15) */
  overthink: number;
  /** Template adherence (overlap/100) */
  template: number;
  /** Transfer efficiency (points gained/15) */
  efficiency: number;
  /** Captaincy success rate (success/100) */
  leadership: number;
  /** Budget management (1040-value/60) */
  thrift: number;
  /** Patience level (long holds/total players) */
  patience: number;
  /** Transfer timing (early/late) (0-1, 1 = early/planned, 0 = late/panic) */
  timing: number;
  /** Chip effectiveness (0-1) */
  chipMastery: number;
  /** Risk-taking in chips (0-1) */
  chipRisk: number;
}

/**
 * Behavioral signals that indicate specific manager patterns
 */
export interface BehavioralSignals {
  // Activity patterns
  /** Multiple GWs with 2+ non-chip transfers */
  constantTinkerer: boolean;
  /** Multiple consecutive hit weeks */
  hitAddict: boolean;
  /** Very few hits despite decent activity */
  disciplined: boolean;

  // Bench management
  /** High bench points with quality squad */
  rotationPain: boolean;
  /** Consistently low bench points */
  benchMaster: boolean;

  // Template & conviction
  /** Extremely low template throughout */
  ultraContrarian: boolean;
  /** Held players 10+ GWs */
  longTermBacker: boolean;

  // Chip timing
  /** Early wildcard (before GW12) */
  earlyAggression: boolean;
  /** Very late chips (after GW25) */
  chipHoarder: boolean;

  // Performance patterns
  /** High volatility (big swings) */
  boomBust: boolean;
  /** Low volatility (stable) */
  consistent: boolean;

  // Transfer timing patterns
  /** Multiple panic transfers (<3h before deadline) */
  panicBuyer: boolean;
  /** Majority of transfers on deadline day */
  deadlineDayScrambler: boolean;
  /** Most transfers >96h before deadline */
  earlyPlanner: boolean;
  /** Multiple transfers <48h after previous GW starts */
  kneeJerker: boolean;
  /** Many transfers 11pm-5am local time */
  lateNightReactor: boolean;

  // Chip personality patterns
  /** High chip effectiveness score (>0.7) */
  chipMaster: boolean;
  /** High risk chip plays (>0.65) */
  chipGambler: boolean;
  /** Chips used strategically with good timing */
  strategicChipper: boolean;
  /** Chips used when masses don't */
  contrarian: boolean;
  /** Chips used when everyone does */
  templateChipper: boolean;

  // Squad value patterns
  /** Squad value consistently increasing (smart business) */
  valueBuildingGenius: boolean;
  /** Squad value declining (burning value) */
  burningValue: boolean;
  /** High average bank balance (>1.5m) */
  bankHoarder: boolean;
  /** Low average bank balance (<0.5m, fully invested) */
  fullyInvested: boolean;
}

/**
 * Captain choice pattern analysis
 */
export interface CaptainPattern {
  /** Same captain 8+ times */
  loyalty: boolean;
  /** Frequently switches (4+ different in 8 GWs) */
  chaser: boolean;
  /** 3+ non-premium captains */
  differential: boolean;
  /** Only Haaland/Salah */
  safePicker: boolean;
}

/**
 * Chip personality analysis results
 */
export interface ChipPersonality {
  /** 0-1: How well chips were executed */
  effectivenessScore: number;
  /** 0-1: How risky chip choices were */
  riskScore: number;
  /** Used chips in popular/optimal gameweeks */
  isStrategic: boolean;
  /** High-risk chip plays */
  isGambler: boolean;
  /** High chip effectiveness */
  isEfficient: boolean;
  /** "Early Aggressor" | "Patient Planner" | "Reactive" | "Hoarder" etc */
  chipTimingProfile: string;
  /** 0-1: Used chips when masses did */
  popularityScore: number;
}

/**
 * Personality spectrum scores for each persona (0-1 scale)
 * Four binary dimensions that create 16 unique combinations (like MBTI)
 */
export interface PersonalitySpectrums {
  /** Differential (0) vs Template (1): Squad strategy */
  differential: number;
  /** Analyzer (0) vs Intuitive (1): Decision basis */
  analyzer: number;
  /** Patient (0) vs Reactive (1): Activity level */
  patient: number;
  /** Cautious (0) vs Aggressive (1): Risk tolerance */
  cautious: number;
}

/**
 * Persona definition with weights for scoring
 */
export interface PersonaDefinition {
  name: string;
  title: string;
  desc: string;
  color: string;
  traits: string[];
  emoji: string;
  weights: Partial<PersonaMetrics>;
  spectrums: PersonalitySpectrums;
}

/**
 * Input data required for chip personality analysis
 */
export interface ChipPersonalityInput {
  chips: ChipAnalysis[];
  bootstrap: FPLBootstrap;
}

/**
 * Transfer timing analysis result from transfers module
 */
export interface TransferTimingAnalysis {
  panicTransfers: number;
  deadlineDayTransfers: number;
  midWeekTransfers: number;
  earlyStrategicTransfers: number;
  kneeJerkTransfers: number;
  lateNightTransfers: number;
}
