'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { TONES, ToneId } from '@/lib/chat/constants';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface FeaturedPersona {
  key: string;
  name: string;
  image: string;
}

interface ChatHeaderProps {
  featuredPersonas: FeaturedPersona[];
  selectedPersonaKey: string | null;
  onPersonaSelect: (key: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  leagueId: string;
  onLeagueIdChange: (id: string) => void;
  suggestionIndex: number;
  suggestionPrefixes: string[];
  isUsingSuggestion: boolean;
  onUseSuggestion: (text: string) => void;
}

export function ChatHeader({
  featuredPersonas,
  selectedPersonaKey,
  onPersonaSelect,
  selectedTone,
  onToneSelect,
  leagueId,
  onLeagueIdChange,
  suggestionIndex,
  suggestionPrefixes,
  isUsingSuggestion,
  onUseSuggestion,
}: ChatHeaderProps) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 md:space-y-16 mb-8 md:mb-20 animate-fade-in text-center flex flex-col justify-center min-h-[70vh] md:min-h-0">
      {/* Introduction & Guidance */}
      <div className="space-y-4 md:space-y-8 pt-1 md:pt-4">
        <div className="space-y-2 md:space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none italic">
            FPL <span className="text-[#00ff87] glow-text not-italic">CHAT</span>
          </h2>
          <p className="text-xs md:text-base text-white/50 max-w-lg mx-auto font-medium leading-relaxed px-4">
            No boring stats. <br />
            <span className="text-white/80">Just personalised insights for you and your league.</span>
          </p>
        </div>

        <div className="inline-flex items-start md:items-center gap-3 px-4 py-2 md:py-3 max-w-lg mx-auto text-left border border-white/5 rounded-2xl bg-white/[0.02] mx-4 md:mx-auto">
          <span className="shrink-0 text-[10px] font-black uppercase text-[#00ff87]/60 border border-[#00ff87]/10 px-1.5 py-0.5 rounded leading-none mt-0.5 md:mt-0">Beta</span>
          <p className="text-[11px] md:text-xs text-white/30 leading-normal font-medium">
            We can index data on a best-effort basis but may not always succeed. If you&apos;re missing results, try pre-loading via 
            <a href="/onboard" className="text-[#00ff87]/40 hover:text-[#00ff87] hover:underline ml-1 transition-colors">/onboard</a>.
          </p>
        </div>
      </div>

      {/* Personalisation Lab Dashboard */}
      <div className="pt-2 md:pt-4 px-4 sm:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-12 max-w-5xl mx-auto">
          {/* Left: Identity Lab */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00ff87] whitespace-nowrap">Identity Lab</span>
                <InfoTooltip
                  side="right"
                  content={
                    <div className="text-[12px]">
                      Select a persona to inject a manager identity into the assistant&apos;s voice — this changes tone, style and perspective for personalised insights.
                    </div>
                  }
                />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#00ff87]/20 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Manager Inner Grid */}
              <div className="grid grid-cols-2 gap-2">
                {featuredPersonas.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => onPersonaSelect(p.key)}
                    className={`group relative flex flex-col items-center justify-center p-2.5 md:p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
                      selectedPersonaKey === p.key 
                        ? 'border-[#00ff87] bg-[#00ff87]/5 shadow-[0_0_30px_rgba(0,255,135,0.15)]' 
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className={`relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border transition-all shrink-0 mb-1.5 md:mb-2 ${
                      selectedPersonaKey === p.key ? 'border-[#00ff87]' : 'border-white/10 group-hover:border-white/30'
                    }`}>
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className={`object-cover transition-all duration-500 ${selectedPersonaKey === p.key ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
                        sizes="(max-width: 768px) 40px, 56px"
                      />
                    </div>
                    <h4 className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors text-center ${selectedPersonaKey === p.key ? 'text-[#00ff87]' : 'text-white/40'}`}>
                      {p.name.split(' ').pop()}
                    </h4>
                    {selectedPersonaKey === p.key && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00ff87] rounded-full shadow-[0_0_10px_rgba(0,255,135,0.8)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Mood Inner Grid */}
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => onToneSelect(tone.id)}
                    className={`group relative flex flex-col items-center justify-center p-2.5 md:p-4 rounded-2xl border transition-all duration-500 ${
                      selectedTone === tone.id 
                        ? 'border-[#00d4ff] bg-[#00d4ff]/10 shadow-[0_0_30px_rgba(0,212,255,0.15)]' 
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl md:text-3xl mb-1.5 md:mb-2">{tone.icon}</span>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center transition-colors ${selectedTone === tone.id ? 'text-[#00d4ff]' : 'text-white/40'}`}>
                      {tone.shortLabel}
                    </span>
                    {selectedTone === tone.id && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00d4ff] rounded-full shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Discovery Box */}
          <div className="mt-4 lg:mt-0 space-y-3 flex flex-col">
            <div className="flex items-center gap-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Discovery Hub</span>
                <InfoTooltip
                  side="right"
                  content={
                    <div className="text-[12px]">
                      Quick question suggestions that use your league context. Set the <strong>in league</strong> ID to target questions to a specific league.
                      <div className="mt-1 text-[11px] text-white/60">
                        Find the league ID in your league page URL.
                      </div>
                    </div>
                  }
                />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            <motion.div
              whileHover={{ scale: 1.01, translateY: -4 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1"
            >
              <div className="group w-full flex flex-col items-center justify-center gap-6 px-6 py-10 md:px-10 md:py-16 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 transition-all duration-500 relative overflow-hidden h-full min-h-[200px] md:min-h-[300px] shadow-2xl shadow-black/50">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ff87]/0 via-[#00ff87]/2 to-[#00ff87]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <div className="relative h-16 md:h-24 w-full flex items-center justify-center z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={suggestionIndex}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 text-white/90 font-medium text-sm md:text-lg text-center italic tracking-tight px-6 leading-relaxed"
                    >
                      <button 
                        onClick={() => onUseSuggestion(`${suggestionPrefixes[suggestionIndex]} in league ${leagueId || '[ID]'}`)}
                        className="hover:text-[#00ff87] transition-colors cursor-pointer outline-none"
                      >
                        &ldquo;{suggestionPrefixes[suggestionIndex]}&rdquo;
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-4 md:gap-6 z-20">
                  <div className="flex items-center gap-3 text-white/30 font-medium text-xs text-left">
                    <span>in league</span>
                    <div className="relative group/input">
                      <input
                        type="text"
                        value={leagueId}
                        onChange={(e) => onLeagueIdChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter ID"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 focus:ring-1 focus:ring-[#00ff87]/30 focus:border-[#00ff87]/50 text-[#00ff87] placeholder-[#00ff87]/20 font-black font-mono w-24 md:w-28 transition-all text-center uppercase text-xs"
                      />
                    </div>
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseSuggestion(`${suggestionPrefixes[suggestionIndex]} in league ${leagueId || '[ID]'}`);
                    }}
                    className="flex items-center justify-center p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group/use"
                    title="Use this question"
                  >
                    <AnimatePresence mode="wait">
                      {isUsingSuggestion ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#00ff87]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <Copy className="w-4 h-4 md:w-5 md:h-5 text-[#00ff87]/50 group-hover/use:text-[#00ff87]/90 transition-all duration-300" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
