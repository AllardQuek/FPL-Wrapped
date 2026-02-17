'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PERSONA_MAP } from '@/lib/analysis/persona/constants';
import { getPersonaImagePath } from '@/lib/constants/persona-images';
import { getToolDisplayName, type Message } from '@/lib/chat/utils';
import { MessageContent } from './MessageContent';

interface MessageItemProps {
  message: Message;
  isLatest: boolean;
  isStreaming: boolean;
  selectedPersonaKey: string | null;
  showTools: boolean;
  onToggleTools: () => void;
  showReasoning: boolean;
  onToggleReasoning: () => void;
}

export function MessageItem({
  message,
  isLatest,
  isStreaming,
  selectedPersonaKey,
  showTools,
  onToggleTools,
  showReasoning,
  onToggleReasoning,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isLatest && (isUser || !message.content) ? 'animate-slide-in' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border overflow-hidden ${isUser
        ? 'bg-purple-600 border-purple-400 text-white'
        : 'bg-white/10 border-white/20 text-[#00ff87]'
        }`}>
        {isUser ? (
          <span className="text-[10px] font-black">ME</span>
        ) : selectedPersonaKey ? (
          <Image 
            src={getPersonaImagePath(selectedPersonaKey as keyof typeof PERSONA_MAP)} 
            alt={selectedPersonaKey}
            width={32}
            height={32}
            className="object-cover"
          />
        ) : (
          <span className="text-[10px] font-black">AI</span>
        )}
      </div>

      <div
        className={`max-w-[85%] ${isAssistant ? 'w-full' : ''} rounded-2xl px-5 py-3 shadow-2xl transition-all ${isUser
          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none'
          : 'glass-card border-white/10 text-white rounded-tl-none'
          }`}
      >
        {isAssistant && selectedPersonaKey && PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP] && (
          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#00ff87] mb-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#00ff87]"></span>
            {PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP].name}
          </div>
        )}
        
        {isUser ? (
          <div className="whitespace-pre-wrap font-medium leading-relaxed">{message.content}</div>
        ) : (
          <>
            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className={`${message.content ? 'mb-4 pb-3 border-b border-white/10' : 'mb-1 pb-1'}`}>
                <button
                  onClick={onToggleTools}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00d4ff] hover:brightness-125 transition-all outline-none"
                  aria-expanded={showTools}
                >
                  <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-[#00d4ff]/10 border border-[#00d4ff]/20 transition-transform ${showTools ? 'rotate-90 text-[#00d4ff]' : 'text-white/80'}`} aria-hidden>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  <span>System Operations ({message.toolCalls.length})</span>
                </button>
                <AnimatePresence>
                  {showTools && (
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
            {((message.reasoning && message.reasoning.length > 0) || (isStreaming && isLatest)) && (
              <div className={`${message.content ? 'mb-4 pb-3 border-b border-white/10' : 'mb-1 pb-1'}`}>
                <button
                  onClick={onToggleReasoning}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a855f7] hover:brightness-125 transition-all outline-none"
                  aria-expanded={showReasoning}
                >
                  <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-[#a855f7]/10 border border-[#a855f7]/20 transition-transform ${showReasoning ? 'rotate-90 text-[#a855f7]' : 'text-white/80'}`} aria-hidden>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  <span>
                    {(selectedPersonaKey && PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP])
                      ? `${PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP].name.split(' ').pop()}'s Logic` 
                      : 'Manager Logic'
                    } {message.reasoning && message.reasoning.length > 0 ? `(${message.reasoning.length})` : ''}
                  </span>
                  {isStreaming && isLatest && (
                    <span className="ml-auto flex items-center gap-2">
                      <span className="text-[8px] font-black tracking-widest opacity-40">PROCESSING LOGS</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse"></span>
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showReasoning && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        {message.reasoning?.map((thought, thoughtIdx) => {
                          const isLatestThought = isStreaming && isLatest && thoughtIdx === (message.reasoning?.length ?? 0) - 1;
                          return (
                            <div
                              key={thoughtIdx}
                              className={`flex items-start gap-2.5 text-[12px] transition-all duration-300 ${isLatestThought ? 'text-[#00ff87] font-bold' : 'text-white/70'}`}
                            >
                              <span className={`mt-1 font-bold ${isLatestThought ? 'text-[#00ff87] animate-pulse' : 'text-purple-500'}`}>
                                {isLatestThought ? '▶' : '↳'}
                              </span>
                              <span className={`${isLatestThought ? '' : 'italic'} leading-relaxed`}>{thought}</span>
                            </div>
                          );
                        })}

                        {/* Pulse for starting state */}
                        {isStreaming && isLatest && (!message.reasoning || message.reasoning.length === 0) && (
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
}
