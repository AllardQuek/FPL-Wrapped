'use client';

import React from 'react';
import { TransferAnalysis } from '@/lib/types';

interface EfficiencyReportProps {
  activeTransfer: TransferAnalysis;
  isWhatIf: boolean;
}

export function EfficiencyReport({ activeTransfer, isWhatIf }: EfficiencyReportProps) {
  const winningWeeks = activeTransfer.breakdown?.pointsHistory.filter((h) => h.in > h.out).length || 0;
  const totalWeeks = activeTransfer.breakdown?.pointsHistory.length || 1;
  const dominanceRate = Math.round((winningWeeks / totalWeeks) * 100);
  
  const netGain = activeTransfer.netGainAfterHit ?? activeTransfer.pointsGained;
  const displayNetGain = Math.round(netGain * 100) / 100;
  const displayPointsGained = Math.round(activeTransfer.pointsGained * 100) / 100;

  return (
    <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
      <div className="flex-1 p-2 md:p-6 flex flex-col justify-center">
        <p className="text-[10px] md:text-[12px] font-black text-[#37ffef] uppercase tracking-widest mb-3 md:mb-4">{isWhatIf ? 'Simulator Report' : 'Efficiency Report'}</p>
        <p className="text-base md:text-lg text-white/50 leading-relaxed italic">
          {isWhatIf ? (
            <>
              &ldquo;If you had transferred in <span className="text-white font-bold">{activeTransfer.playerIn.web_name}</span> for <span className="text-white font-bold">{activeTransfer.playerOut.web_name}</span>,
              you would have <span className={`${activeTransfer.pointsGained >= 0 ? 'text-[#37ffef]' : 'text-[#e90052]'} font-black not-italic text-xl md:text-2xl`}>
                {activeTransfer.pointsGained >= 0 ? `gained ${displayPointsGained}` : `lost ${Math.abs(displayPointsGained)}`}
              </span> points.
              <span className="text-white/80 font-bold not-italic"> This alternative path wins out {dominanceRate}% of the time.</span>&rdquo;
            </>
          ) : (
            <>
              &ldquo;By transferring in <span className="text-white font-bold">{activeTransfer.playerIn.web_name}</span> for <span className="text-white font-bold">{activeTransfer.playerOut.web_name}</span>,
              you yielded a <span className="text-[#37ffef] font-black not-italic text-xl md:text-2xl">{displayPointsGained} point surplus</span>.
              <span className="text-white/80 font-bold not-italic"> {activeTransfer.playerIn.web_name} dominated this matchup in {activeTransfer.winRate ?? dominanceRate}% of appearances.</span>&rdquo;
            </>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center min-w-[100px] md:min-w-[120px]">
          <p className="text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Win Rate</p>
          <p className={`text-xl md:text-2xl font-black ${(activeTransfer.winRate ?? dominanceRate) >= 50 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
            {activeTransfer.winRate ?? dominanceRate}<span className="text-sm md:text-lg ml-0.5">%</span>
          </p>
        </div>
        <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center min-w-[100px] md:min-w-[120px]">
          <p className="text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Net Gain</p>
          <p className={`text-xl md:text-2xl font-black ${netGain >= 0 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
            {netGain > 0 ? '+' : ''}{displayNetGain}
          </p>
        </div>
        <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center min-w-[100px] md:min-w-[120px]">
          <p className="text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">PPG Diff</p>
          <p className={`text-xl md:text-2xl font-black ${(activeTransfer.ppgDifferential ?? (activeTransfer.pointsGained / Math.max(1, activeTransfer.gameweeksHeld))) >= 0 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
            {(activeTransfer.ppgDifferential ?? (activeTransfer.pointsGained / Math.max(1, activeTransfer.gameweeksHeld))).toFixed(1)}
          </p>
        </div>
        <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center min-w-[100px] md:min-w-[120px]">
          <p className="text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Best Run</p>
          <p className="text-xl md:text-2xl font-black text-white">
            {activeTransfer.bestStreak ?? 0}<span className="text-sm md:text-lg ml-0.5 text-white/50">wks</span>
          </p>
        </div>
      </div>
    </div>
  );
}
