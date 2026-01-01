/**
 * FPL Position Constants
 * 
 * Centralized mapping for position types, colors, emojis, and labels
 * to ensure consistency across the application.
 */

export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';

/**
 * Position labels (short form)
 */
export const POSITION_LABELS: Record<Position, string> = {
  GKP: 'GKP',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD'
};

/**
 * Position labels (full form)
 */
export const POSITION_FULL_LABELS: Record<Position, string> = {
  GKP: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards'
};

/**
 * Position emojis for visual representation
 */
export const POSITION_EMOJIS: Record<Position, string> = {
  GKP: '🧤',
  DEF: '🛡️',
  MID: '⚡',
  FWD: '🎯'
};

/**
 * Position colors for visual theming
 * - GKP: Amber (goalkeepers traditionally wear different colors)
 * - DEF: Blue (defensive stability)
 * - MID: Brand green (engine room, brand color)
 * - FWD: Brand red (attack, goals, excitement)
 */
export const POSITION_COLORS: Record<Position, string> = {
  GKP: '#b45309', // amber-700 (darker for white text contrast)
  DEF: '#1d4ed8', // blue-700
  MID: '#059669', // emerald-600 (deeper green for white text contrast)
  FWD: '#be123c'  // rose-700
};

/**
 * Map FPL API element_type to position string
 * FPL API uses:
 * - 1 = Goalkeeper
 * - 2 = Defender
 * - 3 = Midfielder
 * - 4 = Forward
 */
export const ELEMENT_TYPE_TO_POSITION: Record<number, Position> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD'
};

/**
 * All positions in a fixed order
 */
export const ALL_POSITIONS: Position[] = ['GKP', 'DEF', 'MID', 'FWD'];

/**
 * Get position full label
 */
export function getPositionLabel(position: Position, full = false): string {
  return full ? POSITION_FULL_LABELS[position] : POSITION_LABELS[position];
}

/**
 * Get position from FPL element_type
 */
export function getPositionFromElementType(elementType: number): Position {
  return ELEMENT_TYPE_TO_POSITION[elementType] || 'MID';
}
