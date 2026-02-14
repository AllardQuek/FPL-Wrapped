import type { 
  FPLBootstrap, 
  Player, 
  Transfer, 
  GameWeekPicks, 
  LiveGameWeek,
  ManagerInfo
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
    cost: number;
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
  
  // Transform transfers
  const transformedTransfers = gwTransfers.map(t => {
    const playerIn = getPlayer(t.element_in, bootstrap);
    const playerOut = getPlayer(t.element_out, bootstrap);
    return {
      player_in_id: t.element_in,
      player_in_name: playerIn?.web_name || 'Unknown',
      player_out_id: t.element_out,
      player_out_name: playerOut?.web_name || 'Unknown',
      cost: picks.entry_history.event_transfers_cost, // Hit points taken
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
    league_ids: leagueIds,
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
