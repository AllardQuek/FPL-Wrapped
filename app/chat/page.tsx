'use client';

import { useState, useRef, useEffect, useMemo, memo, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { Info, ChevronRight, Copy } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { PERSONA_MAP } from '@/lib/analysis/persona/constants';
import { getPersonaImagePath } from '@/lib/constants/persona-images';
import { getCurrentFPLSeason } from '@/lib/season';
import { parseVegaSpec, prepareSpec, createSecureLoader } from '@/lib/chat/charts';
import type { VisualizationSpec } from 'vega-embed';

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

/**
 * A collapsible table component for Raw Data
 */
function CollapsibleTable({ children, hasChart }: { children: ReactNode; hasChart: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const tableContent = (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/10 custom-scrollbar shadow-2xl bg-black/20">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );

  if (!hasChart) return tableContent;

  return (
    <div className="group my-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 cursor-pointer text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-[#00ff87] transition-colors outline-none"
      >
        <span
          className={`w-6 h-6 flex items-center justify-center rounded bg-white/5 border border-white/10 transition-transform ${isOpen ? 'rotate-180 text-[#00ff87] border-[#00ff87]/30' : 'text-white/80'}`}
          aria-hidden
        >
          <ChevronRight className="w-4 h-4" />
        </span>
        Raw Data Source
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              {tableContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ChartRenderer = memo(function ChartRenderer({ spec }: { spec: string | object }) {
  const el = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  // Keep track of the last successfully rendered spec to avoid flickering
  const lastValidSpec = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    // Use a small delay for streaming content to avoid parsing partial JSON
    const timeout = setTimeout(async () => {
      if (!el.current) return;
      
      try {
        const vegaEmbed = (await import('vega-embed')).default;
        
        // 1. Parse the spec. If it fails, we assume it's still streaming/invalidly formatted.
        let parsed;
        try {
          parsed = await parseVegaSpec(spec);
        } catch {
          // If we haven't rendered anything yet, keep loading. 
          // If we have, just stay on the last valid one until this one is fixed.
          return;
        }

        if (cancelled) return;

        // 2. Prepare the spec
        const { safeSpec, title: extractedTitle } = prepareSpec(parsed);
        
        // Compare with last valid to avoid redundant re-renders
        const specString = JSON.stringify(safeSpec);
        if (lastValidSpec.current === specString) {
          setLoading(false);
          setIsReady(true);
          return;
        }

        // 3. Create secure loader and render
        const loader = await createSecureLoader();
        if (cancelled) return;

        // Only show loading if we haven't rendered anything successful yet
        if (!lastValidSpec.current) {
          setLoading(true);
          setIsReady(false);
        }
        setError(null);

        await vegaEmbed(el.current, safeSpec as VisualizationSpec, { 
          actions: false, 
          renderer: 'svg', 
          loader,
          tooltip: true,
          theme: 'dark'
        });

        if (!cancelled) {
          lastValidSpec.current = specString;
          if (extractedTitle) setTitle(extractedTitle);
          setLoading(false);
          
          // Small delay to ensure browser has painted the SVG before we fade it in
          requestAnimationFrame(() => {
            if (!cancelled) setIsReady(true);
          });
        }
      } catch (err) {
        // Only show error if we've completely stopped streaming or it's a fatal render error
        if (!cancelled) {
          setError(err instanceof Error ? getUserFriendlyError(err.message) : String(err));
          setLoading(false);
        }
      }
    }, typeof spec === 'string' && spec.length < 1000 ? 100 : 0); // Smaller delay for small specs
    
    return () => { 
      cancelled = true; 
      clearTimeout(timeout);
    };
  }, [spec]);

  return (
    <div className="w-full my-6 relative group overflow-visible">
      <div className="glass-card w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all hover:border-[#00ff87]/30">
        {title && (
          <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-white/10 to-transparent flex items-center justify-between">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,135,0.4)]">{title}</div>
            <div className="flex gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            </div>
          </div>
        )}

        <div className="p-1 sm:p-2 bg-black/20 flex items-center justify-center relative min-h-[300px]">
          <div 
            ref={el} 
            className={`w-full flex justify-center items-center interactive-chart overflow-hidden transition-opacity duration-500 [&>.vega-embed]:!max-w-full [&>.vega-embed]:!w-full [&_svg]:mx-auto ${isReady ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          <AnimatePresence mode="wait">
            {(loading && !lastValidSpec.current) && (
              <motion.div 
                key="loading-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-[#0d0015]/40 backdrop-blur-[2px] z-10"
              >
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 border-2 border-[#00ff87]/5 border-t-[#00ff87] rounded-full animate-spin" />
                  <div className="text-[#00ff87] text-[10px] font-black uppercase tracking-widest">Generating Visualization...</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border-t border-red-500/20">
            <div className="text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});


interface ToolCall {
  tool_id: string;
  tool_call_id: string;
  params?: Record<string, unknown>;
  results?: unknown[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  toolCalls?: ToolCall[];
}

/**
 * Shared markdown components that don't depend on message state
 */
const BASE_MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mt-4 first:mt-0 mb-4 last:mb-0 leading-relaxed text-white/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 mt-6 mb-8 pl-2 border-l-2 border-[#00ff87]/20 bg-white/5 p-4 rounded-xl shadow-inner">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 mt-6 mb-8 pl-2 border-l-2 border-[#00ff87]/20 bg-white/5 p-4 rounded-xl shadow-inner">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-white/80 mb-1 last:mb-0">{children}</li>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5 border-b border-white/10 whitespace-nowrap">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-[#00ff87]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-b border-white/5 text-white/80 whitespace-nowrap">
      {children}
    </td>
  ),
};

/**
 * MessageContent handles memoized markdown rendering to prevent flickering 
 * on unrelated state changes (like input typing)
 */
const MessageContent = memo(function MessageContent({ message }: { message: Message }) {
  const md = useMemo(() => transformVisualizations(message.content || ''), [message.content]);

  const components: Components = useMemo(() => ({
          ...BASE_MARKDOWN_COMPONENTS,
          table: ({ children }) => {
            const hasChart = message.content?.includes('viz://') || message.content?.includes('```vega-lite');
            return <CollapsibleTable hasChart={hasChart}>{children}</CollapsibleTable>;
          },
          code: ({ className, children }) => {
            const isInline = !className;
            if (!isInline && className?.includes('language-vega-lite')) {
              const content = Array.isArray(children) ? children.join('') : String(children || '');
              return <ChartRenderer spec={content} />;
            }
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
          img: (props) => {
            const { src, alt } = props;
            
            // Validate src: must be a non-empty string to work with Next.js Image.
            if (!src || typeof src !== 'string' || src.trim() === '' || src === 'null' || src === 'undefined') {
              return null;
            }

            if (src.startsWith('viz://')) {
              const id = src.slice('viz://'.length);
              const tc = message.toolCalls?.find((t) => t.tool_call_id === id);
              if (tc?.results && Array.isArray(tc.results) && tc.results.length > 0) {
                // Tool results can be complex objects
                const first = tc.results[0] as Record<string, unknown>;
                
                // If the tool result is a visualization spec, render it using ChartRenderer.
                const possibleSpec = (first?.vega || first?.spec || first?.['vega-lite'] || first?.vega_lite) as string | object | undefined;
                if (possibleSpec) {
                  return <ChartRenderer spec={possibleSpec} />;
                }
                
                // If the tool result is a data URI, render it as an optimized Image.
                if (typeof first === 'string' && (first as string).startsWith('data:image')) {
                  return (
                    <Image 
                      src={first as string} 
                      alt={alt || 'Visual representation'} 
                      width={800} 
                      height={600} 
                      sizes="100vw" 
                      className="w-full h-auto rounded-xl object-contain my-4 px-1" 
                      unoptimized 
                    />
                  );
                }
                
                const dataObj = first?.data as { values: unknown[] } | undefined;
                if (dataObj && Array.isArray(dataObj.values)) {
                  const vegaSpec = { 
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json', 
                    data: { values: dataObj.values }, 
                    mark: 'bar', 
                    encoding: {} 
                  };
                  return <ChartRenderer spec={vegaSpec} />;
                }
                return <pre className="p-3 bg-black/20 rounded-xl text-sm mt-2">{JSON.stringify(tc.results, null, 2)}</pre>;
              }
              return <div className="italic text-white/60 p-4 border border-white/5 rounded-xl my-4">Generating visualization...</div>;
            }
            
            return (
              <Image 
                src={src} 
                alt={alt || 'Image'} 
                width={800} 
                height={600} 
                sizes="100vw" 
                className="w-full h-auto rounded-xl object-contain my-4 px-1" 
              />
            );
          },
        }), [message.content, message.toolCalls]);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00ff87] prose-a:text-[#00ff87] prose-strong:text-[#00ff87] prose-strong:font-black">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
});

// Replace <visualization tool-result-id="ID"/> with an image placeholder src 'viz://ID'
function transformVisualizations(content: string) {
  if (!content) return '';
  const regex = /<visualization[^>]*tool-result-id="([^"]+)"[^>]*\/>/g;
  return content.replace(regex, (_m, id) => `\n\n![](viz://${id})\n\n`);
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  // Dynamic question suggestions state
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const suggestionPrefixes = useMemo(() => [
    "Summarise GW26",
    "Who had the biggest bench regrets",
    "Analyze the captaincy picks",
    "Compare managers",
    "Who took the most hits"
  ], []);

  useEffect(() => {
    if (messages.length > 0) return;
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % suggestionPrefixes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length, suggestionPrefixes.length]);

  // Featured personas for the empty state
  const featuredPersonaKeys = ['PEP', 'AMORIM', 'ARTETA', 'EMERY'] as const;
  const featuredPersonas = featuredPersonaKeys.map(key => ({
    ...PERSONA_MAP[key],
    image: getPersonaImagePath(key),
  }));

  // Auto-scroll to bottom when new messages arrive or container height changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isInternalScroll = false;
    let lastUserScrollTime = 0;
    let rafId: number;
    let animation: { stop: () => void } | null = null;

    const handleUserScroll = () => {
      if (!isInternalScroll) {
        lastUserScrollTime = Date.now();
        if (animation) animation.stop();
      }
    };

    container.addEventListener('scroll', handleUserScroll, { passive: true });

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (!container) return;
      
      const targetScrollTop = container.scrollHeight - container.clientHeight;
      if (Math.abs(container.scrollTop - targetScrollTop) < 2) return; 

      if (animation) animation.stop();

      isInternalScroll = true;
      if (behavior === 'smooth') {
        animation = animate(container.scrollTop, targetScrollTop, {
          type: "spring",
          stiffness: 150,
          damping: 25,
          onUpdate: (latest) => {
            container.scrollTop = latest;
          },
          onComplete: () => {
            isInternalScroll = false;
            animation = null;
          }
        });
      } else {
        container.scrollTop = targetScrollTop;
        setTimeout(() => { isInternalScroll = false; }, 100);
      }
    };

    let lastScrollHeight = container.scrollHeight;

    const resizeObserver = new ResizeObserver(() => {
      const currentScrollHeight = container.scrollHeight;
      const isShrinking = currentScrollHeight < lastScrollHeight;
      lastScrollHeight = currentScrollHeight;

      if (isShrinking && !isStreaming) return;
      if (Date.now() - lastUserScrollTime < 2000) return;

      const threshold = 150;
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isAtBottom = distanceFromBottom < threshold;
      
      if (isAtBottom || (isStreaming && distanceFromBottom < 500)) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          scrollToBottom(isStreaming ? 'smooth' : 'auto');
        });
      }
    });

    resizeObserver.observe(container);

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        scrollToBottom('smooth');
      }
    }

    return () => {
      container.removeEventListener('scroll', handleUserScroll);
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      if (animation) animation.stop();
    };
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
                const tr = parsed.toolResult as { tool_call_id: string; results: unknown[] };
                // Attach results to an existing accumulated tool call if present
                const idx = accumulatedToolCalls.findIndex((tc) => tc.tool_call_id === tr.tool_call_id);
                if (idx !== -1) {
                  accumulatedToolCalls[idx].results = tr.results;
                } else {
                  // If no matching call, push a synthetic entry so UI can still reference it
                  accumulatedToolCalls.push({ 
                    tool_id: 'tool-result', 
                    tool_call_id: tr.tool_call_id, 
                    params: {}, 
                    results: tr.results 
                  });
                }

                // Refresh UI so any visualization tags referencing this tool_call_id render
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
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pt-4 space-y-8 custom-scrollbar"
          style={{ overflowAnchor: 'auto' }}
        >
          {/* Sticky Mini-Info Indicator */}
          <div className="sticky top-0 z-20 flex justify-center pointer-events-none pb-4">
            <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white/30 text-[9px] font-black tracking-[0.2em] uppercase shadow-2xl">
              Season {currentSeason} • chat
            </div>
          </div>
          {/* Persistent Discovery Header */}
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-12 mb-12 animate-fade-in px-4">
              {/* Introduction & Guidance */}
              <div className="text-center space-y-6 pt-4">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none italic">
                  FPL <span className="text-[#00ff87] glow-text not-italic">CHAT</span>
                </h2>
                <p className="text-sm text-white/50 max-w-lg mx-auto font-medium">
                  Analyze league trends, manager styles, and performance.
                </p>
              </div>

              <div className="inline-flex items-start md:items-center gap-3 px-4 py-2.5 max-w-lg mx-auto text-left">
                <span className="shrink-0 text-[10px] font-black uppercase text-[#00ff87]/60 border border-[#00ff87]/10 px-1.5 py-0.5 rounded leading-none mt-0.5 md:mt-0">Beta</span>
                <p className="text-[11px] text-white/30 leading-normal font-medium">
                  Data is indexed on a best-effort basis and may not always succeed. If you&apos;re missing results, try pre-loading via 
                  <a href="/onboard" className="text-[#00ff87]/40 hover:text-[#00ff87] hover:underline ml-1 transition-colors">/onboard</a>.
                </p>
              </div>
            </div>

            {/* Discovery Engine Controls */}
            <div className="space-y-12 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Left: Quick Explore */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Try a question</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.01, translateY: -4, rotateX: 2, rotateY: -1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                  >
                    <button
                      onClick={() => setQuestion(`${suggestionPrefixes[suggestionIndex]} in league [ID]`)}
                      className="group w-full flex flex-col items-center justify-center gap-4 px-8 py-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 transition-all duration-500 relative overflow-hidden h-[180px] shadow-2xl shadow-black/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00ff87]/0 via-[#00ff87]/5 to-[#00ff87]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      
                      <div className="relative h-8 flex items-center justify-center w-full z-10" style={{ transform: 'translateZ(30px)' }}>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={suggestionIndex}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute whitespace-nowrap text-white/90 font-medium text-sm md:text-base text-center italic tracking-tight px-4"
                          >
                            &ldquo;{suggestionPrefixes[suggestionIndex]}&rdquo;
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <div 
                        className="flex items-center gap-3 z-10 mt-2"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        <div className="flex items-center gap-2 text-white/30 font-medium text-[11px] md:text-sm">
                          <span>in league</span>
                          <span className="text-[#00ff87]/50 font-mono border-b border-[#00ff87]/20 pb-0.5">[ID]</span>
                        </div>
                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00ff87]/30 group-hover:text-[#00ff87]/80 transition-all duration-300" />
                      </div>
                    </button>
                  </motion.div>
                </div>

                {/* Right: Scout Personas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Scout Personas</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 h-[180px]">
                    {featuredPersonas.map((p, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02, translateY: -2, rotateX: 1, rotateY: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                      >
                        <button
                          onClick={() => setQuestion(`Which managers in league [ID] follow a strategic style similar to ${p.name.split(' ').pop()}?`)}
                          className="group w-full h-full flex items-center gap-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 transition-all duration-300 relative overflow-hidden shadow-xl shadow-black/40"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-[#00ff87]/40 transition-all shrink-0" style={{ transform: 'translateZ(20px)' }}>
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              sizes="40px"
                            />
                          </div>
                          <div className="text-left min-w-0" style={{ transform: 'translateZ(10px)' }}>
                            <p className="text-[7px] font-black tracking-widest text-[#00ff87]/40 uppercase leading-none mb-1 truncate">{p.title}</p>
                            <h4 className="text-[10px] font-bold text-white/80 uppercase group-hover:text-[#00ff87] transition-colors truncate">
                              {p.name.split(' ').pop()}
                            </h4>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="max-w-4xl mx-auto w-full space-y-8 px-4">
            {messages.map((message, messageIndex) => {
              const isLatestUserMessage = message.role === 'user' && messageIndex === messages.length - 1;
              const isLatestAssistantMessage = message.role === 'assistant' && messageIndex === messages.length - 1;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} ${isLatestUserMessage || (isLatestAssistantMessage && !message.content) ? 'animate-slide-in' : ''}`}
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
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00d4ff] hover:brightness-125 transition-all outline-none"
                            aria-expanded={showTools[messageIndex]}
                          >
                            <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-[#00d4ff]/10 border border-[#00d4ff]/20 transition-transform ${showTools[messageIndex] ? 'rotate-180 text-[#00d4ff]' : 'text-white/80'}`} aria-hidden>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                            <span>System Operations ({message.toolCalls.length})</span>
                          </button>
                          <AnimatePresence>
                            {showTools[messageIndex] && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
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
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a855f7] hover:brightness-125 transition-all outline-none"
                            aria-expanded={showReasoning[messageIndex]}
                          >
                            <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-[#a855f7]/10 border border-[#a855f7]/20 transition-transform ${showReasoning[messageIndex] ? 'rotate-180 text-[#a855f7]' : 'text-white/80'}`} aria-hidden>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                            <span>Manager Logic {message.reasoning && message.reasoning.length > 0 ? `(${message.reasoning.length})` : ''}</span>
                            {isStreaming && messageIndex === messages.length - 1 && (
                              <span className="ml-auto flex items-center gap-2">
                                <span className="text-[8px] font-black tracking-widest opacity-40">PROCESSING LOGS</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse"></span>
                              </span>
                            )}
                          </button>

                          <AnimatePresence>
                            {showReasoning[messageIndex] && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Main Response content */}
                      <MessageContent message={message} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>
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
                  placeholder="Chat with your FPL data"
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
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
}
