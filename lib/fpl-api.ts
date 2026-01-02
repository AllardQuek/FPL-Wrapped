import {
  FPLBootstrap,
  ManagerInfo,
  ManagerHistory,
  Transfer,
  GameWeekPicks,
  PlayerSummary,
  LiveGameWeek,
  Player,
  LeagueStandings,
} from './types';
import fs from 'fs';
import path from 'path';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Cache for bootstrap data (players, teams, gameweeks)
let bootstrapCache: FPLBootstrap | null = null;

// Cache for live gameweek data (shared across managers)
const liveCache = new Map<number, LiveGameWeek>();

// Cache for manager picks (to avoid re-fetching if same manager requested)
const picksCache = new Map<string, GameWeekPicks>();

// Cache for player summaries (shared across managers)
const playerSummaryCache = new Map<number, PlayerSummary>();

/**
 * Simple sleep function for rate limiting
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Save manager data as a JSON mock for testing
 */
async function saveManagerDataMock(managerId: number, data: unknown) {
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
 * Fetches data from the FPL API with simple retry logic
 */
async function fetchFPL<T>(endpoint: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${FPL_BASE_URL}${endpoint}`, {
        headers: {
          'User-Agent': 'FPL-Wrapped/1.0',
        },
        cache: 'no-store',
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000 * (i + 1);
        console.warn(`Rate limited on ${endpoint}. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      const waitTime = 1000 * (i + 1);
      console.warn(`Fetch failed for ${endpoint}. Retrying in ${waitTime}ms... (${i + 1}/${retries})`);
      await sleep(waitTime);
    }
  }
  throw new Error(`Failed to fetch ${endpoint} after ${retries} retries`);
}


/**
 * Get bootstrap-static data (all players, teams, gameweeks).
 *
 * Remarks:
 * - Uses an in-memory cache in production and an optional file cache in development
 *   to speed local dev server restarts.
 * - Prefer this function over calling the endpoint directly so callers benefit
 *   from consistent caching and path stability.
 *
 * @returns The FPL bootstrap payload (players, teams, events, etc.).
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
 * Get basic manager/entry info.
 *
 * This is a thin wrapper over `fetchFPL` that centralizes the endpoint and
 * return type for callers.
 *
 * @param managerId The FPL manager/entry id.
 * @returns ManagerInfo for the given id.
 */
export async function getManagerInfo(managerId: number): Promise<ManagerInfo> {
  return fetchFPL<ManagerInfo>(`/entry/${managerId}/`);
}

/**
 * Get a manager's gameweek-by-gameweek history.
 *
 * Use this wrapper to obtain typed history data; tests should mock this
 * function rather than global fetch for simplicity.
 *
 * @param managerId The FPL manager/entry id.
 * @returns ManagerHistory for the given id.
 */
export async function getManagerHistory(managerId: number): Promise<ManagerHistory> {
  return fetchFPL<ManagerHistory>(`/entry/${managerId}/history/`);
}

/**
 * Get all transfers made by a manager.
 * @param managerId The FPL manager/entry id.
 * @returns Array of transfers for the manager.
 */
export async function getManagerTransfers(managerId: number): Promise<Transfer[]> {
  return fetchFPL<Transfer[]>(`/entry/${managerId}/transfers/`);
}

/**
 * Get league standings (paginated).
 *
 * @param leagueId The league id.
 * @param page Optional page number (defaults to 1).
 * @returns LeagueStandings for the requested page.
 */
export async function getLeagueStandings(
  leagueId: number,
  page: number = 1
): Promise<LeagueStandings> {
  return fetchFPL<LeagueStandings>(`/leagues-classic/${leagueId}/standings/?page_standings=${page}`);
}

/**
 * Get a manager's team picks for a specific gameweek.
 *
 * This wrapper includes an in-memory per-manager+gameweek cache (`picksCache`) to
 * avoid duplicate network requests for the same picks.
 *
 * @param managerId The FPL manager/entry id.
 * @param gameweek The gameweek number.
 * @returns GameWeekPicks for the requested manager and gameweek.
 */
export async function getGameWeekPicks(
  managerId: number,
  gameweek: number
): Promise<GameWeekPicks> {
  const cacheKey = `${managerId}-${gameweek}`;
  if (picksCache.has(cacheKey)) {
    return picksCache.get(cacheKey)!;
  }
  const data = await fetchFPL<GameWeekPicks>(`/entry/${managerId}/event/${gameweek}/picks/`);
  picksCache.set(cacheKey, data);
  return data;
}

/**
 * Get detailed player history (all gameweeks).
 *
 * Uses `playerSummaryCache` to reduce duplicate requests across consumers.
 *
 * @param playerId The FPL player id.
 * @returns PlayerSummary for the given player.
 */
export async function getPlayerSummary(playerId: number): Promise<PlayerSummary> {
  if (playerSummaryCache.has(playerId)) {
    return playerSummaryCache.get(playerId)!;
  }
  const data = await fetchFPL<PlayerSummary>(`/element-summary/${playerId}/`);
  playerSummaryCache.set(playerId, data);
  return data;
}

/**
 * Get live gameweek data (points for all players in a gameweek).
 *
 * Uses `liveCache` to deduplicate requests for the same gameweek.
 *
 * @param gameweek The gameweek number.
 * @returns LiveGameWeek payload for the requested gameweek.
 */
export async function getLiveGameWeek(gameweek: number): Promise<LiveGameWeek> {
  if (liveCache.has(gameweek)) {
    return liveCache.get(gameweek)!;
  }
  const data = await fetchFPL<LiveGameWeek>(`/event/${gameweek}/live/`);
  liveCache.set(gameweek, data);
  return data;
}

// Helper functions

/**
 * Get a player by ID from bootstrap data.
 *
 * @param playerId The FPL player id.
 * @returns The `Player` if found, otherwise `undefined`.
 */
export async function getPlayerById(playerId: number): Promise<Player | undefined> {
  const bootstrap = await getBootstrapData();
  return bootstrap.elements.find((p) => p.id === playerId);
}

/**
 * Get player name by ID.
 *
 * Falls back to `'Unknown'` when player cannot be found.
 *
 * @param playerId The FPL player id.
 * @returns The player's web name or `'Unknown'`.
 */
export async function getPlayerName(playerId: number): Promise<string> {
  const player = await getPlayerById(playerId);
  return player?.web_name ?? 'Unknown';
}

/**
 * Get all finished gameweeks.
 *
 * @returns Array of finished gameweek ids.
 */
export async function getFinishedGameweeks(): Promise<number[]> {
  const bootstrap = await getBootstrapData();
  return bootstrap.events
    .filter((e) => e.finished)
    .map((e) => e.id);
}

/**
 * Get the current gameweek number.
 *
 * @returns The id of the current gameweek, or `1` if not found.
 */
export async function getCurrentGameweek(): Promise<number> {
  const bootstrap = await getBootstrapData();
  const current = bootstrap.events.find((e) => e.is_current);
  return current?.id ?? 1;
}

/**
 * Fetch all data needed for a manager's wrapped experience.
 *
 * This function composes several wrappers (`getManagerInfo`, `getManagerHistory`,
 * `getManagerTransfers`, `getGameWeekPicks`, `getLiveGameWeek`, ...) and performs
 * batched fetching with a small delay to avoid hitting rate limits.
 *
 * @param managerId The FPL manager/entry id.
 * @returns An object containing bootstrap, managerInfo, history, transfers, picks and live data maps.
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

  // Fetch picks and live data for each finished gameweek
  // We use a small batch size and delay to avoid hitting rate limits
  const picksByGameweek = new Map<number, GameWeekPicks>();
  const liveByGameweek = new Map<number, LiveGameWeek>();
  
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 100; // ms

  for (let i = 0; i < finishedGameweeks.length; i += BATCH_SIZE) {
    const batch = finishedGameweeks.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (gw) => {
      try {
        const [picks, live] = await Promise.all([
          getGameWeekPicks(managerId, gw),
          getLiveGameWeek(gw)
        ]);
        picksByGameweek.set(gw, picks);
        liveByGameweek.set(gw, live);
      } catch (error) {
        console.error(`Error fetching data for GW${gw}:`, error);
      }
    }));

    if (i + BATCH_SIZE < finishedGameweeks.length) {
      await sleep(BATCH_DELAY);
    }
  }

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
 * Clear in-memory caches used by this module.
 *
 * Useful for testing or forcing a refresh in long-lived processes.
 */
export function clearCache(): void {
  bootstrapCache = null;
  liveCache.clear();
  picksCache.clear();
  playerSummaryCache.clear();
}



