#!/usr/bin/env tsx

/**
 * Initialize Elasticsearch indices for FPL Wrapped
 * 
 * Usage:
 *   pnpm tsx scripts/es-init.ts
 */

import { getESInfo } from '../lib/elasticsearch/client';
import { createIndexIfNotExists } from '../lib/elasticsearch/schema';
import { FEATURES } from '../lib/config/features';

async function main() {
  console.log('🚀 FPL Wrapped - Elasticsearch Initialization');
  console.log('==============================================\n');
  
  // Check if ES is enabled
  if (!FEATURES.ELASTICSEARCH_ENABLED) {
    console.error('❌ Elasticsearch is not enabled');
    console.log('\nTo enable Elasticsearch:');
    console.log('1. Set ENABLE_ELASTICSEARCH=true in .env.local');
    console.log('2. Configure ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY');
    console.log('\nSee .env.example for configuration template');
    process.exit(1);
  }
  
  // Check ES connection
  console.log('🔌 Checking Elasticsearch connection...');
  const info = await getESInfo();
  
  if (!info.available) {
    console.error(`❌ Cannot connect to Elasticsearch: ${info.error}`);
    console.log('\nPlease check:');
    console.log('- ELASTICSEARCH_URL is correct');
    console.log('- ELASTICSEARCH_API_KEY is valid');
    console.log('- Elasticsearch cluster is running');
    process.exit(1);
  }
  
  console.log(`✅ Connected to Elasticsearch ${info.version}`);
  console.log(`   Cluster: ${info.cluster_name}\n`);
  
  // Create gameweek decisions index
  const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';
  console.log(`📊 Creating index: ${indexName}...`);
  
  const created = await createIndexIfNotExists(indexName);
  
  if (!created) {
    console.error('❌ Failed to create index');
    process.exit(1);
  }
  
  console.log('\n✨ Elasticsearch initialization complete!');
  console.log('\nNext steps:');
  console.log(`  1. Index data: pnpm tsx scripts/index-manager-gameweek.ts --manager YOUR_ID --gameweek 10`);
  console.log('  2. Check health: pnpm tsx scripts/es-health.ts');
  console.log('  3. Enable features in .env.local (ENABLE_MINI_LEAGUE_REPORTS, etc.)');
}

main().catch(console.error);
