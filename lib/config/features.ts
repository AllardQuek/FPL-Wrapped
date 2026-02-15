/**
 * Feature flags for optional Elasticsearch-powered features
 * 
 * All ES features are disabled by default and require explicit opt-in
 * via environment variables. This allows safe testing during trial period.
 */

// Load .env.local for Node.js scripts (Next.js handles this automatically)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolve } = require('path');
    dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  } catch (e) {
    // dotenv not available, skip (Next.js context), console log error
    console.warn('Could not load .env.local, make sure to create it with the necessary variables. Error:', e);
    
  }
}

export const FEATURES = {
  /**
   * Master switch for Elasticsearch functionality
   * When false, all ES features are disabled and app works as before
   */
  ELASTICSEARCH_ENABLED: process.env.ENABLE_ELASTICSEARCH === 'true',
  
  /**
   * Enable mini-league gameweek reports
   * Requires ELASTICSEARCH_ENABLED to be true
   */
  MINI_LEAGUE_REPORTS: process.env.ENABLE_MINI_LEAGUE_REPORTS === 'true',
  
  /**
   * Enable chat interface with FPL data (Elastic Agent Builder)
   * Requires ELASTICSEARCH_ENABLED to be true and ELASTIC_AGENT_ID configured
   */
  CHAT: process.env.ENABLE_CHAT === 'true',
} as const;

export type FeatureName = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return FEATURES[feature] === true;
}

/**
 * Require a feature to be enabled, throw error if not
 * Use this in API routes to enforce feature flags
 */
export function requireFeature(feature: FeatureName): void {
  if (!FEATURES[feature]) {
    throw new Error(`Feature "${feature}" is not enabled. Check environment variables.`);
  }
}

/**
 * Get user-friendly status of all features
 */
export function getFeatureStatus() {
  return {
    elasticsearch: {
      enabled: FEATURES.ELASTICSEARCH_ENABLED,
      configured: !!(process.env.ELASTICSEARCH_URL && process.env.ELASTICSEARCH_API_KEY),
    },
    features: {
      miniLeagueReports: FEATURES.MINI_LEAGUE_REPORTS,
      chat: FEATURES.CHAT,
    },
  };
}
