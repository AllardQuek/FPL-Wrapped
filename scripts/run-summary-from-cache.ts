import fs from 'fs';
import path from 'path';

import { generateSeasonSummary } from '../lib/analysis/summary';
import { ManagerData } from '../lib/analysis/types';

async function main() {
  const managerId = 495371;
  const cacheFile = path.join(process.cwd(), '.cache', `manager-${managerId}.json`);

  if (!fs.existsSync(cacheFile)) {
    console.error('Cache file not found:', cacheFile);
    process.exit(1);
  }

  const raw = fs.readFileSync(cacheFile, 'utf-8');
  const data = JSON.parse(raw);

  // Reconstruct Maps from serialized objects
  function reviver(obj: any) {
    // If object has numeric keys representing gameweeks, convert to Map
    return obj;
  }

  // The saved structure matches fetchAllManagerData output with Maps serialized to objects
  // Recreate the Maps expected by analysis functions
  const picksByGameweek = new Map<number, any>(Object.entries(data.picksByGameweek || {}).map(([k, v]) => [Number(k), v]));
  const liveByGameweek = new Map<number, any>(Object.entries(data.liveByGameweek || {}).map(([k, v]) => [Number(k), v]));
  const finishedGameweeks = data.finishedGameweeks || [];

  const managerData: ManagerData = {
    bootstrap: data.bootstrap,
    managerInfo: data.managerInfo,
    history: data.history,
    transfers: data.transfers,
    picksByGameweek,
    liveByGameweek,
    finishedGameweeks,
  } as any;

  const summary = generateSeasonSummary(managerData);

  const benchAnalyses = summary.benchAnalyses || [];

  console.log('Bench analyses (GW 1 and 2):');
  for (const a of benchAnalyses) {
    if (a.gameweek === 1 || a.gameweek === 2) {
      console.log(`GW${a.gameweek}: hadBenchRegret=${a.hadBenchRegret}, replacedPlayerPoints=${a.replacedPlayerPoints}, lowestStarterPoints=${a.lowestStarterPoints}, missedPoints=${a.missedPoints}`);
      console.log(' bestBenchPick:', a.bestBenchPick?.player?.web_name, a.bestBenchPick?.points);
      console.log(' benchPlayers:', a.benchPlayers.map((bp) => ({ name: bp.player.web_name, points: bp.points })));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
