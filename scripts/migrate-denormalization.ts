#!/usr/bin/env tsx

/**
 * Migration script to denormalize existing Elasticsearch documents
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-denormalization.ts
 */

import { getESClient } from '../lib/elasticsearch/client';
import { getGameweekDecisionsMapping } from '../lib/elasticsearch/schema';
import { GameweekDecisionDocument } from '../lib/elasticsearch/transformer';

const indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'fpl-gameweek-decisions';

async function migrate() {
    console.log('🚀 Starting Denormalization Migration');
    console.log(`Index: ${indexName}`);
    console.log('====================================\n');

    const client = getESClient();
    if (!client) {
        console.error('❌ Elasticsearch client not available');
        process.exit(1);
    }

    try {
        // 1. Update Mapping
        console.log('📝 Updating index mapping...');
        const mapping = getGameweekDecisionsMapping();

        await client.indices.putMapping({
            index: indexName,
            properties: mapping.properties as Record<string, any>
        });
        console.log('✅ Mapping updated successfully\n');

        // 2. Fetch all documents
        console.log('🔍 Fetching documents...');

        // Use scroll to fetch all documents
        const scrollSearch = await client.helpers.scrollSearch({
            index: indexName,
            query: { match_all: {} }
        });

        let processedConnect = 0;
        let updatedCount = 0;
        let failedCount = 0;

        // 3. Process documents
        for await (const response of scrollSearch) {
            if (processedConnect < 1) {
                console.log('DEBUG: Response keys:', Object.keys(response || {}));
                // @ts-ignore
                if (response?.hits) {
                    // @ts-ignore
                    console.log('DEBUG: Hits count:', response.hits.hits?.length);
                } else {
                    console.log('DEBUG: No hits property found in response');
                    console.log('DEBUG: structure sample', JSON.stringify(response, null, 2).substring(0, 200));
                }
            }

            // scrollSearch yields response objects
            // Based on debug output, the hits are in response.body.hits.hits
            const body = (response as any).body || response;
            const hits = (body as any).hits?.hits || [];

            for (const hit of hits) {
                const doc = hit._source as GameweekDecisionDocument;
                const docId = hit._id;
                processedConnect++;

                try {
                    // Calculate new fields if they don't exist or need update
                    const updates: Record<string, any> = {};

                    // Starters (denormalized flat fields)
                    if (doc.starters) {
                        updates.starter_names = doc.starters.map(s => s.name);
                        updates.starter_points = doc.starters.map(s => s.points);
                        updates.starter_element_ids = doc.starters.map(s => s.player_id);
                        updates.starter_element_types = doc.starters.map(s => s.element_type);
                    }

                    // Bench (denormalized)
                    if (doc.bench) {
                        updates.bench_names = doc.bench.map(b => b.name);
                        updates.bench_points = doc.bench.map(b => b.points);
                        updates.bench_element_ids = doc.bench.map(b => b.player_id);
                    }

                    // Transfers (denormalized)
                    if (doc.transfers) {
                        // Keep per-transfer arrays where useful
                        updates.transfer_in_names = doc.transfers.map(t => t.player_in_name);
                        updates.transfer_out_names = doc.transfers.map(t => t.player_out_name);
                        updates.transfer_costs = doc.transfers.map(t => t.cost);
                        updates.transfer_timestamps = doc.transfers.map(t => t.timestamp);

                        // Aggregates useful for ES|QL tools
                        updates.transfer_count = doc.transfers.length;
                        updates.total_transfer_cost = (doc.transfers || []).reduce((sum, t) => sum + (t.cost || 0), 0);
                    }

                    // Remove old typo fields if they exist
                    if ('transfers_in_names' in doc) {
                        updates.transfers_in_names = null;
                    }
                    if ('transfers_out_names' in doc) {
                        updates.transfers_out_names = null;
                    }

                    // Update document
                    if (Object.keys(updates).length > 0) {
                        await client.update({
                            index: indexName,
                            id: docId,
                            doc: updates
                        });
                        updatedCount++;
                    }

                    if (processedConnect % 50 === 0) {
                        process.stdout.write(`\rProcessed: ${processedConnect}, Updated: ${updatedCount}`);
                    }

                } catch (error) {
                    console.error(`\n❌ Failed to update doc ${docId}:`, error);
                    failedCount++;
                }
            }
        }

        console.log(`\n\n✨ Migration complete!`);
        console.log(`Total processed: ${processedConnect}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Failed: ${failedCount}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate().catch(console.error);
