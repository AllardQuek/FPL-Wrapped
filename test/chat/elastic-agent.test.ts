/**
 * Tests for lib/chat/elastic-agent.ts — streamChatWithAgent()
 *
 * We mock global fetch to return a crafted SSE stream. The fs module is mocked
 * to prevent any file I/O even if DEBUG_AGENT is accidentally set.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChatWithAgent } from '../../lib/chat/elastic-agent';

// ---------------------------------------------------------------------------
// Mock fs at module level so it applies to all tests
// ---------------------------------------------------------------------------
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode a string as a Uint8Array */
const enc = (s: string) => new TextEncoder().encode(s);

/**
 * Build a ReadableStream from an array of SSE line-groups.
 * Each string in `lines` is sent as one chunk (already includes \n).
 */
function makeSseStream(lines: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(enc(line));
      }
      controller.close();
    },
  });
}

/** Collect all chunks yielded by streamChatWithAgent into an array */
async function collectChunks(
  body: ReadableStream<Uint8Array>,
  message = 'hello',
  conversationId?: string,
  options?: Parameters<typeof streamChatWithAgent>[2]
) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    body,
  }));

  const chunks = [];
  for await (const chunk of streamChatWithAgent(message, conversationId, options)) {
    chunks.push(chunk);
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.ELASTICSEARCH_URL = 'https://es.example.com';
  process.env.ELASTIC_AGENT_ID = 'agent-123';
  process.env.KIBANA_URL = 'https://kb.example.com';
  process.env.ELASTICSEARCH_API_KEY = 'test-api-key';
  delete process.env.DEBUG_AGENT;
  delete process.env.AGENT_LOG_FILE;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('streamChatWithAgent — missing environment', () => {
  it('throws when ELASTICSEARCH_URL is missing', async () => {
    delete process.env.ELASTICSEARCH_URL;
    await expect(async () => {
      for await (const __ of streamChatWithAgent('hi')) { void __; }
    }).rejects.toThrow('Missing');
  });

  it('throws when ELASTIC_AGENT_ID is missing', async () => {
    delete process.env.ELASTIC_AGENT_ID;
    await expect(async () => {
      for await (const __ of streamChatWithAgent('hi')) { void __; }
    }).rejects.toThrow('Missing');
  });
});

describe('streamChatWithAgent — HTTP error', () => {
  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Unauthorized',
    }));

    await expect(async () => {
      for await (const __ of streamChatWithAgent('hi')) { void __; }
    }).rejects.toThrow('401');
  });

  it('throws when response body is null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: null,
    }));

    await expect(async () => {
      for await (const __ of streamChatWithAgent('hi')) { void __; }
    }).rejects.toThrow('No response body');
  });
});

describe('streamChatWithAgent — SSE parsing', () => {
  it('yields a content chunk from message_chunk event', async () => {
    const sseLines = [
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"Hello"}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const contentChunks = chunks.filter(c => c.content !== undefined);
    expect(contentChunks.length).toBeGreaterThanOrEqual(1);
    expect(contentChunks[0].content).toBe('Hello');
  });

  it('yields a reasoning chunk', async () => {
    const sseLines = [
      'event: reasoning\n',
      'data: {"data":{"reasoning":"I should think..."}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const reasoning = chunks.find(c => c.reasoning !== undefined);
    expect(reasoning?.reasoning).toBe('I should think...');
  });

  it('yields a toolCall chunk', async () => {
    const sseLines = [
      'event: tool_call\n',
      'data: {"data":{"tool_id":"platform.core.search","tool_call_id":"call-1","params":{"query":"fpl"}}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const toolCall = chunks.find(c => c.toolCall !== undefined);
    expect(toolCall?.toolCall?.tool_id).toBe('platform.core.search');
    expect(toolCall?.toolCall?.tool_call_id).toBe('call-1');
  });

  it('yields a toolResult chunk', async () => {
    const sseLines = [
      'event: tool_result\n',
      'data: {"data":{"tool_call_id":"call-1","results":[{"hits":5}]}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const toolResult = chunks.find(c => c.toolResult !== undefined);
    expect(toolResult?.toolResult?.tool_call_id).toBe('call-1');
    expect(toolResult?.toolResult?.results).toEqual([{ hits: 5 }]);
  });

  it('captures conversationId from conversation_id_set event', async () => {
    const sseLines = [
      'event: conversation_id_set\n',
      'data: {"data":{"conversation_id":"conv-abc"}}\n',
      '\n',
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"Hi"}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const withConvId = chunks.find(c => c.conversationId === 'conv-abc');
    expect(withConvId).toBeDefined();
  });

  it('terminates on [DONE] line', async () => {
    const sseLines = [
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"A"}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
      // Lines after [DONE] should never be reached
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"SHOULD_NOT_APPEAR"}}\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const shouldNot = chunks.find(c => c.content === 'SHOULD_NOT_APPEAR');
    expect(shouldNot).toBeUndefined();
  });

  it('yields done:true on stream end', async () => {
    const sseLines = [
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    expect(chunks.some(c => c.done === true)).toBe(true);
  });

  it('yields done:true on round_complete event', async () => {
    const sseLines = [
      'event: round_complete\n',
      'data: {"data":{}}\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    expect(chunks.some(c => c.done === true)).toBe(true);
  });

  it('yields error chunk on error event', async () => {
    const sseLines = [
      'event: error\n',
      'data: {"error":"Something went wrong upstream"}\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const errorChunk = chunks.find(c => c.error !== undefined);
    expect(errorChunk).toBeDefined();
    expect(errorChunk?.done).toBe(true);
  });

  it('skips malformed / non-JSON data lines without throwing', async () => {
    const sseLines = [
      'event: message_chunk\n',
      'data: THIS IS NOT JSON\n',
      '\n',
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"Valid"}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    // Should not throw
    const chunks = await collectChunks(makeSseStream(sseLines));
    const content = chunks.find(c => c.content === 'Valid');
    expect(content).toBeDefined();
  });

  it('skips SSE comment lines (starting with :)', async () => {
    const sseLines = [
      ': this is a comment\n',
      'event: message_chunk\n',
      'data: {"data":{"text_chunk":"After comment"}}\n',
      '\n',
      'data: [DONE]\n',
      '\n',
    ];

    const chunks = await collectChunks(makeSseStream(sseLines));
    const content = chunks.find(c => c.content === 'After comment');
    expect(content).toBeDefined();
  });

  it('passes the existing conversationId in the request body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSseStream(['data: [DONE]\n', '\n']),
    });
    vi.stubGlobal('fetch', mockFetch);

    for await (const __ of streamChatWithAgent('hi', 'existing-conv-id')) { void __; }

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.conversation_id).toBe('existing-conv-id');
  });

  it('does not send conversation_id when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSseStream(['data: [DONE]\n', '\n']),
    });
    vi.stubGlobal('fetch', mockFetch);

    for await (const __ of streamChatWithAgent('hi')) { void __; }

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.conversation_id).toBeUndefined();
  });
});

describe('streamChatWithAgent — abort', () => {
  it('yields an error chunk when aborted mid-stream', async () => {
    const controller = new AbortController();

    // Stream that never sends [DONE] so the abort fires first
    const neverEndingStream = new ReadableStream<Uint8Array>({
      start(c) {
        // Enqueue something then pause forever
        c.enqueue(enc('event: message_chunk\n'));
        c.enqueue(enc('data: {"data":{"text_chunk":"partial"}}\n'));
        c.enqueue(enc('\n'));
        // Do NOT close — we want the abort to interrupt the read
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: neverEndingStream,
    }));

    // Abort immediately
    controller.abort();

    const chunks = [];
    for await (const chunk of streamChatWithAgent('hi', undefined, { signal: controller.signal })) {
      chunks.push(chunk);
    }

    // Should have ended with a done/error chunk rather than hanging
    expect(chunks.some(c => c.done === true || c.error !== undefined)).toBe(true);
  });
});

describe('streamChatWithAgent — Kibana URL resolution', () => {
  it('uses KIBANA_URL override directly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSseStream(['data: [DONE]\n', '\n']),
    });
    vi.stubGlobal('fetch', mockFetch);

    process.env.KIBANA_URL = 'https://custom-kibana.example.com/';

    for await (const __ of streamChatWithAgent('hi')) { void __; }

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('custom-kibana.example.com');
    // Trailing slash should be stripped — path-part should start with /api, not //api
    expect(url).not.toContain('//api');
  });

  it('derives Kibana URL from ES URL when KIBANA_URL is not set', async () => {
    delete process.env.KIBANA_URL;
    process.env.ELASTICSEARCH_URL = 'https://my-deployment.es.example.io';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSseStream(['data: [DONE]\n', '\n']),
    });
    vi.stubGlobal('fetch', mockFetch);

    for await (const __ of streamChatWithAgent('hi')) { void __; }

    const [url] = mockFetch.mock.calls[0];
    // .es. should become .kb.
    expect(url).toContain('.kb.example.io');
  });
});
