/**
 * FPL Wrapped Metrics System
 * 
 * This file documents all metrics used for persona calculation.
 * Each metric is normalized to a 0-1 scale for consistent scoring.
 */

export interface PersonaMetrics {
    /** Transfer activity level (0-1 scale) */
    activity: number;
    /** Hit-taking frequency (0-1 scale) */
    chaos: number;
    /** Bench points left unused (0-1 scale) */
    overthink: number;
    /** Template overlap percentage (0-1 scale) */
    template: number;
    /** Transfer efficiency/ROI (0-1 scale) */
    efficiency: number;
    /** Captaincy accuracy (0-1 scale) */
    leadership: number;
    /** Budget optimization (0-1 scale) */
    thrift: number;
}

/**
 * Metric Definitions and Calculation Methods
 */
export const METRIC_DEFINITIONS = {
    activity: {
        name: "Transfer Activity",
        description: "How frequently you make transfers throughout the season",
        calculation: "Total transfers ÷ 50",
        interpretation: {
            low: "< 0.3 (Passive, patient approach)",
            medium: "0.3 - 0.7 (Balanced transfer strategy)",
            high: "> 0.7 (Very active, frequent changes)"
        },
        examples: {
            low: "15 transfers = 0.3",
            medium: "30 transfers = 0.6", 
            high: "45 transfers = 0.9"
        }
    },
    
    chaos: {
        name: "Hit Taker",
        description: "How often you take point hits for extra transfers",
        calculation: "Total hits taken ÷ 20",
        interpretation: {
            low: "< 0.2 (Rarely takes hits, patient)",
            medium: "0.2 - 0.5 (Occasional tactical hits)",
            high: "> 0.5 (Frequent hits, aggressive)"
        },
        examples: {
            low: "2 hits = 0.1",
            medium: "6 hits = 0.3",
            high: "15 hits = 0.75"
        }
    },
    
    overthink: {
        name: "Bench Regret",
        description: "Average points left on the bench each week (rotation struggles)",
        calculation: "Average bench points per week ÷ 12",
        interpretation: {
            low: "< 0.3 (Good team selection)",
            medium: "0.3 - 0.6 (Occasional bench regret)",
            high: "> 0.6 (Frequent rotation errors)"
        },
        examples: {
            low: "3 pts/week on bench = 0.25",
            medium: "6 pts/week on bench = 0.5",
            high: "10 pts/week on bench = 0.83"
        }
    },
    
    template: {
        name: "Template Follower",
        description: "How closely your team matches popular ownership",
        calculation: "Template overlap percentage ÷ 100",
        interpretation: {
            low: "< 0.4 (Anti-template, differential heavy)",
            medium: "0.4 - 0.7 (Mix of template and differentials)",
            high: "> 0.7 (Strong template follower)"
        },
        examples: {
            low: "30% template overlap = 0.3",
            medium: "55% template overlap = 0.55",
            high: "85% template overlap = 0.85"
        }
    },
    
    efficiency: {
        name: "Net Transfer Impact",
        description: "Points gained from transfers over their lifetime (PGLT methodology)",
        calculation: "Transfer efficiency score ÷ 15",
        interpretation: {
            low: "< 0.3 (Negative transfer ROI)",
            medium: "0.3 - 0.7 (Neutral to positive ROI)",
            high: "> 0.7 (Excellent transfer success)"
        },
        examples: {
            low: "2.0 PGLT = 0.13 (poor transfers)",
            medium: "8.0 PGLT = 0.53 (decent transfers)",
            high: "12.0 PGLT = 0.80 (elite transfers)"
        }
    },
    
    leadership: {
        name: "Captain Accuracy",
        description: "Percentage of optimal captain points achieved",
        calculation: "Captaincy efficiency ÷ 100",
        interpretation: {
            low: "< 0.5 (Poor captain choices)",
            medium: "0.5 - 0.7 (Decent captain picks)",
            high: "> 0.7 (Elite captaincy)"
        },
        examples: {
            low: "45% efficiency = 0.45",
            medium: "65% efficiency = 0.65",
            high: "85% efficiency = 0.85"
        }
    },
    
    thrift: {
        name: "Budget Optimizer",
        description: "How well you maximize value from budget assets",
        calculation: "(1040 - squad value) ÷ 60",
        interpretation: {
            low: "< 0.3 (High squad value, premium focused)",
            medium: "0.3 - 0.6 (Balanced budget usage)",
            high: "> 0.6 (Budget squad, value hunters)"
        },
        examples: {
            low: "1025 squad value = 0.25",
            medium: "1005 squad value = 0.58",
            high: "985 squad value = 0.92"
        }
    }
};

/**
 * Helper function to get metric explanation for UI tooltips
 */
export function getMetricExplanation(metricKey: keyof PersonaMetrics): {
    name: string;
    description: string;
    calculation: string;
    interpretation: Record<string, string>;
} {
    return METRIC_DEFINITIONS[metricKey];
}

/**
 * Helper function to interpret a metric value
 */
export function interpretMetricValue(
    metricKey: keyof PersonaMetrics,
    value: number
): 'low' | 'medium' | 'high' {
    // Standard thresholds for most metrics
    const lowThreshold = 0.3;
    const highThreshold = 0.6;
    
    // Special case for template (different thresholds)
    if (metricKey === 'template') {
        if (value < 0.4) return 'low';
        if (value > 0.7) return 'high';
        return 'medium';
    }
    
    if (value < lowThreshold) return 'low';
    if (value > highThreshold) return 'high';
    return 'medium';
}

/**
 * Format a metric value for display
 */
export function formatMetricValue(metricKey: keyof PersonaMetrics, value: number): string {
    const percentage = Math.round(value * 100);
    
    switch (metricKey) {
        case 'activity':
            return `${percentage}% active`;
        case 'chaos':
            return `${percentage}% chaos`;
        case 'overthink':
            return `${percentage}% bench regret`;
        case 'template':
            return `${percentage}% template`;
        case 'efficiency':
            return `${percentage}% efficient`;
        case 'leadership':
            return `${percentage}% captain accuracy`;
        case 'thrift':
            return `${percentage}% thrifty`;
        default:
            return `${percentage}%`;
    }
}
