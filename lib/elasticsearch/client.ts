import { Client } from '@elastic/elasticsearch';
import { FEATURES } from '@/lib/config/features';

let esClient: Client | null = null;
let connectionAttempted = false;
let lastConnectionError: Error | null = null;

/**
 * Get Elasticsearch client instance (singleton)
 * Returns null if ES is disabled or connection fails
 * 
 * @returns Elasticsearch client or null
 */
export function getESClient(): Client | null {
  // If ES is disabled, return null immediately
  if (!FEATURES.ELASTICSEARCH_ENABLED) {
    return null;
  }
  
  // Return existing client if already initialized
  if (esClient) {
    return esClient;
  }
  
  // If we already tried and failed, don't retry every call
  if (connectionAttempted && !esClient) {
    console.warn('Elasticsearch connection previously failed, skipping retry');
    return null;
  }
  
  // Validate configuration
  const esUrl = process.env.ELASTICSEARCH_URL;
  const esApiKey = process.env.ELASTICSEARCH_API_KEY;
  
  if (!esUrl || !esApiKey) {
    console.warn('Elasticsearch credentials not configured. Set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY.');
    connectionAttempted = true;
    return null;
  }
  
  try {
    // Initialize client
    esClient = new Client({
      node: esUrl,
      auth: {
        apiKey: esApiKey,
      },
      // Reasonable timeouts
      requestTimeout: 10000,
      maxRetries: 2,
    });
    
    connectionAttempted = true;
    console.log('✅ Elasticsearch client initialized');
    return esClient;
  } catch (error) {
    console.error('Failed to initialize Elasticsearch client:', error);
    lastConnectionError = error as Error;
    connectionAttempted = true;
    return null;
  }
}

/**
 * Check if Elasticsearch is available and healthy
 * Non-blocking check - returns false on any error
 */
export async function isESHealthy(): Promise<boolean> {
  const client = getESClient();
  if (!client) return false;
  
  try {
    const health = await client.cluster.health({ timeout: '5s' });
    return health.status === 'green' || health.status === 'yellow';
  } catch (error) {
    console.error('ES health check failed:', error);
    return false;
  }
}

/**
 * Quick check if ES is available (doesn't make network call)
 */
export function isESAvailable(): boolean {
  return FEATURES.ELASTICSEARCH_ENABLED && getESClient() !== null;
}

/**
 * Get connection info (for debugging/health endpoints)
 */
export async function getESInfo() {
  const client = getESClient();
  if (!client) {
    return {
      available: false,
      error: lastConnectionError?.message || 'Elasticsearch not enabled or configured',
    };
  }
  
  try {
    const info = await client.info();
    return {
      available: true,
      version: info.version.number,
      cluster_name: info.cluster_name,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close ES connection (for cleanup in tests or shutdown)
 */
export async function closeESClient() {
  if (esClient) {
    await esClient.close();
    esClient = null;
    connectionAttempted = false;
  }
}
