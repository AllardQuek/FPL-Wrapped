#!/usr/bin/env tsx

/**
 * Index manager gameweek decisions to Elasticsearch
 * 
 * Usage:
 *   pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10
 *   pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10
 */

import { getESClient } from '../lib/elasticsearch/client';
import { transformToGameweekDecision } from '../lib/elasticsearch/transformer';
import { 
  getBootstrapData, 
  getGameWeekPicks, 
  getLiveGameWeek,
  getManagerInfo,
  getManagerTransfers,
  getLeagueStandings
} from '../lib/fpl-api';

const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';

/**
 * Index a single manager's gameweek decisions
 */
async function indexManagerGameweek(
  managerId: number, 
  gameweek: number,
  leagueIds: number[] = []
): Promise<boolean> {
  console.log(`\n📊 Indexing manager ${managerId}, GW${gameweek}...`);
  
  try {
    // Fetch required data
    const [bootstrap, managerInfo, picks, transfers, liveGW] = await Promise.all([
      getBootstrapData(),
      getManagerInfo(managerId),
      getGameWeekPicks(managerId, gameweek),
      getManagerTransfers(managerId),
      getLiveGameWeek(gameweek),
    ]);
    
    // Transform to ES document
    const document = transformToGameweekDecision(
      managerId,
      managerInfo,
      gameweek,
      picks,
      transfers,
      liveGW,
      bootstrap,
      leagueIds
    );
    
    // Index to ES
    const client = getESClient();
    if (!client) {
      console.error('❌ Elasticsearch client not available');
      return false;
    }
    
    const docId = `${managerId}-gw${gameweek}`;
    await client.index({
      index: indexName,
      id: docId,
      document,
    });
    
    console.log(`✅ Indexed ${managerInfo.name} (${document.team_name}) - GW${gameweek}`);
    console.log(`   Points: ${document.gw_points}, Rank: ${document.gw_rank.toLocaleString()}`);
    console.log(`   Captain: ${document.captain.name} (${document.captain.points}pts)`);
    console.log(`   Transfers: ${document.transfers.length}, Bench points: ${document.points_on_bench}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to index manager ${managerId}:`, error);
    return false;
  }
}

/**
 * Index all managers in a league for a specific gameweek
 */
async function indexLeagueGameweek(leagueId: number, gameweek: number): Promise<void> {
  console.log(`\n🏆 Indexing league ${leagueId}, GW${gameweek}...`);
  
  try {
    // Fetch league standings (first page only for now)
    const standings = await getLeagueStandings(leagueId, 1);
    const managerIds = standings.standings.results.map(r => r.entry);
    
    console.log(`   Found ${managerIds.length} managers in league`);
    
    // Index managers in batches of 5 to respect rate limits
    const batchSize = 5;
    const delay = 500; // 500ms between batches
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < managerIds.length; i += batchSize) {
      const batch = managerIds.slice(i, i + batchSize);
      console.log(`\n   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(managerIds.length / batchSize)}`);
      
      // Process batch in parallel
      const results = await Promise.all(
        batch.map(id => indexManagerGameweek(id, gameweek, [leagueId]))
      );
      
      success += results.filter(r => r).length;
      failed += results.filter(r => !r).length;
      
      // Wait before next batch (unless it's the last batch)
      if (i + batchSize < managerIds.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`\n✅ League indexing complete:`);
    console.log(`   Success: ${success}/${managerIds.length}`);
    console.log(`   Failed: ${failed}/${managerIds.length}`);
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
  
  const managerId = managerIdx !== -1 ? parseInt(args[managerIdx + 1]) : null;
  const leagueId = leagueIdx !== -1 ? parseInt(args[leagueIdx + 1]) : null;
  const gameweek = gwIdx !== -1 ? parseInt(args[gwIdx + 1]) : null;
  
  // Validate arguments
  if (!gameweek) {
    console.error('❌ Missing --gameweek argument');
    console.log('\nUsage:');
    console.log('  pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10');
    console.log('  pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10');
    process.exit(1);
  }
  
  if (!managerId && !leagueId) {
    console.error('❌ Must specify either --manager or --league');
    console.log('\nUsage:');
    console.log('  pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10');
    console.log('  pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10');
    process.exit(1);
  }
  
  console.log('🚀 FPL Wrapped - Elasticsearch Indexing');
  console.log('==========================================');
  
  if (managerId && gameweek) {
    await indexManagerGameweek(managerId, gameweek);
  } else if (leagueId && gameweek) {
    await indexLeagueGameweek(leagueId, gameweek);
  }
  
  console.log('\n✨ Done!');
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { indexManagerGameweek, indexLeagueGameweek };
