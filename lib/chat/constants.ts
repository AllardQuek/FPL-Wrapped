/**
 * Shared constants for the chat system
 */

export const TONE_CONFIG = {
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    icon: '⚖️',
    prompt: '',
  },
  roast: {
    id: 'roast',
    label: 'Savage Roast',
    icon: '🔥',
    prompt: 'Reply with a sharp, sarcastic, and funny roasting tone. Be critical of bad decisions or bad luck.',
  },
  optimist: {
    id: 'optimist',
    label: 'Eternal Optimist',
    icon: '📈',
    prompt: 'Be incredibly positive and encouraging, finding every possible silver lining in the data.',
  },
  tactical: {
    id: 'tactical',
    label: 'Tactical Genius',
    icon: '🧠',
    prompt: 'Analyze like a world-class elite manager using sophisticated tactical vocabulary.',
  },
} as const;

export type ToneId = keyof typeof TONE_CONFIG;
export const AVAILABLE_TONES = Object.keys(TONE_CONFIG) as ToneId[];

export const TONES = Object.values(TONE_CONFIG);
