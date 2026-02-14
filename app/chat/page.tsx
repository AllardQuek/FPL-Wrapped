'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Convert technical errors into user-friendly messages
 */
function getUserFriendlyError(error: string): string {
  const errorLower = error.toLowerCase();
  
  // API endpoint not found - likely Elastic Agent not configured
  if (errorLower.includes('no handler found') || errorLower.includes('404')) {
    return "Chat feature is currently unavailable. The AI assistant needs to be configured in Elastic Cloud.";
  }
  
  // Authentication issues
  if (errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('unauthorized')) {
    return "Authentication error. Please check your Elastic Cloud credentials.";
  }
  
  // Connection issues
  if (errorLower.includes('failed to fetch') || errorLower.includes('network') || errorLower.includes('connection')) {
    return "Connection error. Please check your internet connection and try again.";
  }
  
  // Timeout
  if (errorLower.includes('timeout')) {
    return "Request timed out. The query might be too complex. Try simplifying your question.";
  }
  
  // Index/data not found
  if (errorLower.includes('index_not_found') || errorLower.includes('no data')) {
    return "No league data found. Make sure your league data has been indexed first.";
  }
  
  // Generic fallback
  return "Sorry, something went wrong. Please try again or rephrase your question.";
}

/**
 * Convert tool IDs to user-friendly names with icons
 */
function getToolDisplayName(toolId: string): string {
  const toolMap: Record<string, string> = {
    'platform.core.search': '🔍 Searching documents',
    'platform.core.elasticsearch': '📊 Querying data',
    'platform.core.aggregate': '📈 Aggregating data',
    'platform.core.sql': '💾 Running SQL query',
  };
  
  return toolMap[toolId] || `🔧 ${toolId.split('.').pop() || toolId}`;
}

interface ToolCall {
  tool_id: string;
  tool_call_id: string;
  params?: Record<string, unknown>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  toolCalls?: ToolCall[];
}

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showReasoning, setShowReasoning] = useState<Record<number, boolean>>({});
  const [showTools, setShowTools] = useState<Record<number, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsStreaming(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);

    // Add empty assistant message that we'll stream into
    const assistantMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'assistant', content: '', reasoning: [], toolCalls: [] }]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion, conversationId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let accumulatedContent = '';
      const accumulatedReasoning: string[] = [];
      const accumulatedToolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.conversationId && !conversationId) {
                setConversationId(parsed.conversationId);
              }

              if (parsed.content) {
                accumulatedContent += parsed.content;
                
                // Update UI immediately without throttling for debugging
                flushSync(() => {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
                    };
                    return newMessages;
                  });
                });
              }

              if (parsed.reasoning) {
                accumulatedReasoning.push(parsed.reasoning);
                flushSync(() => {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning,
                      toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
                    };
                    return newMessages;
                  });
                });
              }

              if (parsed.toolCall) {
                accumulatedToolCalls.push(parsed.toolCall);
                flushSync(() => {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: accumulatedToolCalls,
                    };
                    return newMessages;
                  });
                });
              }

              if (parsed.error) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[assistantMessageIndex] = {
                    role: 'assistant',
                    content: `❌ ${getUserFriendlyError(parsed.error)}`,
                  };
                  return newMessages;
                });
                break;
              }
            } catch {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      // Final update to ensure all content is displayed
      if (accumulatedContent || accumulatedReasoning.length > 0 || accumulatedToolCalls.length > 0) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: accumulatedContent,
            reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
            toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
          };
          return newMessages;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: `❌ ${getUserFriendlyError(error.message || 'Failed to get response')}`,
          };
          return newMessages;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">💬 FPL Data Chat</h1>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about your FPL leagues and manager decisions
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-4">👋 Ask me anything about your FPL data!</p>
            <div className="text-left max-w-2xl mx-auto space-y-2 text-sm">
              <p className="font-semibold">💡 Try asking:</p>
              <ul className="space-y-1 ml-4">
                <li>• Who captained Salah in GW25 in league 1305804?</li>
                <li>• Show me bench points across all gameweeks for league 1305804</li>
                <li>• Compare transfer strategies for leagues 1305804 and 999999</li>
                <li>• Who has taken the most hits this season in league 1305804?</li>
                <li>• What&apos;s the average team value in league 1305804?</li>
              </ul>
              <p className="mt-3 text-xs italic text-gray-400">
                💡 Be sure to include the league ID in your questions!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <>
                    {/* Tool Calls - Show what the agent is doing */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mb-3 border-b border-gray-300 pb-2">
                        <button
                          onClick={() =>
                            setShowTools((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 w-full text-left"
                        >
                          <span>{showTools[index] ? '▼' : '▶'}</span>
                          <span>🔧 Tool Usage ({message.toolCalls.length})</span>
                        </button>
                        {showTools[index] && (
                          <div className="mt-2 space-y-2">
                            {message.toolCalls.map((tool, toolIdx) => (
                              <div
                                key={toolIdx}
                                className="p-3 bg-blue-50 rounded-lg text-xs border-l-4 border-blue-400"
                              >
                                <div className="font-semibold text-blue-900 mb-2">
                                  {getToolDisplayName(tool.tool_id)}
                                </div>
                                {tool.params && Object.keys(tool.params).length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-gray-600 font-medium mb-1">Parameters:</div>
                                    <pre className="text-gray-700 bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap text-[11px]">
                                      {JSON.stringify(tool.params, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chain of Thought Reasoning */}
                    {message.reasoning && message.reasoning.length > 0 && (
                      <div className="mb-3 border-b border-gray-300 pb-2">
                        <button
                          onClick={() =>
                            setShowReasoning((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className="flex items-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-800 w-full text-left"
                        >
                          <span>{showReasoning[index] ? '▼' : '▶'}</span>
                          <span>💭 Chain of Thought ({message.reasoning.length} step{message.reasoning.length > 1 ? 's' : ''})</span>
                        </button>
                        {showReasoning[index] && (
                          <div className="mt-2 space-y-2">
                            {message.reasoning.map((thought, thoughtIdx) => (
                              <div
                                key={thoughtIdx}
                                className="p-3 bg-purple-50 rounded-lg text-xs text-gray-800 border-l-4 border-purple-400"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-200 text-purple-700 font-bold text-[10px]">
                                    {thoughtIdx + 1}
                                  </span>
                                  <span className="flex-1">{thought}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Live reasoning display during streaming */}
                    {isStreaming && index === messages.length - 1 && message.reasoning && message.reasoning.length > 0 && (
                      <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                        <div className="text-xs font-semibold text-purple-600 mb-2">💭 Thinking...</div>
                        {message.reasoning.map((thought, thoughtIdx) => (
                          <div
                            key={thoughtIdx}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1 h-1 rounded-full bg-purple-600"></div>
                            </div>
                            <span className="flex-1 italic text-gray-600">{thought}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Main Response */}
                    {message.content ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Style bold text
                            strong: ({ children }: { children?: ReactNode }) => (
                              <strong className="font-bold text-purple-700">{children}</strong>
                            ),
                            // Style lists
                            ul: ({ children }: { children?: ReactNode }) => (
                              <ul className="list-disc list-inside space-y-0.5 my-2">{children}</ul>
                            ),
                            ol: ({ children }: { children?: ReactNode }) => (
                              <ol className="list-decimal list-inside space-y-0.5 my-2">{children}</ol>
                            ),
                            // Style paragraphs
                            p: ({ children }: { children?: ReactNode }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            // Style code blocks
                            code: ({ className, children }: { className?: string; children?: ReactNode }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="px-1 py-0.5 bg-gray-200 rounded text-purple-700 text-xs">
                                  {children}
                                </code>
                              ) : (
                                <code className={className}>{children}</code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : !isStreaming || index !== messages.length - 1 ? null : (
                      <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span>Agent is thinking...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your FPL data..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!question.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
