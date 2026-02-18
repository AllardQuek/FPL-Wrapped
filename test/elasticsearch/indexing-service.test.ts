/**
 * Tests for lib/elasticsearch/indexing-service.ts
 *
 * All external dependencies are mocked:
 *   - ./client        → getESClient
 *   - ./transformer   → transformToGameweekDecision
 *   - ../fpl-api      → six FPL fetch functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (declared before importing the module under test)
// ---------------------------------------------------------------------------

const mockUpdate = vi.fn().mockResolvedValue({});

const mockGetESClient = vi.fn().mockReturnValue({
  update: mockUpdate,
});

vi.mock('../../lib/elasticsearch/client', () => ({
  getESClient: mockGetESClient,
}));

const mockTransform = vi.fn().mockImplementation((_managerId, _info, _gw, _picks, _transfers, _live, _bootstrap, leagueIds = []) => ({
  manager_id: 1,
  manager_name: 'Test Manager',
  team_name: 'Test FC',
  league_ids: Array.from(new Set((leagueIds as number[]).map(Number))),
  gameweek: 1,
  season: '25/26',
  transfers: [],
  captain: { player_id: 10, name: 'Captain', points: 12, ownership_percent: 20, multiplier: 2 },
  vice_captain: { player_id: 11, name: 'Vice', },
  bench: [],
  starters: [],
  chip_used: null,
  starter_names: [], starter_points: [], starter_element_ids: [], starter_element_types: [],
  bench_names: [], bench_points: [], bench_element_ids: [],
  transfer_in_names: [], transfer_out_names: [], transfer_timestamps: [],
  transfer_count: 0, total_transfer_cost: 0,
  gw_points: 60, gw_rank: 100000, points_on_bench: 5, bank: 10, team_value: 1000,
  '@timestamp': '2025-10-07T10:00:00Z',
}));

vi.mock('../../lib/elasticsearch/transformer', () => ({
  transformToGameweekDecision: mockTransform,
}));

const mockGetBootstrapData = vi.fn();
const mockGetGameWeekPicks = vi.fn();
const mockGetLiveGameWeek = vi.fn();
const mockGetManagerInfo = vi.fn();
const mockGetManagerTransfers = vi.fn();
const mockGetLeagueStandings = vi.fn();

vi.mock('../../lib/fpl-api', () => ({
  getBootstrapData: mockGetBootstrapData,
  getGameWeekPicks: mockGetGameWeekPicks,
  getLiveGameWeek: mockGetLiveGameWeek,
  getManagerInfo: mockGetManagerInfo,
  getManagerTransfers: mockGetManagerTransfers,
  getLeagueStandings: mockGetLeagueStandings,
}));

// ---------------------------------------------------------------------------
// Import module under test after mocks are wired
// ---------------------------------------------------------------------------
const {
  indexManagerGameweek,
  indexManagerAllGameweeks,
  indexLeagueAllGameweeks,
} = await import('../../lib/elasticsearch/indexing-service');

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

function makeBootstrapFixture(currentGW = 3) {
  return {
    events: [
      { id: 1, is_current: false, is_next: false, finished: true },
      { id: 2, is_current: false, is_next: false, finished: true },
      { id: currentGW, is_current: true, is_next: false, finished: false },
    ],
  };
}

function makeManagerInfoFixture() {
  return { id: 1, name: 'Test FC', player_first_name: 'Test', player_last_name: 'Manager' };
}

function makePicksFixture() {
  return { active_chip: null, automatic_subs: [], picks: [], entry_history: { event: 1, points: 60, total_points: 600, rank: 50000, rank_sort: 50000, overall_rank: 100000, bank: 10, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 5 } };
}

function makeLeagueStandingsFixture() {
  return {
    standings: {
      results: [
        { entry: 1, player_name: 'Alice' },
        { entry: 2, player_name: 'Bob' },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests: indexManagerGameweek
// ---------------------------------------------------------------------------

describe('indexManagerGameweek', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBootstrapData.mockResolvedValue({});
    mockGetManagerInfo.mockResolvedValue(makeManagerInfoFixture());
    mockGetGameWeekPicks.mockResolvedValue(makePicksFixture());
    mockGetManagerTransfers.mockResolvedValue([]);
    mockGetLiveGameWeek.mockResolvedValue({ elements: [] });
    mockUpdate.mockResolvedValue({});
    mockGetESClient.mockReturnValue({ update: mockUpdate });
  });

  it('returns true on success', async () => {
    const result = await indexManagerGameweek(1, 1);
    expect(result).toBe(true);
  });

  it('calls es.update() with the correct index and document ID', async () => {
    await indexManagerGameweek(42, 7);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const [args] = mockUpdate.mock.calls[0];
    expect(args.id).toBe('42-gw7');
    expect(args.index).toBe(process.env.ELASTICSEARCH_INDEX_NAME ?? 'fpl-gameweek-decisions');
  });

  it('returns false when getESClient() returns null', async () => {
    mockGetESClient.mockReturnValue(null);
    const result = await indexManagerGameweek(1, 1);
    expect(result).toBe(false);
  });

  it('returns false when getManagerInfo throws', async () => {
    mockGetManagerInfo.mockRejectedValue(new Error('FPL API down'));
    const result = await indexManagerGameweek(1, 1);
    expect(result).toBe(false);
  });

  it('returns false when es.update() throws', async () => {
    mockUpdate.mockRejectedValue(new Error('ES write failed'));
    const result = await indexManagerGameweek(1, 1);
    expect(result).toBe(false);
  });

  it('passes leagueIds through to the ES update params', async () => {
    await indexManagerGameweek(1, 1, [100, 200]);
    const [args] = mockUpdate.mock.calls[0];
    // The script params.ids should contain the league IDs
    expect(args.script.params.ids).toEqual(expect.arrayContaining([100, 200]));
  });

  it('deduplicates leagueIds', async () => {
    await indexManagerGameweek(1, 1, [100, 100, 200]);
    const [args] = mockUpdate.mock.calls[0];
    expect(args.script.params.ids).toEqual([100, 200]);
  });
});

// ---------------------------------------------------------------------------
// Tests: indexManagerAllGameweeks
// ---------------------------------------------------------------------------

describe('indexManagerAllGameweeks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBootstrapData.mockResolvedValue(makeBootstrapFixture(3));
    mockGetManagerInfo.mockResolvedValue(makeManagerInfoFixture());
    mockGetGameWeekPicks.mockResolvedValue(makePicksFixture());
    mockGetManagerTransfers.mockResolvedValue([]);
    mockGetLiveGameWeek.mockResolvedValue({ elements: [] });
    mockUpdate.mockResolvedValue({});
    mockGetESClient.mockReturnValue({ update: mockUpdate });
  });

  it('returns success count equal to number of completed gameweeks', async () => {
    // fromGW=1, bootstrap says current GW=3 (both 1 and 2 are finished, 3 is current)
    // All three GWs should be indexed when toGW is not passed
    const result = await indexManagerAllGameweeks(1, 1);
    expect(result.success).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('respects fromGW parameter', async () => {
    const result = await indexManagerAllGameweeks(1, 2);
    // GW 2 and 3 only
    expect(result.success).toBe(2);
  });

  it('skips gameweeks that are not finished and not current', async () => {
    mockGetBootstrapData.mockResolvedValue({
      events: [
        { id: 1, is_current: true, is_next: false, finished: false },
        { id: 2, is_current: false, is_next: true, finished: false },
      ],
    });

    // fromGW=1 toGW=2: GW1 is current (indexed), GW2 is not started (skipped)
    const result = await indexManagerAllGameweeks(1, 1, 2);
    expect(result.success).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('counts a failed GW when indexManagerGameweek returns false', async () => {
    // Make ES fail for all calls
    mockUpdate.mockRejectedValue(new Error('fail'));
    const result = await indexManagerAllGameweeks(1, 1);
    expect(result.failed).toBeGreaterThan(0);
    expect(result.success).toBe(0);
  });

  it('returns { success:0, failed:1, skipped:0 } when getBootstrapData throws', async () => {
    mockGetBootstrapData.mockRejectedValue(new Error('FPL offline'));
    const result = await indexManagerAllGameweeks(1, 1);
    expect(result).toEqual({ success: 0, failed: 1, skipped: 0 });
  });

  it('calls onProgress callback for each gameweek', async () => {
    const onProgress = vi.fn();
    await indexManagerAllGameweeks(1, 1, undefined, onProgress);
    // At least one progress call per GW
    expect(onProgress).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: indexLeagueAllGameweeks
// ---------------------------------------------------------------------------

describe('indexLeagueAllGameweeks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeagueStandings.mockResolvedValue(makeLeagueStandingsFixture());
    mockGetBootstrapData.mockResolvedValue(makeBootstrapFixture(2));
    mockGetManagerInfo.mockResolvedValue(makeManagerInfoFixture());
    mockGetGameWeekPicks.mockResolvedValue(makePicksFixture());
    mockGetManagerTransfers.mockResolvedValue([]);
    mockGetLiveGameWeek.mockResolvedValue({ elements: [] });
    mockUpdate.mockResolvedValue({});
    mockGetESClient.mockReturnValue({ update: mockUpdate });
  });

  it('processes all managers in the league', async () => {
    const result = await indexLeagueAllGameweeks(999, 1);
    expect(result.managersProcessed).toBe(2);
  });

  it('accumulates total success across managers', async () => {
    // 2 managers × 2 GWs each = 4 successful
    const result = await indexLeagueAllGameweeks(999, 1);
    expect(result.totalSuccess).toBe(4);
    expect(result.totalFailed).toBe(0);
  });

  it('calls getLeagueStandings with the league ID', async () => {
    await indexLeagueAllGameweeks(777, 1);
    expect(mockGetLeagueStandings).toHaveBeenCalledWith(777, 1);
  });

  it('throws when getLeagueStandings fails', async () => {
    mockGetLeagueStandings.mockRejectedValue(new Error('league not found'));
    await expect(indexLeagueAllGameweeks(999, 1)).rejects.toThrow('league not found');
  });

  it('calls onProgress for each manager', async () => {
    const onProgress = vi.fn();
    await indexLeagueAllGameweeks(999, 1, undefined, onProgress);
    const managerProgressCalls = onProgress.mock.calls.filter(
      ([p]) => p.type === 'manager'
    );
    expect(managerProgressCalls.length).toBe(2);
  });
});
