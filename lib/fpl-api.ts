import {
  FPLBootstrap,
  ManagerInfo,
  ManagerHistory,
  Transfer,
  GameWeekPicks,
  PlayerSummary,
  LiveGameWeek,
  Player,
} from './types';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Cache for bootstrap data (players, teams, gameweeks)
let bootstrapCache: FPLBootstrap | null = null;

/**
 * Fetches data from the FPL API
 * Note: The FPL API has CORS restrictions, so in production
 * you'll need to use a server-side route or proxy
 */
async function fetchFPL<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${FPL_BASE_URL}${endpoint}`, {
    headers: {
      'User-Agent': 'FPL-Wrapped/1.0',
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get bootstrap-static data (all players, teams, gameweeks)
 * This is the main data source and should be cached
 */
export async function getBootstrapData(): Promise<FPLBootstrap> {
  if (bootstrapCache) {
    return bootstrapCache;
  }
  
  bootstrapCache = await fetchFPL<FPLBootstrap>('/bootstrap-static/');
  return bootstrapCache;
}

/**
 * Get manager/entry basic info
 */
export async function getManagerInfo(managerId: number): Promise<ManagerInfo> {
  return fetchFPL<ManagerInfo>(`/entry/${managerId}/`);
}

/**
 * Get manager's gameweek-by-gameweek history
 */
export async function getManagerHistory(managerId: number): Promise<ManagerHistory> {
  return fetchFPL<ManagerHistory>(`/entry/${managerId}/history/`);
}

/**
 * Get all transfers made by a manager
 */
export async function getManagerTransfers(managerId: number): Promise<Transfer[]> {
  return fetchFPL<Transfer[]>(`/entry/${managerId}/transfers/`);
}

/**
 * Get manager's team picks for a specific gameweek
 */
export async function getGameWeekPicks(
  managerId: number,
  gameweek: number
): Promise<GameWeekPicks> {
  return fetchFPL<GameWeekPicks>(`/entry/${managerId}/event/${gameweek}/picks/`);
}

/**
 * Get detailed player history (all gameweeks)
 */
export async function getPlayerSummary(playerId: number): Promise<PlayerSummary> {
  return fetchFPL<PlayerSummary>(`/element-summary/${playerId}/`);
}

/**
 * Get live gameweek data (points for all players in a gameweek)
 */
export async function getLiveGameWeek(gameweek: number): Promise<LiveGameWeek> {
  return fetchFPL<LiveGameWeek>(`/event/${gameweek}/live/`);
}

// Helper functions

/**
 * Get a player by ID from bootstrap data
 */
export async function getPlayerById(playerId: number): Promise<Player | undefined> {
  const bootstrap = await getBootstrapData();
  return bootstrap.elements.find((p) => p.id === playerId);
}

/**
 * Get player name by ID
 */
export async function getPlayerName(playerId: number): Promise<string> {
  const player = await getPlayerById(playerId);
  return player?.web_name ?? 'Unknown';
}

/**
 * Get all finished gameweeks
 */
export async function getFinishedGameweeks(): Promise<number[]> {
  const bootstrap = await getBootstrapData();
  return bootstrap.events
    .filter((e) => e.finished)
    .map((e) => e.id);
}

/**
 * Get the current gameweek number
 */
export async function getCurrentGameweek(): Promise<number> {
  const bootstrap = await getBootstrapData();
  const current = bootstrap.events.find((e) => e.is_current);
  return current?.id ?? 1;
}

/**
 * Fetch all data needed for a manager's wrapped experience
 */
export async function fetchAllManagerData(managerId: number) {
  // Fetch bootstrap data first (cached)
  const bootstrap = await getBootstrapData();
  
  // Fetch manager-specific data in parallel
  const [managerInfo, history, transfers] = await Promise.all([
    getManagerInfo(managerId),
    getManagerHistory(managerId),
    getManagerTransfers(managerId),
  ]);

  // Get finished gameweeks
  const finishedGameweeks = bootstrap.events
    .filter((e) => e.finished)
    .map((e) => e.id);

  // Fetch picks for each finished gameweek
  const picksPromises = finishedGameweeks.map((gw) =>
    getGameWeekPicks(managerId, gw).catch(() => null)
  );
  const allPicks = await Promise.all(picksPromises);
  
  // Create a map of gameweek -> picks
  const picksByGameweek = new Map<number, GameWeekPicks>();
  finishedGameweeks.forEach((gw, index) => {
    const picks = allPicks[index];
    if (picks) {
      picksByGameweek.set(gw, picks);
    }
  });

  // Fetch live data for each finished gameweek (for player points)
  const livePromises = finishedGameweeks.map((gw) =>
    getLiveGameWeek(gw).catch(() => null)
  );
  const allLive = await Promise.all(livePromises);
  
  // Create a map of gameweek -> live data
  const liveByGameweek = new Map<number, LiveGameWeek>();
  finishedGameweeks.forEach((gw, index) => {
    const live = allLive[index];
    if (live) {
      liveByGameweek.set(gw, live);
    }
  });

  return {
    bootstrap,
    managerInfo,
    history,
    transfers,
    picksByGameweek,
    liveByGameweek,
    finishedGameweeks,
  };
}

/**
 * Clear the bootstrap cache (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  bootstrapCache = null;
}



