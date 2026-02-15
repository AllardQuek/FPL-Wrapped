'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { Info } from 'lucide-react';
import { PERSONA_MAP } from '@/lib/analysis/persona/constants';
import { getPersonaImagePath } from '@/lib/constants/persona-images';
import { getCurrentFPLSeason } from '@/lib/season';

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

  // Terminated or interrupted
  if (errorLower.includes('terminated') || errorLower.includes('interrupted')) {
    return "The operation was interrupted. This usually happens if the search took too long or was cancelled. Try a narrower search.";
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
  id: string;
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
  const currentSeason = getCurrentFPLSeason();
  const mounted = typeof window !== 'undefined';

  // Lazy initialize particles on client side only
  const [particles] = useState<Array<{ left: number; delay: number; duration: number }>>(() => {
    if (typeof window === 'undefined') return [];
    return Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
    }));
  });

  // Featured personas for the empty state
  const featuredPersonaKeys = ['PEP', 'AMORIM', 'ARTETA', 'EMERY'] as const;
  const featuredPersonas = featuredPersonaKeys.map(key => ({
    ...PERSONA_MAP[key],
    image: getPersonaImagePath(key),
  }));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use 'auto' behavior during active streaming to prevent choppy animations
    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? 'auto' : 'smooth',
      block: 'end'
    });
  }, [messages, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsStreaming(true);

    // Batch user and initial assistant messages to avoid transition flicker
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessageIndex = messages.length + 1;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userQuestion },
      { id: assistantMsgId, role: 'assistant', content: '', reasoning: [], toolCalls: [] }
    ]);

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
      let isCompleted = false;
      let hasError = false;
      const accumulatedReasoning: string[] = [];
      const accumulatedToolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done || isCompleted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              isCompleted = true;
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
                      id: assistantMsgId,
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
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: [...accumulatedReasoning],
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
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: [...accumulatedToolCalls],
                    };
                    return newMessages;
                  });
                });
              }

              if (parsed.toolResult) {
                // Update specific tool call with result if needed, or just refresh UI
                flushSync(() => {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: [...accumulatedToolCalls],
                    };
                    return newMessages;
                  });
                });
              }

              if (parsed.error) {
                hasError = true;
                isCompleted = true;
                flushSync(() => {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const existing = newMessages[assistantMessageIndex];
                    newMessages[assistantMessageIndex] = {
                      ...existing,
                      id: assistantMsgId,
                      role: 'assistant',
                      content: `❌ ${getUserFriendlyError(parsed.error)}`,
                    };
                    return newMessages;
                  });
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
      // Don't overwrite if an error message was already set
      if (!hasError && (accumulatedContent || accumulatedReasoning.length > 0 || accumulatedToolCalls.length > 0)) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            id: assistantMsgId,
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
          const existing = newMessages[assistantMessageIndex];
          newMessages[assistantMessageIndex] = {
            ...existing,
            id: assistantMsgId,
            role: 'assistant',
            content: `❌ ${getUserFriendlyError(error instanceof Error ? error.message : 'Failed to get response')}`,
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
    <div className="relative min-h-screen gradient-bg overflow-hidden flex flex-col">
      {/* Background particles */}
      <div className="particles">
        {mounted && particles.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto w-full px-4 pt-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-8 scroll-smooth custom-scrollbar">
          {/* Sticky Mini-Info Indicator */}
          <div className="sticky top-0 z-20 flex justify-center pointer-events-none pb-4">
            <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white/30 text-[9px] font-black tracking-[0.2em] uppercase shadow-2xl">
              Season {currentSeason} • chat
            </div>
          </div>
          {/* Persistent Discovery Header */}
          <div className="max-w-4xl mx-auto w-full space-y-12 mb-12 animate-fade-in px-4">
            {/* Introduction & Guidance */}
            <div className="text-center space-y-4 pt-4">
              <div className="inline-block px-3 py-1 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 text-[10px] font-black tracking-widest text-[#00ff87] uppercase mb-2">
                AI Assistant
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none italic">
                FPL <span className="text-[#00ff87] glow-text not-italic">CHAT</span>
              </h2>
              <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed font-medium">
                Ask anything about your league's managers, performance, and trends. <br className="hidden md:block" />
                Select a profile to explore or try a suggestion below.
              </p>
            </div>

            {/* Manager Archetypes Section */}
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#00ff87]">Manager Profiles</h3>
              </div>

              <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                {featuredPersonas.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(`Which managers in my league follow a strategic style similar to ${p.name.split(' ').pop()}?`)}
                    className="group flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#00ff87] transition-all shadow-xl">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        sizes="56px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-[8px] font-black text-[#00ff87] uppercase tracking-tighter">Scout</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black tracking-widest text-[#00ff87]/60 uppercase leading-none mb-1">{p.title}</p>
                      <h4 className="text-[10px] font-black text-white uppercase group-hover:text-[#00ff87] transition-colors tracking-wider">
                        {p.name.split(' ').pop()}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategic Research Pills */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">Try a Question</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "What happened in GW26 in league 1305804?",
                  "Who had the biggest bench regrets in league 1305804?",
                  "Analyze the captaincy picks in league 1305804",
                  "Compare the top performers in league 1305804"
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-white/5 hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 transition-all text-[11px] font-bold text-white/60 hover:text-[#00ff87]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto w-full space-y-8 px-4">
            {messages.map((message, messageIndex) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-in`}
                style={{ animationDelay: `${messageIndex * 50}ms` }}
              >
                {/* Avatar Placeholder */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${message.role === 'user'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-[#00ff87]'
                  }`}>
                  <span className="text-[10px] font-black">
                    {message.role === 'user' ? 'ME' : 'AI'}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-2xl transition-all ${message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none'
                    : 'glass-card border-white/10 text-white rounded-tl-none'
                    }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap font-medium leading-relaxed">{message.content}</div>
                  ) : (
                    <>
                      {/* Tool Calls */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className={`${message.content ? 'mb-4 pb-3 border-b border-white/10' : 'mb-1 pb-1'}`}>
                          <button
                            onClick={() =>
                              setShowTools((prev) => ({
                                ...prev,
                                [messageIndex]: !prev[messageIndex],
                              }))
                            }
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:brightness-125 w-full text-left"
                            aria-expanded={showTools[messageIndex]}
                          >
                            <span className="text-[8px]">{showTools[messageIndex] ? '▼' : '▶'}</span>
                            <span>System Operations ({message.toolCalls.length})</span>
                          </button>
                          {showTools[messageIndex] && (
                            <div className="mt-3 space-y-3">
                              {message.toolCalls.map((tool, toolIdx) => (
                                <div
                                  key={toolIdx}
                                  className="p-3 bg-black/20 rounded-xl text-[11px] border border-white/5"
                                >
                                  <div className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                    {getToolDisplayName(tool.tool_id)}
                                  </div>
                                  {tool.params && Object.keys(tool.params).length > 0 && (
                                    <pre className="text-white/50 bg-black/30 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono mt-1">
                                      {JSON.stringify(tool.params, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reasoning / Live Logic */}
                      {((message.reasoning && message.reasoning.length > 0) || (isStreaming && messageIndex === messages.length - 1)) && (
                        <div className={`${message.content ? 'mb-4 pb-3 border-b border-white/10' : 'mb-1 pb-1'}`}>
                          <button
                            onClick={() =>
                              setShowReasoning((prev) => ({
                                ...prev,
                                [messageIndex]: !prev[messageIndex],
                              }))
                            }
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:brightness-125 w-full text-left"
                            aria-expanded={showReasoning[messageIndex]}
                          >
                            <span className="text-[8px]">{showReasoning[messageIndex] ? '▼' : '▶'}</span>
                            <span>Manager Logic {message.reasoning && message.reasoning.length > 0 ? `(${message.reasoning.length})` : ''}</span>
                            {isStreaming && messageIndex === messages.length - 1 && (
                              <span className="ml-auto flex items-center gap-2">
                                <span className="text-[8px] font-black tracking-widest opacity-50">FIELD REPORT IN PROGRESS</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse"></span>
                              </span>
                            )}
                          </button>

                          {showReasoning[messageIndex] && (
                            <div className="mt-3 space-y-3">
                              {message.reasoning?.map((thought, thoughtIdx) => {
                                const isLatest = isStreaming && messageIndex === messages.length - 1 && thoughtIdx === message.reasoning!.length - 1;
                                return (
                                  <div
                                    key={thoughtIdx}
                                    className={`flex items-start gap-2.5 text-[12px] transition-all duration-300 ${isLatest ? 'text-[#00ff87] font-bold' : 'text-white/70'}`}
                                  >
                                    <span className={`mt-1 font-bold ${isLatest ? 'text-[#00ff87] animate-pulse' : 'text-purple-500'}`}>
                                      {isLatest ? '▶' : '↳'}
                                    </span>
                                    <span className={`${isLatest ? '' : 'italic'} leading-relaxed`}>{thought}</span>
                                  </div>
                                );
                              })}

                              {/* Pulse for starting state or tool calls if no reasoning yet */}
                              {isStreaming && messageIndex === messages.length - 1 && (!message.reasoning || message.reasoning.length === 0) && (
                                <div className="flex items-center gap-3 px-1 text-[#00ff87]">
                                  <div className="flex gap-1.5">
                                    <div className="w-1 h-1 bg-[#00ff87] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 bg-[#00ff87] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-[#00ff87] rounded-full animate-bounce"></div>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                    {message.toolCalls && message.toolCalls.length > 0
                                      ? getToolDisplayName(message.toolCalls[message.toolCalls.length - 1].tool_id).replace(/^[^\s]+\s+/, '')
                                      : 'Strategizing'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Response content */}
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00ff87] prose-a:text-[#00ff87] prose-strong:text-[#00ff87] prose-strong:font-black">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }: { children?: ReactNode }) => (
                              <p className="mb-4 last:mb-0 leading-relaxed text-white/90">{children}</p>
                            ),
                            ul: ({ children }: { children?: ReactNode }) => (
                              <ul className="list-disc list-inside space-y-2 my-4 pl-2 border-l-2 border-[#00ff87]/20 bg-white/5 p-4 rounded-xl">{children}</ul>
                            ),
                            li: ({ children }: { children?: ReactNode }) => (
                              <li className="text-white/80">{children}</li>
                            ),
                            table: ({ children }: { children?: ReactNode }) => (
                              <div className="my-6 overflow-x-auto rounded-xl border border-white/10 custom-scrollbar">
                                <table className="w-full border-collapse text-left text-sm">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }: { children?: ReactNode }) => (
                              <thead className="bg-white/5 border-b border-white/10 whitespace-nowrap">
                                {children}
                              </thead>
                            ),
                            th: ({ children }: { children?: ReactNode }) => (
                              <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-[#00ff87]">
                                {children}
                              </th>
                            ),
                            td: ({ children }: { children?: ReactNode }) => (
                              <td className="px-4 py-3 border-b border-white/5 text-white/80 whitespace-nowrap">
                                {children}
                              </td>
                            ),
                            code: ({ className, children }: { className?: string; children?: ReactNode }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="px-1.5 py-0.5 bg-[#37003c] text-[#00ff87] rounded font-mono text-xs border border-white/10">
                                  {children}
                                </code>
                              ) : (
                                <div className="relative group">
                                  <pre className="p-4 bg-black/40 rounded-xl border border-white/5 overflow-x-auto font-mono text-xs my-4">
                                    <code className={className}>{children}</code>
                                  </pre>
                                </div>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input */}
          <div className="mt-auto pb-8 pt-4">
            <div className="flex justify-end mb-2 px-2">
              <div className="group relative">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#00ff87] cursor-help transition-colors">
                  <Info size={10} />
                  Missing Data?
                </div>
                <div className="absolute right-0 bottom-full mb-3 w-56 p-3 bg-[#0d0015]/95 border border-white/10 rounded-xl text-[10px] text-white/50 font-medium normal-case tracking-normal opacity-0 group-hover:opacity-100 transition-all pointer-events-none backdrop-blur-xl z-[100] shadow-2xl origin-bottom-right scale-95 group-hover:scale-100">
                  <div className="text-white font-black uppercase tracking-widest text-[8px] mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#00ff87]"></span>
                    Data Coverage
                  </div>
                  <p className="leading-relaxed">
                    Missing results? We may not have indexed your manager or league ID yet.
                  </p>
                  <a href="/onboard" className="mt-2 inline-block text-[#00ff87] hover:underline pointer-events-auto font-black">
                    Manual Onboarding &rarr;
                  </a>
                  {/* Arrow */}
                  <div className="absolute -bottom-1 right-3 w-2 h-2 bg-[#0d0015] border-b border-r border-white/10 rotate-45"></div>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff87] to-[#e90052] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
              <div className="relative flex gap-2 glass-card p-2 rounded-2xl border-white/20">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask your FPL Data Analyst..."
                  aria-label="FPL chat question"
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-4 py-3 text-base font-bold min-w-0"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="Stop generating"
                    className="bg-[#e90052] hover:bg-[#ff005c] text-white font-black px-6 py-3 rounded-xl transition-all flex items-center justify-center active:scale-95 shadow-lg"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    aria-label="Send question"
                    className="bg-[#00ff87] hover:bg-[#00e67a] text-[#0d0015] font-black px-8 py-3 rounded-xl transition-all flex items-center justify-center whitespace-nowrap active:scale-95 shadow-lg disabled:opacity-30 disabled:grayscale disabled:scale-100"
                  >
                    <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div >
  );
}
