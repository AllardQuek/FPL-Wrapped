import { describe, it, expect } from 'vitest';
import {
  transformToGameweekDecision,
  extractGWTransfers,
} from '../../lib/elasticsearch/transformer';
import type {
  FPLBootstrap,
  ManagerInfo,
  GameWeekPicks,
  Transfer,
  LiveGameWeek,
} from '../../lib/types';

// ---------------------------------------------------------------------------
// Minimal fixture builders
// ---------------------------------------------------------------------------

function makeBootstrap(players: { id: number; web_name: string; element_type: number; selected_by_percent?: string }[]): FPLBootstrap {
  return {
    events: [],
    game_settings: {} as FPLBootstrap['game_settings'],
    phases: [],
    teams: [],
    total_players: 0,
    elements: players.map(p => ({
      id: p.id,
      web_name: p.web_name,
      element_type: p.element_type,
      selected_by_percent: p.selected_by_percent ?? '10.0',
      // Fill required Player fields with defaults
      chance_of_playing_next_round: null,
      chance_of_playing_this_round: null,
      code: p.id,
      cost_change_event: 0,
      cost_change_event_fall: 0,
      cost_change_start: 0,
      cost_change_start_fall: 0,
      dreamteam_count: 0,
      ep_next: null,
      ep_this: null,
      event_points: 0,
      first_name: p.web_name,
      form: '0.0',
      in_dreamteam: false,
      news: '',
      news_added: null,
      now_cost: 50,
      photo: '',
      points_per_game: '0',
      second_name: '',
      special: false,
      squad_number: null,
      status: 'a',
      team: 1,
      team_code: 1,
      total_points: 0,
      transfers_in: 0,
      transfers_in_event: 0,
      transfers_out: 0,
      transfers_out_event: 0,
      value_form: '0',
      value_season: '0',
      minutes: 0,
      goals_scored: 0,
      assists: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
      bps: 0,
      influence: '0',
      creativity: '0',
      threat: '0',
      ict_index: '0',
      starts: 0,
      expected_goals: '0',
      expected_assists: '0',
      expected_goal_involvements: '0',
      expected_goals_conceded: '0',
      influence_rank: 0,
      influence_rank_type: 0,
      creativity_rank: 0,
      creativity_rank_type: 0,
      threat_rank: 0,
      threat_rank_type: 0,
      ict_index_rank: 0,
      ict_index_rank_type: 0,
      corners_and_indirect_freekicks_order: null,
      corners_and_indirect_freekicks_text: '',
      direct_freekicks_order: null,
      direct_freekicks_text: '',
      penalties_order: null,
      penalties_text: '',
      expected_goals_per_90: 0,
      saves_per_90: 0,
      expected_assists_per_90: 0,
      expected_goal_involvements_per_90: 0,
      expected_goals_conceded_per_90: 0,
      goals_conceded_per_90: 0,
      now_cost_rank: 0,
      now_cost_rank_type: 0,
      form_rank: 0,
      form_rank_type: 0,
      points_per_game_rank: 0,
      points_per_game_rank_type: 0,
      selected_rank: 0,
      selected_rank_type: 0,
      starts_per_90: 0,
      clean_sheets_per_90: 0,
    })),
    element_stats: [],
    element_types: [
      { id: 1, singular_name_short: 'GKP', plural_name: 'Goalkeepers', plural_name_short: 'GKP', singular_name: 'Goalkeeper', squad_select: 2, squad_min_play: 1, squad_max_play: 1, ui_shirt_specific: false, sub_positions_locked: [], element_count: 0 },
      { id: 2, singular_name_short: 'DEF', plural_name: 'Defenders', plural_name_short: 'DEF', singular_name: 'Defender', squad_select: 5, squad_min_play: 3, squad_max_play: 5, ui_shirt_specific: false, sub_positions_locked: [], element_count: 0 },
      { id: 3, singular_name_short: 'MID', plural_name: 'Midfielders', plural_name_short: 'MID', singular_name: 'Midfielder', squad_select: 5, squad_min_play: 2, squad_max_play: 5, ui_shirt_specific: false, sub_positions_locked: [], element_count: 0 },
      { id: 4, singular_name_short: 'FWD', plural_name: 'Forwards', plural_name_short: 'FWD', singular_name: 'Forward', squad_select: 3, squad_min_play: 1, squad_max_play: 3, ui_shirt_specific: false, sub_positions_locked: [], element_count: 0 },
    ],
  };
}

function makeManagerInfo(overrides: Partial<ManagerInfo> = {}): ManagerInfo {
  return {
    id: 123,
    joined_time: '2024-08-01T00:00:00Z',
    started_event: 1,
    favourite_team: null,
    player_first_name: 'John',
    player_last_name: 'Smith',
    player_region_id: 1,
    player_region_name: 'England',
    player_region_iso_code_short: 'GB-ENG',
    player_region_iso_code_long: 'GB-ENG',
    summary_overall_points: 1000,
    summary_overall_rank: 500000,
    summary_event_points: 60,
    summary_event_rank: 100000,
    current_event: 10,
    leagues: { classic: [], h2h: [], cup: { matches: [], status: { qualification_event: null, qualification_numbers: null, qualification_rank: null, qualification_state: null }, cup_league: null }, cup_matches: [] },
    name: 'Johns Team',
    name_change_blocked: false,
    kit: null,
    last_deadline_bank: 10,
    last_deadline_value: 1000,
    last_deadline_total_transfers: 5,
    ...overrides,
  };
}

function makeEntryHistory(overrides: Partial<GameWeekPicks['entry_history']> = {}): GameWeekPicks['entry_history'] {
  return {
    event: 10,
    points: 65,
    total_points: 650,
    rank: 50000,
    rank_sort: 50000,
    overall_rank: 150000,
    bank: 5,
    value: 1010,
    event_transfers: 1,
    event_transfers_cost: 4,
    points_on_bench: 8,
    ...overrides,
  };
}

/**
 * Build a minimal 15-player picks array (11 starters + 4 bench)
 * Player IDs 1–15, with captain=1 and vice-captain=2
 */
function makePicks(chipUsed: string | null = null, entryHistoryOverrides = {}): GameWeekPicks {
  const picks = Array.from({ length: 15 }, (_, i) => ({
    element: i + 1,
    position: i + 1,
    multiplier: i === 0 ? 2 : 1, // captain doubles
    is_captain: i === 0,
    is_vice_captain: i === 1,
  }));

  return {
    active_chip: chipUsed,
    automatic_subs: [],
    entry_history: makeEntryHistory(entryHistoryOverrides),
    picks,
  };
}

/**
 * Build bootstrap with players 1–15 (all MID element_type 3)
 */
function makeDefaultBootstrap(): FPLBootstrap {
  const players = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    web_name: `Player${i + 1}`,
    element_type: 3,
    selected_by_percent: '15.5',
  }));
  return makeBootstrap(players);
}

function makeLiveGW(pointsMap: Record<number, number> = {}): LiveGameWeek {
  const elements: LiveGameWeek['elements'] = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    stats: {
      total_points: pointsMap[i + 1] ?? (i + 1) * 2,
      minutes: 90,
      goals_scored: 0,
      assists: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
      bps: 0,
      influence: '0',
      creativity: '0',
      threat: '0',
      ict_index: '0',
      starts: 1,
      expected_goals: '0',
      expected_assists: '0',
      expected_goal_involvements: '0',
      expected_goals_conceded: '0',
      in_dreamteam: false,
    },
    explain: [],
  }));
  return { elements };
}

function makeTransfers(gameweek: number): Transfer[] {
  return [
    { element_in: 20, element_in_cost: 55, element_out: 5, element_out_cost: 50, entry: 123, event: gameweek, time: '2025-10-07T10:00:00Z' },
    { element_in: 21, element_in_cost: 60, element_out: 6, element_out_cost: 58, entry: 123, event: gameweek, time: '2025-10-07T11:00:00Z' },
    // Transfer from a different gameweek — should be filtered out
    { element_in: 99, element_in_cost: 45, element_out: 7, element_out_cost: 45, entry: 123, event: gameweek - 1, time: '2025-09-30T10:00:00Z' },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transformToGameweekDecision', () => {
  const GW = 10;

  it('sets manager_id and manager_name correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.manager_id).toBe(123);
    expect(doc.manager_name).toBe('John Smith');
  });

  it('sets team_name from managerInfo.name', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.team_name).toBe('Johns Team');
  });

  it('normalises and deduplicates league_ids', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap(), [10, 20, 10]
    );
    expect(doc.league_ids).toEqual([10, 20]);
  });

  it('defaults to empty league_ids when not provided', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.league_ids).toEqual([]);
  });

  it('sets gameweek correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.gameweek).toBe(GW);
  });

  it('produces 11 starters and 4 bench entries', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.starters.length).toBe(11);
    expect(doc.bench.length).toBe(4);
  });

  it('sets starter_names from bootstrap web_name', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.starter_names).toEqual(
      Array.from({ length: 11 }, (_, i) => `Player${i + 1}`)
    );
  });

  it('sets bench_names correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.bench_names).toEqual(['Player12', 'Player13', 'Player14', 'Player15']);
  });

  it('calculates starter_points from liveGW', () => {
    // Default liveGW gives player i points = i*2 (1-indexed)
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.starter_points).toEqual(
      Array.from({ length: 11 }, (_, i) => (i + 1) * 2)
    );
  });

  it('calculates bench_points correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    // players 12-15: 24, 26, 28, 30
    expect(doc.bench_points).toEqual([24, 26, 28, 30]);
  });

  it('sets points_on_bench as sum of bench player points', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.points_on_bench).toBe(24 + 26 + 28 + 30);
  });

  it('identifies captain correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.captain.player_id).toBe(1);
    expect(doc.captain.name).toBe('Player1');
    expect(doc.captain.multiplier).toBe(2);
  });

  it('parses captain ownership_percent from selected_by_percent', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.captain.ownership_percent).toBe(15.5);
  });

  it('identifies vice_captain correctly', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.vice_captain.player_id).toBe(2);
    expect(doc.vice_captain.name).toBe('Player2');
  });

  it('sets chip_used from active_chip', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks('bboost'), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.chip_used).toBe('bboost');
  });

  it('sets chip_used to null when no chip played', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(null), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.chip_used).toBeNull();
  });

  it('only includes transfers for the current gameweek', () => {
    const bootstrap = makeBootstrap([
      ...Array.from({ length: 15 }, (_, i) => ({ id: i + 1, web_name: `Player${i + 1}`, element_type: 3 })),
      { id: 20, web_name: 'TransferIn1', element_type: 3 },
      { id: 21, web_name: 'TransferIn2', element_type: 3 },
    ]);

    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), makeTransfers(GW), makeLiveGW(), bootstrap
    );
    expect(doc.transfers.length).toBe(2);
    expect(doc.transfer_in_names).toEqual(['TransferIn1', 'TransferIn2']);
    expect(doc.transfer_out_names).toEqual(['Player5', 'Player6']);
    expect(doc.transfer_timestamps).toEqual([
      '2025-10-07T10:00:00Z',
      '2025-10-07T11:00:00Z',
    ]);
  });

  it('sets transfer_count equal to number of GW transfers', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), makeTransfers(GW), makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.transfer_count).toBe(2);
  });

  it('derives total_transfer_cost from entry_history.event_transfers_cost', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(null, { event_transfers_cost: 8 }), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.total_transfer_cost).toBe(8);
  });

  it('sets gw_points from entry_history.points', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(null, { points: 72 }), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.gw_points).toBe(72);
  });

  it('sets gw_rank from entry_history.overall_rank', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(null, { overall_rank: 200000 }), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.gw_rank).toBe(200000);
  });

  it('sets bank and team_value from entry_history', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(null, { bank: 12, value: 1050 }), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.bank).toBe(12);
    expect(doc.team_value).toBe(1050);
  });

  it('includes an ISO @timestamp', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc['@timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('falls back to "Unknown" for players not in bootstrap', () => {
    const bootstrap = makeBootstrap([]); // empty elements
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), bootstrap
    );
    expect(doc.starter_names.every(n => n === 'Unknown')).toBe(true);
  });

  it('produces correct element_ids in starter_element_ids', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    expect(doc.starter_element_ids).toEqual(Array.from({ length: 11 }, (_, i) => i + 1));
  });

  it('maps element_type to position string via element_types', () => {
    const doc = transformToGameweekDecision(
      123, makeManagerInfo(), GW, makePicks(), [], makeLiveGW(), makeDefaultBootstrap()
    );
    // All players are element_type 3 = 'MID'
    expect(doc.starter_element_types.every(t => t === 'MID')).toBe(true);
  });
});

describe('extractGWTransfers', () => {
  const transfers: Transfer[] = [
    { element_in: 10, element_in_cost: 55, element_out: 5, element_out_cost: 50, entry: 1, event: 10, time: '2025-10-07T10:00:00Z' },
    { element_in: 11, element_in_cost: 60, element_out: 6, element_out_cost: 58, entry: 1, event: 10, time: '2025-10-07T11:00:00Z' },
    { element_in: 99, element_in_cost: 45, element_out: 7, element_out_cost: 45, entry: 1, event: 9, time: '2025-09-30T10:00:00Z' },
  ];

  it('returns only transfers for the given gameweek', () => {
    const result = extractGWTransfers(transfers, 10);
    expect(result.length).toBe(2);
    expect(result.every(t => t.event === 10)).toBe(true);
  });

  it('returns empty array when no transfers match', () => {
    const result = extractGWTransfers(transfers, 38);
    expect(result).toEqual([]);
  });

  it('returns all matching transfers preserving order', () => {
    const result = extractGWTransfers(transfers, 10);
    expect(result[0].element_in).toBe(10);
    expect(result[1].element_in).toBe(11);
  });

  it('handles empty transfers array', () => {
    expect(extractGWTransfers([], 10)).toEqual([]);
  });
});
