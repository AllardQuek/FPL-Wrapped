'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { ElasticAgentChatTransport } from '@/lib/chat/elastic-transport';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { MessageSquare } from 'lucide-react';
import type { UIMessage } from 'ai';

/**
 * Convert tool IDs to user-friendly names with icons (for future use)
 * TODO: Re-enable when adding tool display
 */
// function getToolDisplayName(toolId: string): string {
//   const toolMap: Record<string, string> = {
//     'platform.core.search': '🔍 Searching documents',
//     'platform.core.elasticsearch': '📊 Querying data',
//     'platform.core.aggregate': '📈 Aggregating data',
//     'platform.core.sql': '💾 Running SQL query',
//   };
//   
//   return toolMap[toolId] || `🔧 ${toolId.split('.').pop() || toolId}`;
// }

/**
 * Consolidate all reasoning parts into a single block for cleaner display
 */
function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}) {
  // Consolidate all reasoning parts
  const reasoningParts = message.parts.filter((part) => part.type === 'reasoning');
  const reasoningText = reasoningParts.map((part) => part.text).join('\n\n');
  const hasReasoning = reasoningParts.length > 0;

  // Check if reasoning is still streaming
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === 'reasoning';

  // Get tool invocations (commented out until we verify the tool structure from Elastic Agent)
  // const toolInvocations = message.parts.filter((part) => part.type === 'tool-invocation');

  return (
    <>
      {/* Display reasoning if available */}
      {hasReasoning && (
        <Reasoning className="w-full mb-3" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}

      {/* Display tool calls if available - TODO: Add back once we test tool structure */}
      {/* {toolInvocations.length > 0 && (...)} */}

      {/* Display text parts */}
      {message.parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <MessageResponse key={`${message.id}-${i}`}>
              {part.text}
            </MessageResponse>
          );
        }
        return null;
      })}
    </>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status, stop } = useChat({
    transport: new ElasticAgentChatTransport({
      api: '/api/chat',
    }),
  });

  // Temporary debugging: log messages and status to help trace why UI is empty
  // Remove after debugging
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ChatPage] status=', status, 'messages=', messages.map(m => ({ id: m.id, role: m.role, parts: m.parts.map(p => ({ type: p.type, text: (p as any).text })) })));
    const onUnhandledRejection = (e: any) => {
      // eslint-disable-next-line no-console
      console.error('[ChatPage] unhandledrejection', e);
    };
    const onErrorEvent = (e: any) => {
      // eslint-disable-next-line no-console
      console.error('[ChatPage] window error', e.error ?? e.message ?? e);
    };
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onErrorEvent);
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onErrorEvent);
    };
  }, [messages, status]);

  const isStreaming = status === 'streaming';
  const isSubmitted = status === 'submitted';

  const handleSubmit = () => {
    // Allow sending when not currently streaming or already submitted.
    // This lets the user retry after an `error` state.
    if (!input.trim() || status === 'streaming' || status === 'submitted') return;

    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-gradient-to-r from-purple-600 to-purple-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="size-6" />
          FPL Data Chat
        </h1>
        <p className="text-sm text-purple-100 mt-1">
          Ask questions about your FPL leagues and manager decisions
        </p>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden min-h-0 h-full">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Ask me anything about your FPL data!"
              >
                <div className="text-left max-w-2xl mx-auto space-y-2 text-sm mt-4">
                  <p className="font-semibold text-purple-600">💡 Try asking:</p>
                  <ul className="space-y-1 ml-4 text-gray-600">
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
              </ConversationEmptyState>
            ) : (
              messages.map((message, index) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <MessageParts
                      message={message}
                      isLastMessage={index === messages.length - 1}
                      isStreaming={isStreaming || isSubmitted}
                    />
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
        <PromptInput onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask about your FPL data..."
              disabled={isStreaming || isSubmitted}
              className="min-h-[60px] max-h-[200px]"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-gray-500">
                {isStreaming && (
                  <button
                    type="button"
                    onClick={stop}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Stop generating
                  </button>
                )}
              </div>
              <PromptInputSubmit
                status={isStreaming ? 'streaming' : 'ready'}
                disabled={!input.trim() || isSubmitted}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
