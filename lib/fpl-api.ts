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
import fs from 'fs';
import path from 'path';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Cache for bootstrap data (players, teams, gameweeks)
let bootstrapCache: FPLBootstrap | null = null;

/**
 * Save manager data as a JSON mock for testing
 */
async function saveManagerDataMock(managerId: number, data: any) {
  try {
    const mockPath = path.join(process.cwd(), '.cache', `manager-${managerId}.json`);

    // Safely serialize Maps
    const serializedData = JSON.stringify(data, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }, 2);

    fs.writeFileSync(mockPath, serializedData);
    console.log(`Saved mock data to ${mockPath}`);
  } catch (error) {
    console.error('Failed to save mock data:', error);
  }
}

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
    cache: 'no-store', // Disable caching to avoid 2MB limit error
  });

  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}


/**
 * Get bootstrap-static data (all players, teams, gameweeks)
 * Uses a local file cache to bypass Next.js 2MB Data Cache limit
 * and persist data across dev server restarts.
 */
export async function getBootstrapData(): Promise<FPLBootstrap> {
  // 1. Try In-Memory Cache (Fastest - Works in Prod & Dev)
  if (bootstrapCache) {
    return bootstrapCache;
  }

  // 2. Try File System Cache (Dev Only)
  // Vercel/Production file systems are read-only except for /tmp, 
  // so we stick to memory cache for simplicity and scale there.
  const isDev = process.env.NODE_ENV === 'development';
  const cacheDir = path.join(process.cwd(), '.cache');
  const cacheFile = path.join(cacheDir, 'fpl-bootstrap.json');

  if (isDev) {
    try {
      if (fs.existsSync(cacheFile)) {
        const fileStat = fs.statSync(cacheFile);
        const now = Date.now();
        const age = now - fileStat.mtimeMs;

        // Cache valid for 1 hour (3600000ms)
        if (age < 3600000) {
          const fileContent = fs.readFileSync(cacheFile, 'utf-8');
          bootstrapCache = JSON.parse(fileContent);
          return bootstrapCache!;
        }
      }
    } catch (error) {
      console.error('Error reading bootstrap cache:', error);
    }
  }

  // 3. Fetch from API (Fallback)
  bootstrapCache = await fetchFPL<FPLBootstrap>('/bootstrap-static/');

  // 4. Save to File System (Dev Only)
  if (isDev) {
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, JSON.stringify(bootstrapCache));
    } catch (error) {
      console.error('Error saving bootstrap cache:', error);
    }
  }
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

  const result = {
    bootstrap,
    managerInfo,
    history,
    transfers,
    picksByGameweek,
    liveByGameweek,
    finishedGameweeks,
  };

  // Save mock data for local testing
  if (process.env.NODE_ENV === 'development') {
    saveManagerDataMock(managerId, result);
  }

  return result;
}

/**
 * Clear the bootstrap cache (useful for testing or forcing refresh)
 */
export function clearCache(): void {
  bootstrapCache = null;
}



