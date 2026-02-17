/**
 * Shared constants for the chat system
 */

export const TONE_CONFIG = {
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    shortLabel: 'Balanced',
    icon: '⚖️',
    prompt: '',
  },
  roast: {
    id: 'roast',
    label: 'Savage Roast',
    shortLabel: 'Roast',
    icon: '🔥',
    prompt: 'Reply with a sharp, sarcastic, and funny roasting tone. Be critical of bad decisions or bad luck.',
  },
  optimist: {
    id: 'optimist',
    label: 'Eternal Optimist',
    shortLabel: 'Optimist',
    icon: '📈',
    prompt: 'Be incredibly positive and encouraging, finding every possible silver lining in the data.',
  },
  delulu: {
    id: 'delulu',
    label: 'Pure Delulu',
    shortLabel: 'Delulu',
    icon: '🤪',
    prompt: 'Ignore all negative data. Frame every failure as a masterstroke of variance. Frame every bad decision as "revolutionary" and ignore VAR/stats if they don\'t support your genius.',
  },
} as const;

export type ToneId = keyof typeof TONE_CONFIG;
export const AVAILABLE_TONES = Object.keys(TONE_CONFIG) as ToneId[];

export const TONES = Object.values(TONE_CONFIG);
