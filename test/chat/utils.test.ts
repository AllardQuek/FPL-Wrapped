import { describe, it, expect } from 'vitest';
import {
  toErrorMessage,
  isServiceDownError,
  getUserFriendlyError,
  getToolDisplayName,
  transformVisualizations,
  SERVICE_DOWN_MESSAGE,
} from '../../lib/chat/utils';

describe('toErrorMessage', () => {
  it('returns message from Error instance', () => {
    expect(toErrorMessage(new Error('something broke'))).toBe('something broke');
  });

  it('returns the string as-is', () => {
    expect(toErrorMessage('plain error')).toBe('plain error');
  });

  it('returns "Unknown error" for null', () => {
    expect(toErrorMessage(null)).toBe('Unknown error');
  });

  it('returns "Unknown error" for undefined', () => {
    expect(toErrorMessage(undefined)).toBe('Unknown error');
  });

  it('JSON-stringifies unknown objects', () => {
    expect(toErrorMessage({ code: 42 })).toBe('{"code":42}');
  });
});

describe('isServiceDownError', () => {
  it('detects agentexecutionerror', () => {
    expect(isServiceDownError('AgentExecutionError: upstream failed')).toBe(true);
  });

  it('detects inference entity', () => {
    expect(isServiceDownError('inference entity not available')).toBe(true);
  });

  it('detects anthropic mentions', () => {
    expect(isServiceDownError('Error calling Anthropic API')).toBe(true);
  });

  it('detects claude mentions', () => {
    expect(isServiceDownError('Claude returned an error')).toBe(true);
  });

  it('detects service error', () => {
    expect(isServiceDownError('service error occurred')).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isServiceDownError('404 not found')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isServiceDownError('ANTHROPIC TIMEOUT')).toBe(true);
  });
});

describe('getUserFriendlyError', () => {
  it('handles ConversationNotFound', () => {
    const msg = getUserFriendlyError('ConversationNotFound: id abc');
    expect(msg).toContain('conversation');
    expect(msg).toContain('expired');
  });

  it('handles conversation not found (space-separated)', () => {
    const msg = getUserFriendlyError('The conversation was not found');
    expect(msg).toContain('expired');
  });

  it('handles no handler found / 404', () => {
    const msg = getUserFriendlyError('no handler found for route');
    expect(msg).toContain('unavailable');
  });

  it('handles 401 unauthorized', () => {
    const msg = getUserFriendlyError('401 Unauthorized');
    expect(msg).toContain('Authentication error');
  });

  it('handles 403 forbidden', () => {
    const msg = getUserFriendlyError('403 forbidden');
    expect(msg).toContain('Authentication error');
  });

  it('handles connection errors', () => {
    const msg = getUserFriendlyError('failed to fetch from remote');
    expect(msg).toContain('Connection error');
  });

  it('handles ECONNREFUSED', () => {
    const msg = getUserFriendlyError('ECONNREFUSED 127.0.0.1:9200');
    expect(msg).toContain('Connection error');
  });

  it('handles agent_id config error', () => {
    const msg = getUserFriendlyError('invalid agent_id provided');
    expect(msg).toContain('ELASTIC_AGENT_ID');
  });

  it('handles timeout', () => {
    const msg = getUserFriendlyError('request timeout after 30s');
    expect(msg).toContain('timed out');
  });

  it('handles terminated/interrupted', () => {
    const msg = getUserFriendlyError('stream terminated unexpectedly');
    expect(msg).toContain('interrupted');
  });

  it('returns service down message text for downstream service errors', () => {
    const msg = getUserFriendlyError('AgentExecutionError: Claude failed');
    // getUserFriendlyError strips the ❌ prefix
    expect(msg).toContain('services is down');
  });

  it('returns generic fallback for unknown errors', () => {
    const msg = getUserFriendlyError('some totally unknown thing happened');
    expect(msg).toContain('Something went wrong');
  });
});

describe('getToolDisplayName', () => {
  it('returns search display name', () => {
    expect(getToolDisplayName('platform.core.search')).toBe('🔍 Searching documents');
  });

  it('returns elasticsearch display name', () => {
    expect(getToolDisplayName('platform.core.elasticsearch')).toBe('📊 Querying data');
  });

  it('returns aggregate display name', () => {
    expect(getToolDisplayName('platform.core.aggregate')).toBe('📈 Aggregating data');
  });

  it('returns sql display name', () => {
    expect(getToolDisplayName('platform.core.sql')).toBe('💾 Running SQL query');
  });

  it('falls back gracefully for unknown tool IDs', () => {
    const name = getToolDisplayName('some.custom.tool');
    expect(name).toContain('tool');
  });

  it('uses the last segment for unknown tools', () => {
    const name = getToolDisplayName('namespace.action.doSomething');
    expect(name).toContain('doSomething');
  });
});

describe('transformVisualizations', () => {
  it('returns empty string for empty input', () => {
    expect(transformVisualizations('')).toBe('');
  });

  it('returns original string when no visualization tags present', () => {
    const text = 'Here is some text with no charts.';
    expect(transformVisualizations(text)).toBe(text);
  });

  it('replaces a visualization tag with an image markdown placeholder', () => {
    const input = 'Before<visualization tool-result-id="abc123"/>After';
    const result = transformVisualizations(input);
    expect(result).toContain('![](viz://abc123)');
    expect(result).not.toContain('<visualization');
  });

  it('replaces multiple visualization tags', () => {
    const input =
      '<visualization tool-result-id="id1"/>text<visualization tool-result-id="id2"/>';
    const result = transformVisualizations(input);
    expect(result).toContain('viz://id1');
    expect(result).toContain('viz://id2');
  });

  it('handles self-closing tag with extra attributes', () => {
    const input = '<visualization tool-result-id="xyz" chart-type="Bar"/>';
    const result = transformVisualizations(input);
    expect(result).toContain('viz://xyz');
  });
});

describe('SERVICE_DOWN_MESSAGE', () => {
  it('is a non-empty string', () => {
    expect(typeof SERVICE_DOWN_MESSAGE).toBe('string');
    expect(SERVICE_DOWN_MESSAGE.length).toBeGreaterThan(0);
  });
});
