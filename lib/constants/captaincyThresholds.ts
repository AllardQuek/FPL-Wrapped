export interface CaptaincyThresholds {
  success: {
    excellent: number;
    good: number;
    mixed: number;
  };
  template: {
    high: number;
    medium: number;
  };
  consistency: {
    high: number;
  };
}

export const CAPTAINCY_THRESHOLDS: CaptaincyThresholds = {
  success: {
    excellent: 80,
    good: 60,
    mixed: 40,
  },
  template: {
    high: 60,
    medium: 50,
  },
  consistency: {
    high: 60,
  },
};
