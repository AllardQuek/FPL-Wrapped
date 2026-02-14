/**
 * Elastic Agent Builder client for streaming chat responses
 * Docs: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api
 */

export interface ToolCall {
  tool_id: string;
  tool_call_id: string;
  params?: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  results?: unknown[];
}

export interface ChatStreamChunk {
  content?: string;
  reasoning?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  done?: boolean;
  conversationId?: string;
  error?: string;
}

/**
 * Stream chat with Elastic Agent via Kibana Agent Builder API
 * Uses async endpoint for real-time streaming responses
 */
export async function* streamChatWithAgent(
  message: string,
  conversationId?: string
): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const esUrl = process.env.ELASTICSEARCH_URL?.replace(':443', '').replace(':9200', '');
  const agentId = process.env.ELASTIC_AGENT_ID;

  if (!esUrl || !agentId) {
    throw new Error('Missing ELASTICSEARCH_URL or ELASTIC_AGENT_ID in environment');
  }

  // Convert Elasticsearch URL to Kibana URL (.es. -> .kb.)
  const kibanaUrl = esUrl.replace('.es.', '.kb.');

  const requestBody: {
    input: string;
    agent_id: string;
    conversation_id?: string;
  } = {
    input: message,
    agent_id: agentId,
  };

  if (conversationId) {
    requestBody.conversation_id = conversationId;
  }

  const response = await fetch(`${kibanaUrl}/api/agent_builder/converse/async`, {
    method: 'POST',
    headers: {
      Authorization: `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
      'Content-Type': 'application/json',
      'kbn-xsrf': 'true',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to chat with agent: ${response.status} ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body from agent');
  }

  // Parse Server-Sent Events stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalConversationId: string | undefined = conversationId;
  let currentEvent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Yield final chunk with conversationId
        yield { done: true, conversationId: finalConversationId };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) {
          // Empty line resets event
          currentEvent = '';
          continue;
        }

        if (line.startsWith(':')) {
          // Comment, skip
          continue;
        }

        if (line.startsWith('event: ')) {
          // Set current event type
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            yield { done: true, conversationId: finalConversationId };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            
            // Event type comes from the 'event:' line in the SSE stream
            const eventType = currentEvent;
            
            // Extract data (API structure is { data: {...} })
            const eventData = parsed.data;
            
            // Handle different event types based on actual API response
            if (eventType === 'conversation_id_set' && eventData?.conversation_id) {
              finalConversationId = eventData.conversation_id;
            } else if (eventType === 'reasoning' && eventData?.reasoning) {
              // Chain of thought reasoning
              yield { reasoning: eventData.reasoning, conversationId: finalConversationId };
            } else if (eventType === 'tool_call' && eventData?.tool_id) {
              // Agent is calling a tool
              yield {
                toolCall: {
                  tool_id: eventData.tool_id,
                  tool_call_id: eventData.tool_call_id,
                  params: eventData.params,
                },
                conversationId: finalConversationId,
              };
            } else if (eventType === 'tool_result' && eventData?.tool_call_id) {
              // Tool execution result
              yield {
                toolResult: {
                  tool_call_id: eventData.tool_call_id,
                  results: eventData.results,
                },
                conversationId: finalConversationId,
              };
            } else if (eventType === 'message_chunk' && eventData?.text_chunk) {
              // Actual message content (streaming text)
              yield { content: eventData.text_chunk, conversationId: finalConversationId };
            } else if (eventType === 'round_complete') {
              // Round complete signals we're done
              yield { done: true, conversationId: finalConversationId };
              return;
            } else if (eventType === 'error' || parsed.error) {
              yield { error: parsed.error || eventData?.error || 'Unknown error', done: true };
              return;
            }
          } catch (e) {
            // Skip malformed JSON
            console.warn('Failed to parse SSE data:', data , 'Error:', e);
          }
        }
      }
    }
  } catch (error) {
    yield { error: error instanceof Error ? error.message : 'Stream error', done: true };
  } finally {
    reader.releaseLock();
  }
}
