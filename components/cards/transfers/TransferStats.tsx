'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface TransferStatsProps {
  totalTransfers: number;
  netImpact: number;
  grade?: string;
}

const ChipHandlingNotes = () => (
  <div className="pt-2 border-t border-white/20 space-y-1">
    <p className="text-white/80 font-medium">Chip Handling:</p>
    <ul className="space-y-1 pl-3">
      <li className="text-white/70">• <span className="text-white/90">Free Hit transfers excluded</span> (temporary moves)</li>
      <li className="text-white/70">• <span className="text-white/90">Wildcard transfers</span> counted as net changes only (before vs after)</li>
    </ul>
  </div>
);

export function TransferStats({ totalTransfers, netImpact, grade }: TransferStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 text-left">
      <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center">
        <p className="text-[9px] md:text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1">Volume</p>
        <p className="text-xl md:text-2xl font-black text-white">{totalTransfers}</p>
        <p className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase">Transfers</p>
      </div>
      <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center flex flex-col items-center">
        <div className="flex items-center gap-1 mb-1 justify-center">
          <p className="text-[9px] md:text-[10px] font-bold text-white/40 tracking-widest uppercase">Net Impact</p>
          <InfoTooltip 
            maxWidth="max-w-[280px]"
            content={
              <div className="space-y-2">
                <p className="font-semibold text-white">Total Transfer Profit</p>
                <p>Cumulative points gained from all players bought vs. those sold, across their entire time in your team, minus transfer costs (hits).</p>
                <ChipHandlingNotes />
              </div>
            } 
          />
        </div>
        <p className={`text-xl md:text-2xl font-black ${netImpact >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
          {netImpact > 0 ? '+' : ''}{netImpact}
        </p>
        <p className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase">Points Added</p>
      </div>
      <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center flex flex-col items-center">
        <div className="flex items-center gap-1 mb-1 justify-center">
          <p className="text-[9px] md:text-[10px] font-bold text-white/40 tracking-widest uppercase">Avg. Impact</p>
          <InfoTooltip 
            maxWidth="max-w-[280px]"
            content={
              <div className="space-y-2">
                <p className="font-semibold text-white">Average Profit per Move</p>
                <p>The average points gained (or lost) for every transfer made this season.</p>
              </div>
            } 
          />
        </div>
        <p className={`text-xl md:text-2xl font-black ${netImpact >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
          {(netImpact / Math.max(1, totalTransfers)).toFixed(1)}
        </p>
        <p className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase">Pts / Transfer</p>
      </div>
      <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center">
        <p className="text-[9px] md:text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1">Efficiency</p>
        <p className="text-xl md:text-2xl font-black text-white">{grade || '-'}</p>
        <p className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase">Grade</p>
      </div>
    </div>
  );
}
