'use client';

import React from 'react';
import { TransferAnalysis } from '@/lib/types';

interface DecisionSpotlightHeaderProps {
  activeTransfer: TransferAnalysis;
  topTransfers: TransferAnalysis[];
  activeIdx: number;
  isWhatIf: boolean;
  onSelectMove: (idx: number) => void;
}

export function DecisionSpotlightHeader({ 
  activeTransfer, 
  topTransfers, 
  activeIdx, 
  isWhatIf, 
  onSelectMove 
}: DecisionSpotlightHeaderProps) {
  return (
    <div className="flex flex-col gap-6 px-2 items-center text-center">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-8 bg-[#00ff87]/30"></div>
          <p className="text-[13px] font-black text-[#00ff87] uppercase tracking-[0.4em]">
            {isWhatIf ? 'Simulator Mode' : 'Decision Spotlight'}
          </p>
          <div className="h-px w-8 bg-[#00ff87]/30"></div>
        </div>
        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter italic uppercase flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-3">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <div className="w-1.5 h-6 md:w-2 md:h-8 bg-[#37ffef] rounded-full"></div>
            <span className="text-[#37ffef]">{activeTransfer.playerIn.web_name}</span>
          </div>
          <span className="text-base md:text-lg text-white/30 not-italic md:mx-1">vs</span>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <div className="w-1.5 h-6 md:w-2 md:h-8 bg-[#ff6b9d] rounded-full"></div>
            <span className="text-[#ff6b9d]">{activeTransfer.playerOut.web_name}</span>
          </div>
        </h3>
      </div>

      {!isWhatIf && (
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
          {topTransfers.map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectMove(i)}
              className={`px-3 md:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-[10px] font-black transition-all uppercase tracking-tighter whitespace-nowrap flex-1 md:flex-none ${activeIdx === i && !isWhatIf
                ? 'bg-[#00ff87] text-black shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                : 'text-white/30 hover:text-white'
                }`}
            >
              Move {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
