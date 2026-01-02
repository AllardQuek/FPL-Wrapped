import { CHIP_NAMES, type ChipName } from '@/lib/constants/chipThresholds';

export const chipLabels: Record<ChipName, string> = {
    [CHIP_NAMES.THREE_XC]: 'Triple Captain',
    [CHIP_NAMES.BBOOST]: 'Bench Boost',
    [CHIP_NAMES.FREEHIT]: 'Free Hit',
    [CHIP_NAMES.WILDCARD]: 'Wildcard'
} as Record<ChipName, string>;

export const chipEmojis: Record<ChipName, string> = {
    [CHIP_NAMES.THREE_XC]: '🚀',
    [CHIP_NAMES.BBOOST]: '🪑',
    [CHIP_NAMES.FREEHIT]: '🪄',
    [CHIP_NAMES.WILDCARD]: '🃏'
} as Record<ChipName, string>;
