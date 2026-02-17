'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { PERSONA_MAP } from '@/lib/analysis/persona/constants';
import { getPersonaImagePath } from '@/lib/constants/persona-images';
import { getCurrentFPLSeason } from '@/lib/season';
import { buildFinalPrompt } from '@/lib/chat/prompt';
import { ToneId } from '@/lib/chat/constants';
import { getUserFriendlyError, type Message, type ToolCall } from '@/lib/chat/utils';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageItem } from '@/components/chat/MessageItem';
import { ChatInput } from '@/components/chat/ChatInput';
import { Particles } from '@/components/ui/Particles';
import { useAutoScroll } from '@/lib/chat/hooks/useAutoScroll';



export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneId>('balanced');
  const [leagueId, setLeagueId] = useState('');
  const [isUsingSuggestion, setIsUsingSuggestion] = useState(false);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showReasoning, setShowReasoning] = useState<Record<number, boolean>>({});
  const [showTools, setShowTools] = useState<Record<number, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSeason = getCurrentFPLSeason();

  const { scrollContainerRef } = useAutoScroll({ messages, isStreaming });

  // Persist league ID
  useEffect(() => {
    const saved = localStorage.getItem('fpl_wrapped_league_id');
    if (saved) setLeagueId(saved);
  }, []);

  useEffect(() => {
    if (leagueId) {
      localStorage.setItem('fpl_wrapped_league_id', leagueId);
    }
  }, [leagueId]);

  // Dynamic question suggestions state
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const suggestionPrefixes = useMemo(() => [
    "Generate my FPL Wrapped'",
    "Summarise GW26",
    "Who had the biggest bench regrets",
    "Analyze the captaincy picks",
    "Compare managers",
    "Who took the most hits"
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % suggestionPrefixes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [suggestionPrefixes.length]);

  // Featured personas for the empty state
  const featuredPersonaKeys = ['PEP', 'ARTETA', 'AMORIM', 'MOURINHO'] as const;
  const featuredPersonas = featuredPersonaKeys.map(key => ({
    key,
    ...PERSONA_MAP[key],
    image: getPersonaImagePath(key),
  }));

  const handlePersonaSelect = (key: string) => {
    if (selectedPersonaKey === key) {
      setSelectedPersonaKey(null);
      return;
    }
    setSelectedPersonaKey(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;

    const userQuestion = question.trim();
    
    // Inject identity, tone and visualization instructions using shared helper
    const finalPrompt = buildFinalPrompt(userQuestion, { 
      personaKey: selectedPersonaKey || undefined, 
      toneId: selectedTone
    });

    setQuestion('');
    setIsStreaming(true);

    // Batch user and initial assistant messages to avoid transition flicker
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    
    // We'll use a functional update for messages to ensure we're working with latest state
    setMessages((prev) => {
      return [
        ...prev,
        { id: userMsgId, role: 'user', content: userQuestion },
        { id: assistantMsgId, role: 'assistant', content: '', reasoning: [], toolCalls: [] }
      ];
    });

    // Create a local reference to the controller for this specific request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: finalPrompt, 
          conversationId 
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
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

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
                    ? newMessages.length - 1 
                    : newMessages.findIndex(m => m.id === assistantMsgId);
                  
                  if (idx !== -1 && newMessages[idx].role === 'assistant') {
                    newMessages[idx] = {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
                    };
                  }
                  return newMessages;
                });
              }

              if (parsed.reasoning) {
                accumulatedReasoning.push(parsed.reasoning);
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
                    ? newMessages.length - 1 
                    : newMessages.findIndex(m => m.id === assistantMsgId);

                  if (idx !== -1 && newMessages[idx].role === 'assistant') {
                    newMessages[idx] = {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: [...accumulatedReasoning],
                      toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
                    };
                  }
                  return newMessages;
                });
              }

              if (parsed.toolCall) {
                accumulatedToolCalls.push(parsed.toolCall);
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
                    ? newMessages.length - 1 
                    : newMessages.findIndex(m => m.id === assistantMsgId);

                  if (idx !== -1 && newMessages[idx].role === 'assistant') {
                    newMessages[idx] = {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: [...accumulatedToolCalls],
                    };
                  }
                  return newMessages;
                });
              }
              if (parsed.toolResult) {
                const tr = parsed.toolResult as { tool_call_id: string; results: unknown[] };
                // Attach results to an existing accumulated tool call if present
                const idxTC = accumulatedToolCalls.findIndex((tc) => tc.tool_call_id === tr.tool_call_id);
                if (idxTC !== -1) {
                  accumulatedToolCalls[idxTC].results = tr.results;
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
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
                    ? newMessages.length - 1 
                    : newMessages.findIndex(m => m.id === assistantMsgId);

                  if (idx !== -1 && newMessages[idx].role === 'assistant') {
                    newMessages[idx] = {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
                      toolCalls: [...accumulatedToolCalls],
                    };
                  }
                  return newMessages;
                });
              }

              if (parsed.error) {
                const errorStr = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
                console.error('Agent SSE error:', parsed.error);
                
                // If conversation is lost, clear it so next message starts fresh
                if (errorStr.includes('conversationNotFound')) {
                  setConversationId(undefined);
                }

                hasError = true;
                isCompleted = true;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
                    ? newMessages.length - 1 
                    : newMessages.findIndex(m => m.id === assistantMsgId);

                  if (idx !== -1 && newMessages[idx].role === 'assistant') {
                    newMessages[idx] = {
                      ...newMessages[idx],
                      content: `❌ ${getUserFriendlyError(errorStr)}`,
                    };
                  }
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
      // Don't overwrite if an error message was already set
      if (!hasError && (accumulatedContent || accumulatedReasoning.length > 0 || accumulatedToolCalls.length > 0)) {
        setMessages((prev) => {
          const newMessages = [...prev];
          const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
            ? newMessages.length - 1 
            : newMessages.findIndex(m => m.id === assistantMsgId);
          
          if (idx !== -1 && newMessages[idx].role === 'assistant') {
            newMessages[idx] = {
              id: assistantMsgId,
              role: 'assistant',
              content: accumulatedContent,
              reasoning: accumulatedReasoning.length > 0 ? accumulatedReasoning : undefined,
              toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
            };
          }
          return newMessages;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        
        // If conversation is lost, clear it so next message starts fresh
        if (error.message.includes('conversationNotFound') || error.message.includes('404')) {
          setConversationId(undefined);
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          const idx = newMessages.findIndex(m => m.id === assistantMsgId) === -1 
            ? newMessages.length - 1 
            : newMessages.findIndex(m => m.id === assistantMsgId);

          if (idx !== -1 && newMessages[idx].role === 'assistant') {
            newMessages[idx] = {
              ...newMessages[idx],
              content: `❌ ${getUserFriendlyError(error.message)}`,
            };
          }
          return newMessages;
        });
      }
    } finally {
      // Only reset streaming state if this was the latest request
      if (abortControllerRef.current === controller) {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      // We don't null it out here, finally will handle it if it's the current one
    }
  };

  const handleUseSuggestion = (text: string) => {
    setQuestion(text);
    navigator.clipboard.writeText(text);
    setIsUsingSuggestion(true);
    setTimeout(() => setIsUsingSuggestion(false), 1500);
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative min-h-screen gradient-bg overflow-hidden flex flex-col">
      {/* Background particles */}
      <Particles />

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

          {/* Chat Header (Discovery & Persona Lab) */}
          <ChatHeader
            featuredPersonas={featuredPersonas}
            selectedPersonaKey={selectedPersonaKey}
            onPersonaSelect={handlePersonaSelect}
            selectedTone={selectedTone}
            onToneSelect={setSelectedTone}
            leagueId={leagueId}
            onLeagueIdChange={setLeagueId}
            suggestionIndex={suggestionIndex}
            suggestionPrefixes={suggestionPrefixes}
            isUsingSuggestion={isUsingSuggestion}
            onUseSuggestion={handleUseSuggestion}
          />

          <div className="max-w-4xl mx-auto w-full space-y-8 px-4">
            {messages.map((message, messageIndex) => (
              <MessageItem
                key={message.id}
                message={message}
                isLatest={messageIndex === messages.length - 1}
                isStreaming={isStreaming}
                selectedPersonaKey={selectedPersonaKey}
                showTools={showTools[messageIndex]}
                onToggleTools={() => setShowTools(prev => ({ ...prev, [messageIndex]: !prev[messageIndex] }))}
                showReasoning={showReasoning[messageIndex]}
                onToggleReasoning={() => setShowReasoning(prev => ({ ...prev, [messageIndex]: !prev[messageIndex] }))}
              />
            ))}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          question={question}
          onQuestionChange={setQuestion}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isStreaming}
          inputRef={inputRef}
          messages={messages}
          featuredPersonas={featuredPersonas}
          selectedPersonaKey={selectedPersonaKey}
          onPersonaSelect={setSelectedPersonaKey}
          selectedTone={selectedTone}
          onToneSelect={setSelectedTone}
        />
      </div>
    </div>
  );
}
