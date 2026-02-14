/**
 * Feature flags for optional Elasticsearch-powered features
 * 
 * All ES features are disabled by default and require explicit opt-in
 * via environment variables. This allows safe testing during trial period.
 */

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
   * Enable conversational queries with manager data
   * Requires ELASTICSEARCH_ENABLED to be true
   */
  CONVERSATIONAL_QUERIES: process.env.ENABLE_CONVERSATIONAL_QUERIES === 'true',
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
      conversationalQueries: FEATURES.CONVERSATIONAL_QUERIES,
    },
  };
}
