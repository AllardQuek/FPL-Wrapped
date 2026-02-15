#!/usr/bin/env tsx

/**
 * Query and display Elasticsearch documents for testing
 * 
 * Usage:
 *   pnpm tsx scripts/es-query-test.ts --manager 123456 --gameweek 10
 */

import { getESClient } from '../lib/elasticsearch/client';

const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';

async function queryDocument(managerId: number, gameweek: number) {
  console.log(`\n🔍 Querying ES for manager ${managerId}, GW${gameweek}...\n`);
  
  const client = getESClient();
  if (!client) {
    console.error('❌ Elasticsearch client not available');
    return;
  }
  
  try {
    const docId = `${managerId}-gw${gameweek}`;
    const result = await client.get({
      index: indexName,
      id: docId,
    });
    
    console.log('✅ Document found:\n');
    console.log(JSON.stringify(result._source, null, 2));
  } catch (error) {
    if (error && typeof error === 'object' && 'meta' in error) {
      const esError = error as { meta?: { statusCode?: number } };
      if (esError.meta?.statusCode === 404) {
        console.error('❌ Document not found');
        console.log('\nMake sure you have indexed this manager/gameweek:');
        console.log(`  pnpm tsx scripts/index-manager-gameweek.ts --manager ${managerId} --gameweek ${gameweek}`);
        return;
      }
    }
    console.error('❌ Query failed:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const managerIdx = args.indexOf('--manager');
  const gwIdx = args.indexOf('--gameweek');
  
  const managerId = managerIdx !== -1 ? parseInt(args[managerIdx + 1]) : null;
  const gameweek = gwIdx !== -1 ? parseInt(args[gwIdx + 1]) : null;
  
  if (!managerId || !gameweek) {
    console.error('❌ Missing required arguments');
    console.log('\nUsage:');
    console.log('  pnpm tsx scripts/es-query-test.ts --manager 123456 --gameweek 10');
    process.exit(1);
  }
  
  await queryDocument(managerId, gameweek);
}

main().catch(console.error);
