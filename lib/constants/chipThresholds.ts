export interface BenchBoostThresholds {
  excellentPoints: number;
  decentPoints: number;
  excellentDiff: number; // diff vs avg
  decentDiff: number;
}

export interface TripleCaptainThresholds {
  elitePoints: number; // mapped to 'excellent'
  solidPoints: number; // mapped to 'decent'
}

export interface FreeHitThresholds {
  clutchPoints: number; // mapped to 'excellent'
}

export interface WildcardThresholds {
  transformedPoints: number; // mapped to 'excellent'
}

export const CHIP_THRESHOLDS = {
  bboost: {
    excellentPoints: 15,
    decentPoints: 5,
    excellentDiff: 10,
    decentDiff: 3,
  } as BenchBoostThresholds,

  '3xc': {
    elitePoints: 12,
    solidPoints: 4,
  } as TripleCaptainThresholds,

  freehit: {
    clutchPoints: 10,
  } as FreeHitThresholds,

  wildcard: {
    transformedPoints: 5,
  } as WildcardThresholds,
};

export type VerdictTier = 'excellent' | 'decent' | 'wasted';
export type ChipName = 'bboost' | '3xc' | 'freehit' | 'wildcard';

export const CHIP_VERDICT_LABELS: Record<ChipName, Record<VerdictTier, string>> = {
  bboost: {
    excellent: 'Masterstroke',
    decent: 'Decent',
    wasted: 'Wasted'
  },
  '3xc': {
    excellent: 'Elite Timing',
    decent: 'Solid',
    wasted: 'Unfortunate'
  },
  freehit: {
    excellent: 'Clutch',
    decent: 'Effective',
    wasted: 'Backfired'
  },
  wildcard: {
    excellent: 'Transformed',
    decent: 'Improved',
    wasted: 'Tough Run'
  }
};

export const CHIP_NAMES = {
  BBOOST: 'bboost' as ChipName,
  THREE_XC: '3xc' as ChipName,
  FREEHIT: 'freehit' as ChipName,
  WILDCARD: 'wildcard' as ChipName,
} as const;

export function getVerdictLabel(chipName: ChipName, tier?: VerdictTier): string | undefined {
  if (!tier) return undefined;
  if (!Object.prototype.hasOwnProperty.call(CHIP_VERDICT_LABELS, chipName)) return undefined;
  return CHIP_VERDICT_LABELS[chipName][tier];
}

export function determineChipVerdictTier(chipName: ChipName, ctx: { points: number; diff?: number }): VerdictTier {
  switch (chipName) {
    case 'bboost': {
      const t = CHIP_THRESHOLDS.bboost;
      const points = ctx.points;
      const diff = ctx.diff ?? Number.NEGATIVE_INFINITY;
      if (points >= t.excellentPoints || diff >= t.excellentDiff) return 'excellent';
      if (points >= t.decentPoints || diff >= t.decentDiff) return 'decent';
      return 'wasted';
    }
    case '3xc': {
      const t = CHIP_THRESHOLDS['3xc'];
      const points = ctx.points;
      if (points >= t.elitePoints) return 'excellent';
      if (points >= t.solidPoints) return 'decent';
      return 'wasted';
    }
    case 'freehit': {
      const t = CHIP_THRESHOLDS.freehit;
      const points = ctx.points;
      if (points >= t.clutchPoints) return 'excellent';
      if (points > 0) return 'decent';
      return 'wasted';
    }
    case 'wildcard': {
      const t = CHIP_THRESHOLDS.wildcard;
      const points = ctx.points;
      if (points >= t.transformedPoints) return 'excellent';
      if (points >= 0) return 'decent';
      return 'wasted';
    }
    default:
      return 'wasted';
  }
}
