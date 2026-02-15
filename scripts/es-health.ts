#!/usr/bin/env tsx

/**
 * Check Elasticsearch health and status
 * 
 * Usage:
 *   pnpm tsx scripts/es-health.ts
 */

import { getESInfo, isESHealthy } from '../lib/elasticsearch/client';
import { getIndexStats } from '../lib/elasticsearch/schema';
import { FEATURES, getFeatureStatus } from '../lib/config/features';

async function main() {
  console.log('🏥 FPL Wrapped - Elasticsearch Health Check');
  console.log('============================================\n');
  
  // Feature status
  console.log('📋 Feature Status:');
  const features = getFeatureStatus();
  console.log(`   Elasticsearch enabled: ${features.elasticsearch.enabled ? '✅' : '❌'}`);
  console.log(`   Elasticsearch configured: ${features.elasticsearch.configured ? '✅' : '❌'}`);
  console.log(`   Mini-league reports: ${features.features.miniLeagueReports ? '✅' : '❌'}`);
  console.log(`   Chat: ${features.features.chat ? '✅' : '❌'}\n`);
  
  if (!FEATURES.ELASTICSEARCH_ENABLED) {
    console.log('ℹ️  Elasticsearch is disabled. Set ENABLE_ELASTICSEARCH=true to enable.\n');
    return;
  }
  
  // Connection info
  console.log('🔌 Connection:');
  const info = await getESInfo();
  
  if (!info.available) {
    console.error(`   ❌ Not connected: ${info.error}\n`);
    return;
  }
  
  console.log(`   ✅ Connected to Elasticsearch ${info.version}`);
  console.log(`   Cluster: ${info.cluster_name}\n`);
  
  // Cluster health
  console.log('💚 Cluster Health:');
  const healthy = await isESHealthy();
  console.log(`   Status: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);
  
  // Index stats
  const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';
  console.log(`📊 Index: ${indexName}`);
  
  const stats = await getIndexStats(indexName);
  
  if (!stats) {
    console.log(`   ❌ Index does not exist or is inaccessible`);
    console.log(`\n   Run: pnpm tsx scripts/es-init.ts to create index\n`);
    return;
  }
  
  console.log(`   ✅ Exists`);
  console.log(`   Documents: ${stats.documentCount.toLocaleString()}`);
  console.log(`   Size: ${(stats.sizeInBytes / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log('✨ Health check complete!');
}

main().catch(console.error);
