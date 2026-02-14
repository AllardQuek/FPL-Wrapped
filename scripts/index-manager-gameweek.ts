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
 * Index all gameweeks for a single manager
 */
async function indexManagerAllGameweeks(
  managerId: number,
  fromGW: number = 1,
  toGW?: number
): Promise<void> {
  console.log(`\n📅 Indexing all gameweeks for manager ${managerId}...`);
  console.log(`   Range: GW${fromGW} to GW${toGW || 'current'}\n`);
  
  try {
    // Get bootstrap to determine current gameweek if toGW not specified
    const bootstrap = await getBootstrapData();
    const currentGW = toGW || bootstrap.events.find(e => e.is_current)?.id || 38;
    
    console.log(`   Total gameweeks to index: ${currentGW - fromGW + 1}`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    // Index each gameweek sequentially (avoid rate limits)
    for (let gw = fromGW; gw <= currentGW; gw++) {
      // Check if gameweek has finished
      const gwEvent = bootstrap.events.find(e => e.id === gw);
      if (gwEvent && !gwEvent.finished && !gwEvent.is_current) {
        console.log(`⏭️  GW${gw}: Not started yet, skipping`);
        skipped++;
        continue;
      }
      
      const result = await indexManagerGameweek(managerId, gw);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Small delay between gameweeks to be nice to FPL API
      if (gw < currentGW) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`\n✅ Manager indexing complete:`);
    console.log(`   Success: ${success}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped: ${skipped}`);
  } catch (error) {
    console.error(`❌ Failed to index manager ${managerId}:`, error);
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
 * Index all gameweeks for all managers in a league
 */
async function indexLeagueAllGameweeks(
  leagueId: number,
  fromGW: number = 1,
  toGW?: number
): Promise<void> {
  console.log(`\n🏆 Indexing ALL gameweeks for ALL managers in league ${leagueId}...`);
  console.log(`   Range: GW${fromGW} to GW${toGW || 'current'}\n`);
  
  try {
    // Get bootstrap to determine current gameweek if toGW not specified
    const bootstrap = await getBootstrapData();
    const currentGW = toGW || bootstrap.events.find(e => e.is_current)?.id || 38;
    
    // Fetch league standings (first page only - can be extended for pagination)
    const standings = await getLeagueStandings(leagueId, 1);
    const managerIds = standings.standings.results.map(r => r.entry);
    const managerNames = new Map(
      standings.standings.results.map(r => [r.entry, r.player_name])
    );
    
    console.log(`   Found ${managerIds.length} managers in league`);
    console.log(`   Gameweeks to index: ${currentGW - fromGW + 1}`);
    console.log(`   Total operations: ${managerIds.length * (currentGW - fromGW + 1)}\n`);
    
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    
    // Process each manager sequentially to avoid overwhelming the API
    for (let i = 0; i < managerIds.length; i++) {
      const managerId = managerIds[i];
      const managerName = managerNames.get(managerId) || `Manager ${managerId}`;
      
      console.log(`\n[${ i + 1}/${managerIds.length}] 👤 ${managerName} (ID: ${managerId})`);
      console.log('─'.repeat(60));
      
      // Index all gameweeks for this manager
      for (let gw = fromGW; gw <= currentGW; gw++) {
        // Check if gameweek has finished
        const gwEvent = bootstrap.events.find(e => e.id === gw);
        if (gwEvent && !gwEvent.finished && !gwEvent.is_current) {
          console.log(`   ⏭️  GW${gw}: Not started yet, skipping`);
          totalSkipped++;
          continue;
        }
        
        const result = await indexManagerGameweek(managerId, gw, [leagueId]);
        if (result) {
          totalSuccess++;
        } else {
          totalFailed++;
        }
        
        // Small delay between gameweeks to be nice to FPL API
        if (gw < currentGW) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Longer delay between managers
      if (i < managerIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ League-wide indexing complete:');
    console.log(`   Managers processed: ${managerIds.length}`);
    console.log(`   Success: ${totalSuccess}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Total: ${totalSuccess + totalFailed + totalSkipped}`);
    console.log('='.repeat(60));
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
    console.log('\nUsage:');
    console.log('  Single gameweek:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10');
    console.log('\n  All gameweeks for a manager:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --all');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --from 1 --to 25');
    console.log('\n  All gameweeks for all managers in a league:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --all');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --from 1 --to 25');
    process.exit(1);
  }
  
  // Manager with --all or --from/--to
  if (managerId && (all || fromIdx !== -1)) {
    console.log('🚀 FPL Wrapped - Elasticsearch Indexing');
    console.log('==========================================');
    await indexManagerAllGameweeks(managerId, fromGW, toGW);
    console.log('\n✨ Done!');
    return;
  }
  
  // League with --all or --from/--to
  if (leagueId && (all || fromIdx !== -1)) {
    console.log('🚀 FPL Wrapped - Elasticsearch Indexing');
    console.log('==========================================');
    await indexLeagueAllGameweeks(leagueId, fromGW, toGW);
    console.log('\n✨ Done!');
    return;
  }
  
  // Single gameweek modes
  if (!gameweek) {
    console.error('❌ Missing --gameweek argument (or use --all for all gameweeks)');
    console.log('\nUsage:');
    console.log('  Single gameweek:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --gameweek 10');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --gameweek 10');
    console.log('\n  All gameweeks for a manager:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --all');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --manager 123456 --from 1 --to 25');
    console.log('\n  All gameweeks for all managers in a league:');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --all');
    console.log('    pnpm tsx scripts/index-manager-gameweek.ts --league 456789 --from 1 --to 25');
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

export { indexManagerGameweek, indexManagerAllGameweeks, indexLeagueGameweek, indexLeagueAllGameweeks };
