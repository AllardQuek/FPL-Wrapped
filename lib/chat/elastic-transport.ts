import { HttpChatTransport, UIMessageChunk, UIMessage } from 'ai';

/**
 * Custom transport for Elastic Agent Builder API
 * Bridges Elastic's SSE format with Vercel AI SDK's UIMessageChunk format
 */
export class ElasticAgentChatTransport extends HttpChatTransport<UIMessage> {
  protected processResponseStream(
    stream: ReadableStream<Uint8Array>
  ): ReadableStream<UIMessageChunk> {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    const textId = 'text-1';
    const reasoningId = 'reasoning-1';
    let textStarted = false;
    let textAccumulator = '';
    let reasoningAccumulator = '';

    return stream.pipeThrough(
      new TransformStream<Uint8Array, UIMessageChunk>({
        start(controller) {
          try {
            // eslint-disable-next-line no-console
            console.debug('[ElasticTransport] processResponseStream start');
          } catch {}
          // Signal start of message
          controller.enqueue({ type: 'start' });
          controller.enqueue({ type: 'start-step' });
          // Proactively start a text part so the SDK has a text id ready
          try {
            controller.enqueue({ type: 'text-start', id: textId });
            textStarted = true;
          } catch {}
        },

        async transform(chunk, controller) {
          // helper to enqueue and log emitted UIMessageChunks (temporary)
          const enqueueOut = (c: UIMessageChunk) => {
            try {
              // eslint-disable-next-line no-console
              console.log('[ElasticTransport ENQUEUE]', c.type, JSON.stringify(c).slice(0, 1000));
            } catch (e) {}
            try {
              controller.enqueue(c);
            } catch (e) {
              // controller may be closed; ignore here
            }
          };
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // Empty line resets event type
            if (!line.trim()) {
              currentEvent = '';
              continue;
            }

            // Skip comments
            if (line.startsWith(':')) {
              continue;
            }

            // Parse event type
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            // Parse data
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);

              // Handle [DONE] signal
              if (dataStr === '[DONE]') {
                controller.enqueue({ type: 'finish-step' });
                controller.enqueue({
                  type: 'finish',
                  finishReason: 'stop',
                });
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                // payload may be either { data: {...} } (some servers) or the chunk object directly
                const payload = parsed.data ?? parsed;

                // Determine event type: prefer explicit `event:` when present, otherwise infer from payload
                const inferredEvent = currentEvent || (
                  payload?.reasoning
                    ? 'reasoning'
                    : payload?.content
                    ? 'message_chunk'
                    : payload?.toolCall
                    ? 'tool_call'
                    : payload?.toolResult
                    ? 'tool_result'
                    : payload?.done
                    ? 'round_complete'
                    : payload?.error
                    ? 'error'
                    : ''
                );

                // Debug log: show incoming payload and inferred event
                // (temporary) - helps diagnose why UI isn't receiving parts
                try {
                  // limit depth/size to avoid huge logs
                  const safePayload = JSON.stringify(payload).slice(0, 2000);
                  // eslint-disable-next-line no-console
                  console.debug('[ElasticTransport] inferredEvent=', inferredEvent, 'payload=', safePayload);
                } catch {}

                // Map payload to UIMessageChunk events
                if (inferredEvent === 'reasoning' && payload?.reasoning) {
                  // Buffer reasoning and emit after text finishes to avoid SDK ordering issues
                  try {
                    reasoningAccumulator += (payload.reasoning ?? '') + '\n';
                  } catch {}
                } else if (inferredEvent === 'message_chunk' && (payload?.content || payload?.text_chunk)) {
                  // support both `content` and `text_chunk` fields
                  if (!textStarted) {
                    enqueueOut({ type: 'text-start', id: textId });
                    textStarted = true;
                  }
                  const textChunk = payload.content ?? payload.text_chunk ?? '';
                  textAccumulator += String(textChunk);
                  enqueueOut({ type: 'text-delta', id: textId, delta: textChunk, text: textChunk });
                } else if (inferredEvent === 'tool_call' && (payload?.toolCall || payload?.tool_id)) {
                  const tc = payload.toolCall ?? {
                    tool_id: payload.tool_id,
                    tool_call_id: payload.tool_call_id,
                    params: payload.params,
                  };
                  enqueueOut({
                    type: 'tool-input-available',
                    toolCallId: tc.tool_call_id,
                    toolName: tc.tool_id,
                    input: tc.params || {},
                  });
                } else if (inferredEvent === 'tool_result' && (payload?.toolResult || payload?.tool_call_id)) {
                  const tr = payload.toolResult ?? {
                    tool_call_id: payload.tool_call_id,
                    results: payload.results,
                  };
                  enqueueOut({
                    type: 'tool-output-available',
                    toolCallId: tr.tool_call_id,
                    output: tr.results,
                  });
                } else if (inferredEvent === 'round_complete' || payload?.done) {
                  // Close text part if open
                  if (textStarted) {
                    enqueueOut({ type: 'text-end', id: textId });
                    textStarted = false;
                  }
                  // Emit buffered reasoning after text so SDK assembles text first
                  if (reasoningAccumulator.trim()) {
                    enqueueOut({ type: 'reasoning-delta', id: reasoningId, delta: reasoningAccumulator.trim() });
                    reasoningAccumulator = '';
                  }
                  enqueueOut({ type: 'finish-step' });
                  enqueueOut({ type: 'finish', finishReason: 'stop' });
                } else if (inferredEvent === 'error' || payload?.error) {
                  if (textStarted) {
                    enqueueOut({ type: 'text-end', id: textId });
                    textStarted = false;
                  }
                  enqueueOut({ type: 'error', errorText: payload?.error ?? parsed.error ?? 'Unknown error' });
                }
              } catch (e) {
                // Skip malformed JSON
                console.warn('Failed to parse SSE data:', dataStr, e);
              }
            }
          }
        },

        flush(controller) {
          // Ensure stream is properly closed
          if (buffer.trim()) {
            console.warn('Unprocessed buffer on stream close:', buffer);
          }
          if (textStarted) {
            try {
              controller.enqueue({ type: 'text-end', id: textId });
            } catch {}
            textStarted = false;
          }
          controller.enqueue({ type: 'finish', finishReason: 'stop' });
        },
      })
    );
  }
}
