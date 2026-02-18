/**
 * Tests for lib/elasticsearch/client.ts
 *
 * client.ts uses module-level singletons (esClient, connectionAttempted).
 * Each test that needs a particular initialisation state must:
 *   1. Set env vars
 *   2. Call vi.resetModules()   — inline in the test body
 *   3. Call vi.doMock(...)      — inline in the test body
 *   4. await import('...')      — get the fresh module
 *
 * vi.doMock calls placed inside helper functions are not reliably intercepted
 * by Vitest's module registry between resetModules calls, so we keep the
 * mock setup inline per test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared env-var helpers
// ---------------------------------------------------------------------------

const VALID_URL = 'https://es.example.com';
const VALID_KEY = 'test-key';

function setValidEnv() {
  process.env.ELASTICSEARCH_URL = VALID_URL;
  process.env.ELASTICSEARCH_API_KEY = VALID_KEY;
}
function clearESEnv() {
  delete process.env.ELASTICSEARCH_URL;
  delete process.env.ELASTICSEARCH_API_KEY;
}

/** Minimal @elastic/elasticsearch mock factory — synchronous Client constructor */
function makeESMock() {
  return {
    Client: vi.fn().mockImplementation(function() {
      return {
        close: vi.fn().mockResolvedValue(undefined),
        cluster: {
          health: vi.fn().mockResolvedValue({ status: 'green' }),
        },
        info: vi.fn().mockResolvedValue({ version: { number: '8.0.0' }, cluster_name: 'test-cluster' }),
      };
    }),
  };
}

/** Features mock factory */
function makeFeaturesMock(esEnabled: boolean) {
  return {
    FEATURES: { ELASTICSEARCH_ENABLED: esEnabled, MINI_LEAGUE_REPORTS: false, CHAT: false },
    isFeatureEnabled: (f: string) => f === 'ELASTICSEARCH_ENABLED' ? esEnabled : false,
    requireFeature: vi.fn(),
    getFeatureStatus: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getESClient', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns null when ELASTICSEARCH_ENABLED is false', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(false));
    vi.doMock('@elastic/elasticsearch', makeESMock);
    const { getESClient } = await import('../../lib/elasticsearch/client');
    expect(getESClient()).toBeNull();
  });

  it('returns null when ELASTICSEARCH_URL is missing', async () => {
    delete process.env.ELASTICSEARCH_URL;
    process.env.ELASTICSEARCH_API_KEY = VALID_KEY;
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    const { getESClient } = await import('../../lib/elasticsearch/client');
    expect(getESClient()).toBeNull();
  });

  it('returns null when ELASTICSEARCH_API_KEY is missing', async () => {
    process.env.ELASTICSEARCH_URL = VALID_URL;
    delete process.env.ELASTICSEARCH_API_KEY;
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    const { getESClient } = await import('../../lib/elasticsearch/client');
    expect(getESClient()).toBeNull();
  });

  it('returns a client instance when credentials are present and feature is enabled', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', makeESMock);
    const { getESClient } = await import('../../lib/elasticsearch/client');
    expect(getESClient()).not.toBeNull();
  });

  it('returns the same instance on repeated calls (singleton)', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', makeESMock);
    const { getESClient } = await import('../../lib/elasticsearch/client');
    const first = getESClient();
    const second = getESClient();
    expect(first).toBe(second);
  });

  it('does not retry after a failed initialisation', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() { throw new Error('init failed'); }),
    }));
    const { getESClient } = await import('../../lib/elasticsearch/client');
    expect(getESClient()).toBeNull();
    expect(getESClient()).toBeNull();
  });
});

describe('isESAvailable', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns false when client is null (feature disabled)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(false));
    const { isESAvailable } = await import('../../lib/elasticsearch/client');
    expect(isESAvailable()).toBe(false);
  });

  it('returns false when credentials are missing', async () => {
    clearESEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    const { isESAvailable } = await import('../../lib/elasticsearch/client');
    expect(isESAvailable()).toBe(false);
  });

  it('returns true when a client was successfully created', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', makeESMock);
    const { isESAvailable, getESClient } = await import('../../lib/elasticsearch/client');
    getESClient(); // trigger singleton init
    expect(isESAvailable()).toBe(true);
  });
});

describe('isESHealthy', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns false when no client available', async () => {
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(false));
    const { isESHealthy } = await import('../../lib/elasticsearch/client');
    expect(await isESHealthy()).toBe(false);
  });

  it('returns true when cluster status is green', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), cluster: { health: vi.fn().mockResolvedValue({ status: 'green' }) } };
      }),
    }));
    const { isESHealthy } = await import('../../lib/elasticsearch/client');
    expect(await isESHealthy()).toBe(true);
  });

  it('returns true when cluster status is yellow', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), cluster: { health: vi.fn().mockResolvedValue({ status: 'yellow' }) } };
      }),
    }));
    const { isESHealthy } = await import('../../lib/elasticsearch/client');
    expect(await isESHealthy()).toBe(true);
  });

  it('returns false when cluster status is red', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), cluster: { health: vi.fn().mockResolvedValue({ status: 'red' }) } };
      }),
    }));
    const { isESHealthy } = await import('../../lib/elasticsearch/client');
    expect(await isESHealthy()).toBe(false);
  });

  it('returns false when cluster.health() throws', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), cluster: { health: vi.fn().mockRejectedValue(new Error('network error')) } };
      }),
    }));
    const { isESHealthy } = await import('../../lib/elasticsearch/client');
    expect(await isESHealthy()).toBe(false);
  });
});

describe('getESInfo', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns available:false when no client', async () => {
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(false));
    const { getESInfo } = await import('../../lib/elasticsearch/client');
    const result = await getESInfo();
    expect(result.available).toBe(false);
  });

  it('returns version and cluster_name when client is healthy', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), info: vi.fn().mockResolvedValue({ version: { number: '8.0.0' }, cluster_name: 'my-cluster' }) };
      }),
    }));
    const { getESInfo } = await import('../../lib/elasticsearch/client');
    const result = await getESInfo();
    expect(result.available).toBe(true);
    expect((result as { version: string }).version).toBe('8.0.0');
    expect((result as { cluster_name: string }).cluster_name).toBe('my-cluster');
  });

  it('returns available:false with error message when info() throws', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: vi.fn(), info: vi.fn().mockRejectedValue(new Error('connection refused')) };
      }),
    }));
    const { getESInfo } = await import('../../lib/elasticsearch/client');
    const result = await getESInfo();
    expect(result.available).toBe(false);
    expect((result as { error: string }).error).toContain('connection refused');
  });
});

describe('closeESClient', () => {
  afterEach(() => {
    clearESEnv();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('calls client.close() and resets singleton state', async () => {
    setValidEnv();
    vi.resetModules();
    vi.doMock('@/lib/config/features', () => makeFeaturesMock(true));
    const mockClose = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@elastic/elasticsearch', () => ({
      Client: vi.fn().mockImplementation(function() {
        return { close: mockClose, cluster: { health: vi.fn().mockResolvedValue({ status: 'green' }) } };
      }),
    }));
    const { getESClient, closeESClient } = await import('../../lib/elasticsearch/client');
    getESClient(); // init singleton
    await closeESClient();
    expect(mockClose).toHaveBeenCalledOnce();
    // After close the singleton is reset, so getESClient re-initialises
    const afterClose = getESClient();
    expect(afterClose).not.toBeNull();
  });
});
