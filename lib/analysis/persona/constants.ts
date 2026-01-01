/**
 * Constants for the persona analysis system
 * Includes persona definitions, thresholds, and scoring weights
 */

import { PersonaDefinition } from './types';

// ============================================================================
// NORMALIZATION THRESHOLDS
// Used to normalize raw metrics to 0-1 scale
// ============================================================================

export const NORMALIZATION = {
  /** Max transfers for full activity score */
  TRANSFERS_MAX: 80,
  /** Max hits for full chaos score */
  HITS_MAX: 30,
  /** Max avg bench points per week for full overthink score */
  BENCH_POINTS_MAX: 15,
  /** Max efficiency points for full score */
  EFFICIENCY_MAX: 15,
  /** Squad value baseline */
  VALUE_BASELINE: 1040,
  /** Squad value range for thrift calculation */
  VALUE_RANGE: 60,
} as const;

// ============================================================================
// BEHAVIORAL SIGNAL THRESHOLDS
// ============================================================================

export const SIGNAL_THRESHOLDS = {
  /** GWs with 2+ non-chip transfers to be a constant tinkerer */
  CONSTANT_TINKERER_GWS: 8,
  /** Consecutive hit weeks to be a hit addict */
  CONSECUTIVE_HITS_MIN: 3,
  /** Max hits to be considered disciplined */
  DISCIPLINED_MAX_HITS: 2,
  /** Min non-chip transfers to be disciplined */
  DISCIPLINED_MIN_TRANSFERS: 20,

  /** Min avg squad value for rotation pain */
  ROTATION_PAIN_MIN_VALUE: 1020,
  /** Min avg bench points for rotation pain */
  ROTATION_PAIN_MIN_BENCH: 9,
  /** Min high bench GWs (10+) for rotation pain */
  ROTATION_PAIN_MIN_HIGH_GWS: 5,

  /** Max avg bench points to be bench master */
  BENCH_MASTER_MAX_BENCH: 7,
  /** Max high bench GWs to be bench master */
  BENCH_MASTER_MAX_HIGH_GWS: 2,

  /** Min GWs held to count as long-term backing */
  LONG_TERM_HOLD_GWS: 10,
  /** Min players held long-term */
  LONG_TERM_HOLD_PLAYERS: 3,

  /** Early wildcard threshold */
  EARLY_WILDCARD_GW: 12,
  /** Late chips threshold */
  LATE_CHIPS_GW: 25,

  /** Min std dev for boom-bust */
  BOOM_BUST_STD_DEV: 18,
  /** Max std dev for consistent */
  CONSISTENT_STD_DEV: 14,
  /** High score threshold */
  HIGH_SCORE_THRESHOLD: 70,
  /** Low score threshold */
  LOW_SCORE_THRESHOLD: 40,
  /** Min high/low GWs for boom-bust */
  BOOM_BUST_MIN_GWS: 3,
  /** Max high/low GWs for consistent */
  CONSISTENT_MAX_GWS: 2,

  /** Min transfers for timing analysis */
  MIN_TRANSFERS_FOR_TIMING: 10,
  /** Panic buyer transfer percentage */
  PANIC_BUYER_PCT: 0.20,
  /** Panic buyer min transfers */
  PANIC_BUYER_MIN: 2,
  /** Deadline scrambler percentage */
  DEADLINE_SCRAMBLER_PCT: 0.40,
  /** Deadline scrambler min transfers */
  DEADLINE_SCRAMBLER_MIN: 4,
  /** Early planner percentage */
  EARLY_PLANNER_PCT: 0.35,
  /** Early planner min transfers */
  EARLY_PLANNER_MIN: 3,
  /** Knee jerker percentage */
  KNEE_JERKER_PCT: 0.25,
  /** Knee jerker min transfers */
  KNEE_JERKER_MIN: 3,
  /** Late night percentage */
  LATE_NIGHT_PCT: 0.30,
  /** Late night min transfers */
  LATE_NIGHT_MIN: 3,

  /** Chip master effectiveness threshold */
  CHIP_MASTER_THRESHOLD: 0.7,
  /** Chip gambler risk threshold */
  CHIP_GAMBLER_THRESHOLD: 0.65,
  /** Contrarian chip popularity threshold */
  CHIP_CONTRARIAN_THRESHOLD: 0.3,
  /** Template chipper popularity threshold */
  CHIP_TEMPLATE_THRESHOLD: 0.7,
} as const;

// ============================================================================
// RANK THRESHOLDS
// ============================================================================

export const RANK_THRESHOLDS = {
  /** Top 10k absolute threshold */
  ELITE: 10_000,
  /** Top 50k threshold */
  TOP_50K: 50_000,
  /** Top 100k threshold */
  TOP_100K: 100_000,
  /** Top 150k threshold */
  TOP_150K: 150_000,
  /** Top 300k threshold */
  TOP_300K: 300_000,
  /** Total players estimate */
  TOTAL_PLAYERS: 12_742_297,
} as const;

// ============================================================================
// PREMIUM PLAYERS
// ============================================================================

export const PREMIUM_CAPTAINS = ['Haaland', 'M.Salah', 'Palmer'] as const;

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export const PERSONA_MAP: Record<string, PersonaDefinition> = {
  PEP: {
    name: 'Pep Guardiola',
    title: 'The Bald Genius',
    desc: 'You constantly rotate and leave hauls on the bench. But somehow, your tactical genius makes it work.',
    color: '#6CABDD',
    traits: ['Rotation Roulette', 'Bald Fraud Energy', 'Makes It Work Anyway'],
    emoji: '🧠',
    weights: { overthink: 1.5, activity: 0.5, efficiency: 0.4, template: 0.3, chaos: -0.5 },
  },
  MOYES: {
    name: 'David Moyes',
    title: 'The Reliable',
    desc: 'You trust the process, stick to the template, and rarely take hits. Consistency is your middle name.',
    color: '#800000',
    traits: ['Template King', 'Hit-Averse', 'Solid Foundation'],
    emoji: '🛡️',
    weights: { template: 1.2, chaos: -1.5, activity: -0.8, overthink: -0.6, thrift: 0.4 },
  },
  REDKNAPP: {
    name: 'Harry Redknapp',
    title: 'The Wheeler-Dealer',
    desc: "You love a deal. If there's a -4 to be taken, you're taking it. Somehow, your moves often work out.",
    color: '#0000FF',
    traits: ['Hit Specialist', 'High Turnover', 'Deal Maker'],
    emoji: '💸',
    weights: { chaos: 1.5, activity: 1.2, efficiency: -0.3, overthink: 0.3, template: -0.4 },
  },
  MOURINHO: {
    name: 'Jose Mourinho',
    title: 'The Special One',
    desc: "You build from the back and prioritize clean sheets. You'd rather win 1-0 than 4-3.",
    color: '#132257',
    traits: ['Defense First', 'Pragmatic Wins', 'Budget Warrior'],
    emoji: '🚌',
    weights: { chaos: -1.2, efficiency: 0.7, thrift: 0.9, template: 0.5, overthink: -0.7 },
  },
  KLOPP: {
    name: 'Jurgen Klopp',
    title: 'Heavy Metal FPL',
    desc: 'You ignore the template and chase the upside. When your differentials haul, the world knows it.',
    color: '#C8102E',
    traits: ['Differential Hunter', 'High Variance', 'Emotional Picks'],
    emoji: '🎸',
    weights: { template: -1.5, leadership: 0.7, chaos: 0.6, activity: 0.8, efficiency: 0.2 },
  },
  AMORIM: {
    name: 'Ruben Amorim',
    title: 'The Stubborn One',
    desc: 'You stick to your vision when others doubt. Every move you make seems to turn to gold.',
    color: '#005CAB',
    traits: ['Unwavering Vision', 'High ROI', 'Anti-Template Edge'],
    emoji: '🦁',
    weights: { efficiency: 1.3, leadership: 0.6, template: -0.5, activity: 0.3, chaos: -0.4 },
  },
  FERGUSON: {
    name: 'Sir Alex Ferguson',
    title: 'The GOAT',
    desc: 'You simply know how to win. Your captaincy picks are legendary and your rank reflects it.',
    color: '#DA291C',
    traits: ['Elite Captaincy', 'Serial Winner', 'Mental Toughness'],
    emoji: '👑',
    weights: { leadership: 1.5, efficiency: 1.0, overthink: -0.7, chaos: -0.5, template: 0.4 },
  },
  POSTECOGLOU: {
    name: 'Ange Postecoglou',
    title: 'The All-Outer',
    desc: 'Attack is your only setting. You take big risks on differentials and never second-guess yourself. Mate...',
    color: '#0B0E1E',
    traits: ['All-Out Attack', 'Never Backs Down', 'Differential King'],
    emoji: '🦘',
    weights: { chaos: 1.0, template: -1.8, activity: 1.3, overthink: -1.0, efficiency: -0.1 },
  },
  EMERY: {
    name: 'Unai Emery',
    title: 'The Methodical',
    desc: 'Good ebening. Your preparation is unmatched. You think deeply about every transfer and rarely panic.',
    color: '#7B003A',
    traits: ['Deep Analysis', 'Efficiency Master', 'Calculated Moves'],
    emoji: '📋',
    weights: { efficiency: 1.3, overthink: 0.6, template: 0.4, chaos: -1.0, activity: -0.3 },
  },
  WENGER: {
    name: 'Arsene Wenger',
    title: 'The Professor',
    desc: "You hunt for the perfect differential. You'd rather find a 5.0m gem than follow the herd.",
    color: '#EF0107',
    traits: ['Differential Scout', 'Beautiful FPL', 'Low Hits'],
    emoji: '🧐',
    weights: { template: -1.8, efficiency: 1.0, chaos: -1.3, thrift: 0.8, activity: -0.2 },
  },
  ANCELOTTI: {
    name: 'Carlo Ancelotti',
    title: 'The Calm Conductor',
    desc: "You stay composed under pressure. Your squad rotates smoothly and you rarely panic. Experience is your edge.",
    color: '#FFFFFF',
    traits: ['Cool Under Pressure', 'Balanced Approach', 'Veteran Wisdom'],
    emoji: '🤨',
    weights: { template: 0.8, chaos: -1.0, leadership: 1.0, overthink: -0.6, efficiency: 0.6 },
  },
  MARESCA: {
    name: 'Enzo Maresca',
    title: 'The System Builder',
    desc: 'You trust young talent and rotate intelligently. Your squad depth is your weapon, and you adapt tactically.',
    color: '#034694',
    traits: ['Youth Over Experience', 'Tactical Flexibility', 'Smart Rotation'],
    emoji: '🎯',
    weights: { activity: 1.0, overthink: 0.5, efficiency: 0.7, template: -0.3, chaos: 0.2 },
  },
  ARTETA: {
    name: 'Mikel Arteta',
    title: 'The Process Manager',
    desc: 'You follow the plan religiously. You stick to the elite assets and rarely deviate from the template.',
    color: '#EF0107',
    traits: ['Trust the Process', 'Efficiency First', 'Elite Template'],
    emoji: '🏗️',
    weights: { efficiency: 1.0, template: 1.3, chaos: -1.2, activity: -0.3, leadership: 0.6 },
  },
  SIMEONE: {
    name: 'Diego Simeone',
    title: 'The Warrior',
    desc: 'You grind out results with grit and determination. Defense is sacred, and you fight for every single point.',
    color: '#CB3524',
    traits: ['Never Surrender', 'Defensive Fortress', 'Budget Master'],
    emoji: '⚔️',
    weights: { template: 0.8, chaos: -1.5, leadership: 0.7, thrift: 1.2, overthink: -0.5 },
  },
  SLOT: {
    name: 'Arne Slot',
    title: 'The Optimizer',
    desc: "You're meticulous and data-driven. Every decision is backed by xG, xA, and underlying stats. You find smart differentials.",
    color: '#D00027',
    traits: ['Data-Driven', 'Smart Differentials', 'High Efficiency'],
    emoji: '📊',
    weights: { efficiency: 1.4, leadership: 0.9, overthink: 0.3, chaos: -0.8, template: 0.2 },
  },
  TENHAG: {
    name: 'Erik ten Hag',
    title: 'The Rebuilder',
    desc: "You're always one gameweek away from a masterpiece. You tinker with the squad constantly.",
    color: '#DA291C',
    traits: ['Constant Rebuild', 'High Potential', 'Inconsistent'],
    emoji: '📉',
    weights: { activity: 1.8, efficiency: -0.8, overthink: 0.6, chaos: 0.7, template: -0.2 },
  },
} as const;

// ============================================================================
// METRIC TO TRAIT MAPPING
// ============================================================================

export const METRIC_TO_TRAIT: Record<string, string> = {
  chaos: 'Hit Taker',
  overthink: 'Bench Regret',
  template: 'Template Follower',
  efficiency: 'Net Transfer Impact',
  leadership: 'Captain Accuracy',
  thrift: 'Budget Optimizer',
} as const;
