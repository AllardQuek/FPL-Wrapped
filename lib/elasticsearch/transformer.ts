import type {
  FPLBootstrap,
  Player,
  Transfer,
  GameWeekPicks,
  LiveGameWeek,
  ManagerInfo,
  GameWeekHistory
} from '@/lib/types';

/**
 * Elasticsearch document for a manager's gameweek decisions
 */
export interface GameweekDecisionDocument {
  manager_id: number;
  manager_name: string;
  team_name: string;
  league_ids: number[];
  gameweek: number;
  season: string;
  transfers: Array<{
    player_in_id: number;
    player_in_name: string;
    player_out_id: number;
    player_out_name: string;
    timestamp: string;
  }>;
  captain: {
    player_id: number;
    name: string;
    points: number;
    ownership_percent: number;
    multiplier: number;
  };
  vice_captain: {
    player_id: number;
    name: string;
  };
  bench: Array<{
    player_id: number;
    name: string;
    position_index: number;
    points: number;
    element_type: string;
  }>;
  starters: Array<{
    player_id: number;
    name: string;
    position_index: number;
    points: number;
    element_type: string;
  }>;
  chip_used: string | null;
  // Denormalized fields
  starter_names: string[];
  starter_points: number[];
  starter_element_ids: number[];
  starter_element_types: string[];
  bench_names: string[];
  bench_points: number[];
  bench_element_ids: number[];
  transfer_in_names: string[];
  transfer_out_names: string[];
  transfer_timestamps: string[];
  entry_history?: GameWeekHistory;
  transfer_count: number;
  total_transfer_cost: number;

  gw_points: number;
  gw_rank: number;
  points_on_bench: number;
  bank: number;
  team_value: number;
  '@timestamp': string;
}

/**
 * Get player by ID from bootstrap data
 */
function getPlayer(playerId: number, bootstrap: FPLBootstrap): Player | undefined {
  return bootstrap.elements.find(p => p.id === playerId);
}

/**
 * Get player position string (GKP, DEF, MID, FWD)
 */
function getPlayerPosition(playerId: number, bootstrap: FPLBootstrap): string {
  const player = getPlayer(playerId, bootstrap);
  if (!player) return 'UNK';

  const positionType = bootstrap.element_types.find(t => t.id === player.element_type);
  return positionType?.singular_name_short || 'UNK';
}

/**
 * Get player points for a specific gameweek from live data
 */
function getPlayerPoints(playerId: number, liveGW: LiveGameWeek): number {
  const livePlayer = liveGW.elements.find(e => e.id === playerId);
  return livePlayer?.stats?.total_points || 0;
}

/**
 * Transform FPL data into Elasticsearch gameweek decision document
 */
export function transformToGameweekDecision(
  managerId: number,
  managerInfo: ManagerInfo,
  gameweek: number,
  picks: GameWeekPicks,
  transfers: Transfer[],
  liveGW: LiveGameWeek,
  bootstrap: FPLBootstrap,
  leagueIds: number[] = []
): GameweekDecisionDocument {
  // Ensure league_ids is always an array of unique numbers
  const normalizedLeagueIds = Array.isArray(leagueIds) 
    ? Array.from(new Set(leagueIds.map(id => Number(id))))
    : [Number(leagueIds)];

  // Filter transfers for this specific gameweek
  const gwTransfers = transfers.filter(t => t.event === gameweek);

  // Find captain and vice captain
  const captainPick = picks.picks.find(p => p.is_captain);
  const viceCaptainPick = picks.picks.find(p => p.is_vice_captain);

  // Get captain player data
  const captainPlayer = captainPick ? getPlayer(captainPick.element, bootstrap) : undefined;
  const captainPoints = captainPick ? getPlayerPoints(captainPick.element, liveGW) : 0;

  // Get vice captain player data
  const viceCaptainPlayer = viceCaptainPick ? getPlayer(viceCaptainPick.element, bootstrap) : undefined;

  // Split picks into starters (1-11) and bench (12-15)
  const starters = picks.picks
    .filter(p => p.position <= 11)
    // Ensure picks are ordered by `position` so denormalized arrays (names/points/ids)
    // keep a consistent index mapping to the player's slot (1..11). Without this
    // explicit sort, the API's returned order may differ and cause name/point
    // arrays to be out-of-order relative to expected slot positions.
    .sort((a, b) => a.position - b.position)
    .map(p => {
      const player = getPlayer(p.element, bootstrap);
      return {
        player_id: p.element,
        name: player?.web_name || 'Unknown',
        position_index: p.position,
        points: getPlayerPoints(p.element, liveGW),
        element_type: getPlayerPosition(p.element, bootstrap),
      };
    });

  const bench = picks.picks
    .filter(p => p.position > 11)
    // Sort bench picks by `position` (12..15) to guarantee the denormalized
    // arrays `bench_names`, `bench_points`, `bench_element_ids` have indices
    // corresponding to bench slot order. See test/elasticsearch/benchOrder.test.ts
    // which demonstrates the failure mode when the sort is omitted.
    .sort((a, b) => a.position - b.position)
    .map(p => {
      const player = getPlayer(p.element, bootstrap);
      return {
        player_id: p.element,
        name: player?.web_name || 'Unknown',
        position_index: p.position,
        points: getPlayerPoints(p.element, liveGW),
        element_type: getPlayerPosition(p.element, bootstrap),
      };
    });

  // Calculate total bench points
  const pointsOnBench = bench.reduce((sum, p) => sum + p.points, 0);

  // Build deterministic slot fields for bench so ES single-valued doc-values
  // can be used safely in queries/aggregations. This encodes slots 12..15
  // as explicit single-valued fields like `bench_slot_12_id`,
  // `bench_slot_12_name`, `bench_slot_12_points` and also provides
  // convenient aggregates `bench_pt_1st..4th`, `bench_total`, `bench_max`.
  const benchSlotFields: Record<string, any> = {};
  const benchPoints = bench.map(b => b.points);
  bench.forEach((b, i) => {
    const pos = b.position_index; // expected 12..15
    benchSlotFields[`bench_slot_${pos}_id`] = b.player_id;
    benchSlotFields[`bench_slot_${pos}_name`] = b.name;
    benchSlotFields[`bench_slot_${pos}_points`] = b.points;
  });
  // Add convenience ordered bench_pt_1st..bench_pt_4th (slot 12..15)
  benchSlotFields.bench_pt_1st = benchPoints[0] ?? 0;
  benchSlotFields.bench_pt_2nd = benchPoints[1] ?? 0;
  benchSlotFields.bench_pt_3rd = benchPoints[2] ?? 0;
  benchSlotFields.bench_pt_4th = benchPoints[3] ?? 0;
  benchSlotFields.bench_total = benchPoints.reduce((s, v) => s + (v || 0), 0);
  benchSlotFields.bench_max = benchPoints.length ? Math.max(...benchPoints) : 0;

  // Transform transfers
  const transformedTransfers = gwTransfers.map(t => {
    const playerIn = getPlayer(t.element_in, bootstrap);
    const playerOut = getPlayer(t.element_out, bootstrap);
    return {
      player_in_id: t.element_in,
      player_in_name: playerIn?.web_name || 'Unknown',
      player_out_id: t.element_out,
      player_out_name: playerOut?.web_name || 'Unknown',
      timestamp: t.time,
    };
  });

  // Get current season (format: "25/26")
  const now = new Date();
  const year = now.getFullYear();
  const season = now.getMonth() >= 7 ? `${year % 100}/${(year + 1) % 100}` : `${(year - 1) % 100}/${year % 100}`;

  return {
    manager_id: managerId,
    manager_name: `${managerInfo.player_first_name} ${managerInfo.player_last_name}`.trim(),
    team_name: managerInfo.name,
    league_ids: normalizedLeagueIds,
    gameweek,
    season,
    transfers: transformedTransfers,
    captain: {
      player_id: captainPick?.element || 0,
      name: captainPlayer?.web_name || 'Unknown',
      points: captainPoints,
      ownership_percent: captainPlayer?.selected_by_percent ? parseFloat(captainPlayer.selected_by_percent) : 0,
      multiplier: captainPick?.multiplier || 2,
    },
    vice_captain: {
      player_id: viceCaptainPick?.element || 0,
      name: viceCaptainPlayer?.web_name || 'Unknown',
    },
    bench,
    starters,

    // Denormalized fields
    starter_names: starters.map(s => s.name),
    starter_points: starters.map(s => s.points),
    starter_element_ids: starters.map(s => s.player_id),
    starter_element_types: starters.map(s => s.element_type),

    bench_names: bench.map(b => b.name),
    bench_points: bench.map(b => b.points),
    bench_element_ids: bench.map(b => b.player_id),
    // Deterministic slot fields for query-time access (see benchSlotFields)
    ...benchSlotFields,

    transfer_in_names: transformedTransfers.map(t => t.player_in_name),
    transfer_out_names: transformedTransfers.map(t => t.player_out_name),
    transfer_timestamps: transformedTransfers.map(t => t.timestamp),
    transfer_count: transformedTransfers.length,
    // Use the GW-level event_transfers_cost (points hit) as the canonical total transfer cost
    total_transfer_cost: picks.entry_history?.event_transfers_cost || 0,

    chip_used: picks.active_chip,
    gw_points: picks.entry_history.points,
    gw_rank: picks.entry_history.overall_rank,
    points_on_bench: pointsOnBench,
    bank: picks.entry_history.bank,
    team_value: picks.entry_history.value,
    '@timestamp': new Date().toISOString(),
  };
}

/**
 * Helper to extract transfers for a specific gameweek
 */
export function extractGWTransfers(transfers: Transfer[], gameweek: number): Transfer[] {
  return transfers.filter(t => t.event === gameweek);
}
