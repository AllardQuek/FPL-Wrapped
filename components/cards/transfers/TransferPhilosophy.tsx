'use client';

import React from 'react';

interface TransferPhilosophyProps {
  totalTransfers: number;
  totalTransfersCost: number;
  netImpact: number;
}

export function TransferPhilosophy({ totalTransfers, totalTransfersCost, netImpact }: TransferPhilosophyProps) {
  const getTransferPhilosophyInsight = () => {
    const hitsCount = totalTransfersCost / 4;
    const avgImpact = netImpact / Math.max(1, totalTransfers);
    
    if (totalTransfers < 15) {
      return `Conservative approach. You trust your squad and only move when absolutely necessary.`;
    } else if (totalTransfers > 40) {
      if (netImpact > 50) {
        return `High-octane strategy paying off. Aggressive, calculated churn that's delivering results.`;
      } else {
        return `Reactive management. Chasing points through constant changes. Sometimes it works, sometimes it doesn't.`;
      }
    } else if (hitsCount > 8) {
      if (netImpact > 0) {
        return `Calculated risk-taker. Success requires bold moves, yours mostly paid off.`;
      } else {
        return `Overactive tinkering. The hits are stacking up. Sometimes patience beats panic.`;
      }
    } else if (avgImpact > 2) {
      return `Surgical precision. Well-timed, high-impact moves that maximize every transfer.`;
    } else if (netImpact > 20) {
      return `Solid trading instincts. You've built points through smart, steady moves throughout the season.`;
    } else if (netImpact > 0) {
      return `Functional approach. You're doing enough, not spectacular, but effective and consistent.`;
    } else {
      return `Mistimed moves. Sometimes the market moves against you. It happens to everyone.`;
    }
  };

  return (
    <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-4 text-left">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 text-black">
          {totalTransfers < 15 ? '🛡️' : 
           totalTransfers > 40 ? '⚡' : 
           netImpact > 20 ? '🎯' : '♟️'}
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Transfer Philosophy</p>
          <p className="text-sm text-white font-medium leading-relaxed italic">
            {getTransferPhilosophyInsight()}
          </p>
        </div>
      </div>
    </div>
  );
}
