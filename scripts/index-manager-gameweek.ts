#!/usr/bin/env tsx

/**
 * Index manager gameweek decisions to Elasticsearch
 * 
 * Usage:
 *   # Single gameweek
 *   pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10
 *   pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10
 *   
 *   # All gameweeks for a manager
 *   pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --all
 *   pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --from 1 --to 25
 *   
 *   # All gameweeks for all managers in a league
 *   pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --all
 *   pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --from 1 --to 25
 */

import {
  indexManagerGameweek as serviceIndexManagerGameweek,
  indexManagerAllGameweeks as serviceIndexManagerAllGameweeks,
  indexLeagueAllGameweeks as serviceIndexLeagueAllGameweeks,
  IndexingProgress
} from '../lib/elasticsearch/indexing-service';
import { getLeagueStandings } from '../lib/fpl-api';

/**
 * CLI Progress Logger
 */
function logProgress(progress: IndexingProgress) {
  if (progress.type === 'gameweek') {
    console.log(`   [${progress.current}/${progress.total}] ${progress.message}`);
  } else if (progress.type === 'manager') {
    console.log(`\n👤 Manager: ${progress.name} (ID: ${progress.id}) [${progress.current}/${progress.total}]`);
    console.log('─'.repeat(40));
  } else {
    console.log(`\n🏆 ${progress.message}`);
  }
}

/**
 * Index a single manager's gameweek decisions (CLI Wrapper)
 */
async function indexManagerGameweek(
  managerId: number,
  gameweek: number,
  leagueIds: number[] = []
): Promise<boolean> {
  console.log(`\n📊 Indexing manager ${managerId}, GW${gameweek}...`);
  const result = await serviceIndexManagerGameweek(managerId, gameweek, leagueIds);
  if (result) {
    console.log(`✅ Success for GW${gameweek}`);
  } else {
    console.log(`❌ Failed for GW${gameweek}`);
  }
  return result;
}

/**
 * Index all managers in a league for a specific gameweek (CLI Helper)
 */
async function indexLeagueGameweek(leagueId: number, gameweek: number): Promise<void> {
  console.log(`\n🏆 Indexing league ${leagueId}, GW${gameweek}...`);

  try {
    const standings = await getLeagueStandings(leagueId, 1);
    const managerIds = standings.standings.results.map(r => r.entry);

    console.log(`   Found ${managerIds.length} managers in league`);

    let success = 0;
    for (let i = 0; i < managerIds.length; i++) {
      const result = await serviceIndexManagerGameweek(managerIds[i], gameweek, [leagueId]);
      if (result) success++;
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n✅ League indexing complete: ${success}/${managerIds.length} success`);
  } catch (error) {
    console.error(`❌ Failed to index league ${leagueId}:`, error);
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const managerIdx = args.indexOf('--manager');
  const leagueIdx = args.indexOf('--league');
  const gwIdx = args.indexOf('--gameweek');
  const allIdx = args.indexOf('--all');
  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');

  const managerId = managerIdx !== -1 ? parseInt(args[managerIdx + 1]) : null;
  const leagueId = leagueIdx !== -1 ? parseInt(args[leagueIdx + 1]) : null;
  const gameweek = gwIdx !== -1 ? parseInt(args[gwIdx + 1]) : null;
  const all = allIdx !== -1;
  const fromGW = fromIdx !== -1 ? parseInt(args[fromIdx + 1]) : 1;
  const toGW = toIdx !== -1 ? parseInt(args[toIdx + 1]) : undefined;

  // Validate arguments
  if (!managerId && !leagueId) {
    console.error('❌ Must specify either --manager or --league');
    process.exit(1);
  }

  console.log('🚀 FPL Wrapped - Elasticsearch Indexing');
  console.log('==========================================');

  if (managerId && (all || fromIdx !== -1)) {
    await serviceIndexManagerAllGameweeks(managerId, fromGW, toGW, logProgress);
  } else if (leagueId && (all || fromIdx !== -1)) {
    await serviceIndexLeagueAllGameweeks(leagueId, fromGW, toGW, logProgress);
  } else if (managerId && gameweek) {
    await indexManagerGameweek(managerId, gameweek);
  } else if (leagueId && gameweek) {
    await indexLeagueGameweek(leagueId, gameweek);
  } else {
    console.error('❌ Invalid combination of arguments');
    process.exit(1);
  }

  console.log('\n✨ Done!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { indexManagerGameweek, indexLeagueGameweek };
