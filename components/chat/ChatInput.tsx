'use client';

import { type RefObject } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Tooltip } from '@/components/ui/Tooltip';
import { PERSONA_MAP } from '@/lib/analysis/persona/constants';
import { TONES, ToneId } from '@/lib/chat/constants';
import type { Message } from '@/lib/chat/utils';

interface FeaturedPersona {
  key: string;
  name: string;
  image: string;
}

interface ChatInputProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isStreaming: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  messages: Message[];
  featuredPersonas: FeaturedPersona[];
  selectedPersonaKey: string | null;
  onPersonaSelect: (key: string | null) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
}

export function ChatInput({
  question,
  onQuestionChange,
  onSubmit,
  onStop,
  isStreaming,
  inputRef,
  messages,
  featuredPersonas,
  selectedPersonaKey,
  onPersonaSelect,
  selectedTone,
  onToneSelect,
}: ChatInputProps) {
  return (
    <div className="mt-auto pb-8 pt-4">
      <div className="flex flex-col gap-4 mb-4">
        {/* Personalisation Hub Pill (Sticky above input) */}
        {messages.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 px-2">
            <div className="glass-card border-white/10 rounded-full px-2 py-1.5 flex items-center gap-2 shadow-2xl backdrop-blur-xl">
              {/* Manager Selector (Mini) */}
              <div className="flex gap-1 bg-black/40 rounded-full p-0.5 border border-white/5">
                {featuredPersonas.map((p) => (
                  <Tooltip key={p.key} content={p.name}>
                    <button
                      onClick={() => onPersonaSelect(selectedPersonaKey === p.key ? null : p.key)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition-all duration-300 ${
                        selectedPersonaKey === p.key 
                          ? 'border-[#00ff87] scale-110 shadow-[0_0_10px_rgba(0,255,135,0.4)] z-10' 
                          : 'border-white/10 opacity-30 hover:opacity-100 grayscale'
                      }`}
                    >
                      <Image src={p.image} alt={p.name} width={28} height={28} className="object-cover" />
                    </button>
                  </Tooltip>
                ))}
              </div>

              {/* Mood Selector (Mini) */}
              <div className="flex gap-1.5 px-1">
                {TONES.map((tone) => (
                  <Tooltip key={tone.id} content={tone.label}>
                    <button
                      onClick={() => onToneSelect(tone.id)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 ${
                        selectedTone === tone.id 
                          ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]' 
                          : 'opacity-30 hover:opacity-100 grayscale'
                      }`}
                    >
                      <span className={`${selectedTone === tone.id ? 'text-lg' : 'text-sm'}`}>{tone.icon}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Status Indicator (Selected Persona Name) */}
            {selectedPersonaKey && PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP] && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex px-3 py-1.5 rounded-full bg-[#00ff87]/5 border border-[#00ff87]/20 items-center gap-2"
              >
                <span className="w-1 h-1 rounded-full bg-[#00ff87] animate-pulse" />
                <span className="text-[9px] font-black uppercase text-[#00ff87] tracking-widest leading-none">
                  {PERSONA_MAP[selectedPersonaKey as keyof typeof PERSONA_MAP].name.split(' ').pop()} active
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff87] to-[#e90052] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
        <div className="relative flex gap-2 glass-card p-2 rounded-2xl border-white/20">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder="Chat with your FPL data"
            aria-label="FPL chat question"
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-4 py-3 text-base font-bold min-w-0"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
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
  );
}
