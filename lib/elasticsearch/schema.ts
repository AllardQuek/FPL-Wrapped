import { getESClient } from './client';

/**
 * Mapping for the fpl-gameweek-decisions index
 * Each document represents one manager's decisions for one gameweek
 */
export function getGameweekDecisionsMapping(): Record<string, unknown> {
  return {
    properties: {
      // Manager identification
      manager_id: { type: 'integer' },
      manager_name: { 
        type: 'text',
        fields: { keyword: { type: 'keyword' } }
      },
      team_name: { 
        type: 'text',
        fields: { keyword: { type: 'keyword' } }
      },
      
      // League associations (manager can be in multiple leagues)
      league_ids: { type: 'integer' },
      
      // Gameweek identification
      gameweek: { type: 'integer' },
      season: { type: 'keyword' },
      
      // Transfer decisions for this gameweek
      transfers: {
        type: 'nested',
        properties: {
          player_in_id: { type: 'integer' },
          player_in_name: { type: 'keyword' },
          player_out_id: { type: 'integer' },
          player_out_name: { type: 'keyword' },
          cost: { type: 'integer' }, // Hit points: -4, -8, or 0 for free
          timestamp: { type: 'date' },
        }
      },
      
      // Captain selection
      captain: {
        properties: {
          player_id: { type: 'integer' },
          name: { type: 'keyword' },
          points: { type: 'integer' },
          ownership_percent: { type: 'float' },
          multiplier: { type: 'integer' }, // 2 for captain, 3 for TC
        }
      },
      
      // Vice captain
      vice_captain: {
        properties: {
          player_id: { type: 'integer' },
          name: { type: 'keyword' },
        }
      },
      
      // Bench players (position 12-15)
      bench: {
        type: 'nested',
        properties: {
          player_id: { type: 'integer' },
          name: { type: 'keyword' },
          position_index: { type: 'integer' }, // 12, 13, 14, or 15
          points: { type: 'integer' },
          element_type: { type: 'keyword' }, // GKP, DEF, MID, FWD
        }
      },
      
      // Starting XI (position 1-11)
      starters: {
        type: 'nested',
        properties: {
          player_id: { type: 'integer' },
          name: { type: 'keyword' },
          position_index: { type: 'integer' }, // 1-11
          points: { type: 'integer' },
          element_type: { type: 'keyword' },
        }
      },
      
      // Chip usage
      chip_used: { type: 'keyword' }, // null, "wildcard", "bboost", "3xc", "freehit"
      
      // Gameweek results
      gw_points: { type: 'integer' },
      gw_rank: { type: 'integer' },
      points_on_bench: { type: 'integer' },
      bank: { type: 'float' }, // Money in the bank (×10 to match FPL format)
      team_value: { type: 'float' }, // Squad value (×10)
      
      // Timestamp for indexing
      '@timestamp': { type: 'date' },
    }
  };
}

/**
 * Create the gameweek decisions index if it doesn't exist
 */
export async function createIndexIfNotExists(indexName: string): Promise<boolean> {
  const client = getESClient();
  if (!client) {
    console.warn('Elasticsearch not available, skipping index creation');
    return false;
  }
  
  try {
    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      console.log(`✅ Index "${indexName}" already exists`);
      return true;
    }
    
    // Create index with mapping
    await client.indices.create({
      index: indexName,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        refresh_interval: '5s', // Balance between freshness and performance
      },
      mappings: getGameweekDecisionsMapping(),
    });
    
    console.log(`✅ Created index "${indexName}" with mapping`);
    return true;
  } catch (error) {
    console.error(`Failed to create index "${indexName}":`, error);
    return false;
  }
}

/**
 * Delete index (useful for testing/cleanup)
 */
export async function deleteIndex(indexName: string): Promise<boolean> {
  const client = getESClient();
  if (!client) return false;
  
  try {
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      console.log(`Index "${indexName}" doesn't exist`);
      return true;
    }
    
    await client.indices.delete({ index: indexName });
    console.log(`✅ Deleted index "${indexName}"`);
    return true;
  } catch (error) {
    console.error(`Failed to delete index "${indexName}":`, error);
    return false;
  }
}

/**
 * Get index stats (document count, size, etc.)
 */
export async function getIndexStats(indexName: string) {
  const client = getESClient();
  if (!client) return null;
  
  try {
    const stats = await client.indices.stats({ index: indexName });
    const count = await client.count({ index: indexName });
    
    return {
      name: indexName,
      documentCount: count.count,
      sizeInBytes: stats._all?.primaries?.store?.size_in_bytes || 0,
      exists: true,
    };
  } catch (error) {
    console.error(`Failed to get stats for index "${indexName}":`, error);
    return null;
  }
}
