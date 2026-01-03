export interface SquadThresholds {
  mvp: {
    heavyReliance: number; // ~25
    dangerousReliance: number; // ~30
    lowInfluence: number; // ~18
  };
  templateOverlap: {
    contrarian: number; // <15
    low: number; // <20
    medium: number; // <22
    crowded: number; // >30
    follower: number; // >35
  };
  positionDominance: {
    high: number; // >42
  };
  topFour: {
    heavyShare: number; // >65
    strongShare: number; // >55
    lowShare: number; // <48
  };
}

export const SQUAD_THRESHOLDS: SquadThresholds = {
  mvp: {
    heavyReliance: 25,
    dangerousReliance: 30,
    lowInfluence: 18,
  },
  templateOverlap: {
    contrarian: 15,
    low: 20,
    medium: 22,
    crowded: 30,
    follower: 35,
  },
  positionDominance: {
    high: 42,
  },
  topFour: {
    heavyShare: 65,
    strongShare: 55,
    lowShare: 48,
  },
};

export default SQUAD_THRESHOLDS;
