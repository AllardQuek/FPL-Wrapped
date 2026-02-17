import { getESClient } from '../elasticsearch/client';
import { createIndexIfNotExists } from '../elasticsearch/schema';
import { nanoid } from 'nanoid';

const CHART_INDEX = 'fpl-chat-charts';

export interface ChartRecord {
  chart_id: string;
  spec: string; // JSON string of the Vega-Lite spec
  chat_id: string;
  expires_at: string;
  '@timestamp': string;
}

/**
 * Save a Vega-Lite spec to Elasticsearch and return a unique ID
 */
export async function saveChartSpec(spec: string | object, chatId: string): Promise<string> {
  const client = getESClient();
  if (!client) throw new Error('Elasticsearch client not available');

  // Ensure index exists
  await createIndexIfNotExists(CHART_INDEX, 'charts');

  const chartId = nanoid(10);
  const specString = typeof spec === 'string' ? spec : JSON.stringify(spec);
  
  // Set expiry to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const record: ChartRecord = {
    chart_id: chartId,
    spec: specString,
    chat_id: chatId,
    expires_at: expiresAt.toISOString(),
    '@timestamp': new Date().toISOString(),
  };

  await client.index({
    index: CHART_INDEX,
    id: chartId,
    document: record,
    refresh: 'wait_for',
  });

  return chartId;
}

/**
 * Retrieve a Vega-Lite spec by its ID
 */
export async function getChartSpec(chartId: string): Promise<string | null> {
  const client = getESClient();
  if (!client) return null;

  try {
    const result = await client.get<ChartRecord>({
      index: CHART_INDEX,
      id: chartId,
    });

    if (!result.found || !result._source) return null;

    // Optional: Check expiry
    if (new Date(result._source.expires_at) < new Date()) {
      return null;
    }

    return result._source.spec;
  } catch (error) {
    console.error(`Error retrieving chart ${chartId}:`, error);
    return null;
  }
}
