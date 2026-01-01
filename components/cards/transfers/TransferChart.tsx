'use client';

import React, { useState } from 'react';
import { TransferAnalysis } from '@/lib/types';

interface TransferChartProps {
  activeTransfer: TransferAnalysis;
}

export function TransferChart({ activeTransfer }: TransferChartProps) {
  const [hoveredGwIdx, setHoveredGwIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
          Weekly Points Comparison <span className="text-white/20 font-normal normal-case ml-2">(Points Gained vs Lost)</span>
        </p>
        <div className="flex items-center gap-2 text-[9px] font-black text-white/60 uppercase tracking-wider">
          <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">GW {activeTransfer.ownedGWRange.start}</span>
          <span className="text-white/30">→</span>
          <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">GW {activeTransfer.ownedGWRange.end}</span>
          <span className="text-white/30">·</span>
          <span className="bg-[#37ffef]/10 px-3 py-1 rounded-full border border-[#37ffef]/20 text-[#37ffef]">
            {activeTransfer.gameweeksHeld}W
          </span>
        </div>
      </div>

      {/* Chart Arena */}
      <div className="relative h-[200px] w-full border-b border-white/30">
        {/* Static Horizontal Grid Lines */}
        {[15, 10, 5, 0].map((val) => (
          <div key={val} className="absolute inset-x-0 flex items-center" style={{ bottom: `${(val / 15) * 100}%` }}>
            <div className="w-full border-t border-white/10 border-dashed"></div>
            <span className="absolute -left-8 md:-left-12 w-6 md:w-10 text-right text-[10px] font-black text-white/60 pr-1 md:pr-2 ml-2">
              {val}
            </span>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 top-[-100px] overflow-x-auto no-scrollbar pt-32">
          <div className="h-full flex items-end justify-start gap-2 md:gap-4 px-1 min-w-full">
            {activeTransfer.breakdown?.pointsHistory.map((entry, idx: number) => {
              const maxVal = 15;
              const hIn = Math.min(100, (entry.in / maxVal) * 100);
              const hOut = Math.min(100, (entry.out / maxVal) * 100);

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredGwIdx(idx)}
                  onMouseLeave={() => setHoveredGwIdx(null)}
                  className="flex-none flex flex-col items-center group relative min-w-[40px] md:min-w-[70px] max-w-[100px]"
                >
                  <div className={`w-full relative h-[160px] flex items-end justify-center gap-1.5 px-2 rounded-2xl border-x transition-colors duration-300 ${hoveredGwIdx === idx
                    ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                    }`}>
                    <div
                      className="w-3 md:w-6 bg-[#ff6b9d] rounded-t-lg transition-all duration-700 relative group-hover:brightness-125"
                      style={{ height: `${hOut}%` }}
                    >
                      <div className={`absolute -top-7 left-1/2 -translate-x-full transition-all duration-300 whitespace-nowrap pr-1 bg-[#ff6b9d] px-2 py-0.5 rounded-md border border-white/20 shadow-xl z-20 ${hoveredGwIdx === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                        }`}>
                        <span className="text-[10px] font-black text-white">{entry.out}</span>
                      </div>
                    </div>
                    <div
                      className={`w-3 md:w-6 bg-[#37ffef] rounded-t-lg shadow-[0_0_20px_rgba(55,255,239,0.2)] transition-all duration-700 relative origin-bottom ${hoveredGwIdx === idx ? 'scale-x-110 brightness-110' : 'group-hover:scale-x-105'
                        }`}
                      style={{ height: `${hIn}%` }}
                    >
                      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 transition-all duration-300 whitespace-nowrap bg-[#37ffef] px-2 py-0.5 rounded-md border border-white/20 shadow-xl z-20 ${hoveredGwIdx === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                        }`}>
                        <span className="text-[10px] font-black text-[#0b0410]">{entry.in}</span>
                      </div>
                      {entry.in >= 10 && (
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-white/20 animate-pulse rounded-t-lg"></div>
                      )}
                    </div>
                  </div>
                  <div className={`mt-2 pt-2 border-t w-full text-center transition-colors ${hoveredGwIdx === idx ? 'border-[#37ffef] text-[#37ffef]' : 'border-white/20 text-white/60'
                    }`}>
                    <p className="text-[11px] font-black uppercase tracking-tighter">GW{entry.gw}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
