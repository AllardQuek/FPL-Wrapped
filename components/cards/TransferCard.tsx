'use client';

import React from 'react';
import { SeasonSummary } from '@/lib/types';
import { TransferStats } from './transfers/TransferStats';
import { SharedImageFooter } from '../ui/wrapped/SharedImageFooter';

interface TransferCardProps {
  summary: SeasonSummary;
}

export function TransferCard({ summary }: TransferCardProps) {
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <div className="flex-1 flex flex-col justify-center max-w-4xl w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 02: Transfer Strategy</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8 text-center uppercase italic">Transfer Overview</h2>

        <TransferStats 
          totalTransfers={summary.totalTransfers}
          netImpact={netImpact}
          grade={summary.transferGrade}
          transferTiming={summary.transferTiming}
          actualTransferGWs={summary.actualTransferGWs}
        />
      </div>
      <SharedImageFooter />
    </div>
  );
}
