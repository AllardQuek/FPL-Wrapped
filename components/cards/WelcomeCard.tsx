'use client';

import { SeasonSummary } from '@/lib/types';
import { getCurrentFPLSeason } from '@/lib/season';
import Image from 'next/image';
import { useState } from 'react';
import { SharedImageFooter } from '../ui/wrapped/SharedImageFooter';

interface WelcomeCardProps {
  summary: SeasonSummary;
}

// All possible manager personas
const ALL_PERSONAS = [
  { key: 'PEP', name: 'Pep Guardiola', title: 'The Bald Genius', image: '/images/personas/pep-guardiola-bald-genius.jpg', emoji: '🧠' },
  { key: 'MOYES', name: 'David Moyes', title: 'The Reliable', image: '/images/personas/david-moyes-reliable.jpg', emoji: '🛡️' },
  { key: 'REDKNAPP', name: 'Harry Redknapp', title: 'The Wheeler-Dealer', image: '/images/personas/harry-redknapp-wheeler-dealer.jpg', emoji: '💸' },
  { key: 'MOURINHO', name: 'Jose Mourinho', title: 'The Special One', image: '/images/personas/jose-mourinho-special-one.jpg', emoji: '🚌' },
  { key: 'KLOPP', name: 'Jurgen Klopp', title: 'Heavy Metal FPL', image: '/images/personas/jurgen-klopp-heavy-metal.jpg', emoji: '🎸' },
  { key: 'AMORIM', name: 'Ruben Amorim', title: 'The Stubborn One', image: '/images/personas/ruben-amorim-stubborn-one.jpg', emoji: '🦁' },
  { key: 'FERGUSON', name: 'Sir Alex Ferguson', title: 'The GOAT', image: '/images/personas/alex-ferguson-goat.jpg', emoji: '👑' },
  { key: 'POSTECOGLOU', name: 'Ange Postecoglou', title: 'The All-Outer', image: '/images/personas/ange-postecoglou-all-outer.jpg', emoji: '🦘' },
  { key: 'EMERY', name: 'Unai Emery', title: 'The Methodical', image: '/images/personas/unai-emery-methodical.jpg', emoji: '📋' },
  { key: 'WENGER', name: 'Arsene Wenger', title: 'The Professor', image: '/images/personas/arsene-wenger-professor.jpg', emoji: '🧐' },
  { key: 'ANCELOTTI', name: 'Carlo Ancelotti', title: 'The Calm Conductor', image: '/images/personas/carlo-ancelotti-calm-conductor.jpg', emoji: '🤨' },
  { key: 'MARESCA', name: 'Enzo Maresca', title: 'The System Builder', image: '/images/personas/enzo-maresca-system-builder.jpg', emoji: '🎯' },
  { key: 'ARTETA', name: 'Mikel Arteta', title: 'The Process Manager', image: '/images/personas/mikel-arteta-process-manager.jpg', emoji: '🏗️' },
  { key: 'SIMEONE', name: 'Diego Simeone', title: 'The Warrior', image: '/images/personas/diego-simeone-warrior.jpg', emoji: '⚔️' },
  { key: 'SLOT', name: 'Arne Slot', title: 'The Optimizer', image: '/images/personas/arne-slot-optimizer.jpg', emoji: '📊' },
  { key: 'TENHAG', name: 'Erik ten Hag', title: 'The Rebuilder', image: '/images/personas/erik-ten-hag-rebuilder.jpg', emoji: '📉' },
];

function ManagerAvatar({ image, name, emoji, isActive, isMystery }: { image: string; name: string; emoji: string; isActive: boolean; isMystery?: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`relative group ${isActive || isMystery ? 'scale-110' : ''} transition-transform duration-300`}>
      {/* Outer container for shadow to avoid clipping with overflow-hidden */}
      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${isMystery ? 'shadow-[0_0_20px_rgba(0,255,135,0.4)]' : ''}`}>
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 bg-slate-800 flex items-center justify-center relative"
          style={isMystery ? { borderColor: '#00ff87' } : {}}>
          {isMystery ? (
            // Show question mark for the mystery slot (user's unknown persona)
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
              {/* Static gradient overlay for better sharing reliability */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff87]/20 via-transparent to-purple-500/20"></div>
              <span className="text-4xl md:text-5xl font-black text-[#00ff87] relative z-10 drop-shadow-[0_2px_8px_rgba(0,255,135,0.5)]">?</span>
            </div>
          ) : !imageError ? (
            <Image
              src={image || ''}
              alt={name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized={image?.startsWith('data:')}
            />
          ) : (
            <span className="text-2xl md:text-3xl">{emoji}</span>
          )}
        </div>
      </div>
      {!isMystery && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
            {name}
          </div>
        </div>
      )}
      {isMystery && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-[#00ff87] text-black text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            You
          </div>
        </div>
      )}
    </div>
  );
}

export function WelcomeCard({ summary }: WelcomeCardProps) {
  const currentSeason = getCurrentFPLSeason();
  const { persona } = summary;
  
  return (
    <div className="min-h-screen flex flex-col items-center p-8 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00ff87]/5 blur-[120px] rounded-full -z-10"></div>

      <div className="flex-1 flex flex-col justify-center text-center animate-fade-in">
        <p className="text-white/40 text-[10px] tracking-[0.5em] uppercase mb-12">FPL Season Review</p>

        <div className="relative inline-block mb-12">
          <p className="text-6xl md:text-8xl font-black tracking-tighter text-white italic opacity-10 absolute -top-12 -left-12 -z-10 select-none">{currentSeason}</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4">
            {(summary.teamName || 'Team').toUpperCase()}.
          </h1>
        </div>

        <p className="text-lg md:text-xl font-medium text-white/60 mb-8 max-w-sm mx-auto leading-relaxed">
          what kind of manager are you?
        </p>

        {/* Mystery Avatar - User's Unknown Persona */}
        <div className="flex justify-center mb-16">
          <ManagerAvatar
            key="mystery"
            image=""
            name="Mystery"
            emoji="❓"
            isActive={false}
            isMystery={true}
          />
        </div>

        {/* All Manager Personas Grid */}
        <div className="max-w-3xl mx-auto">
          <p className="text-white/50 text-[9px] tracking-[0.3em] uppercase mb-6">16 Manager Personas</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 justify-items-center">
            {ALL_PERSONAS.map((p) => (
              <ManagerAvatar
                key={p.key}
                image={p.image}
                name={p.name}
                emoji={p.emoji}
                isActive={persona.name === p.name}
              />
            ))}
          </div>
        </div>
      </div>
      <SharedImageFooter />
    </div>
  );
}



