'use client';

import React, { useState } from 'react';
import { SeasonSummary } from '@/lib/types';
import { TransferStats } from './transfers/TransferStats';
import { DecisionSpotlightHeader } from './transfers/DecisionSpotlightHeader';
import { EfficiencyReport } from './transfers/EfficiencyReport';
import { TransferChart } from './transfers/TransferChart';
import { WhatIfSimulator } from './transfers/WhatIfSimulator';

interface TransferCardProps {
  summary: SeasonSummary;
}

export function TransferCard({ summary }: TransferCardProps) {
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;
  
  const [activeIdx, setActiveIdx] = useState(0);
  const [isWhatIf, setIsWhatIf] = useState(false);
  const [p1Search, setP1Search] = useState('');
  const [p2Search, setP2Search] = useState('');
  const [selectedP1, setSelectedP1] = useState<number | null>(null);
  const [selectedP2, setSelectedP2] = useState<number | null>(null);
  const [startGW, setStartGW] = useState(1);
  const [endGW, setEndGW] = useState(summary.rankProgression.length);
  const [simResult, setSimResult] = useState<SeasonSummary['transferAnalyses'][0] | null>(null);
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get top 5 transfers
  const topTransfers = summary.transferAnalyses
    .sort((a, b) => b.pointsGained - a.pointsGained)
    .slice(0, 5);

  const activeTransfer = isWhatIf && simResult ? simResult : topTransfers[activeIdx];

  const handleSimulate = async () => {
    if (!selectedP1 || !selectedP2) return;
    setIsSimLoading(true);
    try {
      const resp = await fetch(`/api/compare?p1=${selectedP1}&p2=${selectedP2}&start=${startGW}&end=${endGW}`);
      const data = await resp.json();
      setSimResult(data);
      setIsWhatIf(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 02: Transfer Strategy</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8 text-center uppercase italic">Transfers</h2>

        <TransferStats 
          totalTransfers={summary.totalTransfers}
          netImpact={netImpact}
          grade={summary.transferGrade}
        />

        {/* Decision Spotlight viz */}
        {topTransfers.length > 0 && activeTransfer && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <DecisionSpotlightHeader 
              activeTransfer={activeTransfer}
              topTransfers={topTransfers}
              activeIdx={activeIdx}
              isWhatIf={isWhatIf}
              onSelectMove={(idx) => { setActiveIdx(idx); setIsWhatIf(false); }}
            />

            <div className="bg-white/5 rounded-[48px] p-4 md:p-8 border border-white/10 backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                  <EfficiencyReport 
                    activeTransfer={activeTransfer}
                    isWhatIf={isWhatIf}
                  />

                  {/* Explore More Toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white">
                        {isExpanded ? 'Hide Details' : 'Explore Decision & What-If'}
                      </span>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="space-y-10 pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-500">
                      <TransferChart activeTransfer={activeTransfer} />

                      <WhatIfSimulator 
                        summary={summary}
                        p1Search={p1Search}
                        p2Search={p2Search}
                        selectedP1={selectedP1}
                        selectedP2={selectedP2}
                        startGW={startGW}
                        endGW={endGW}
                        isSimLoading={isSimLoading}
                        setP1Search={setP1Search}
                        setP2Search={setP2Search}
                        setSelectedP1={setSelectedP1}
                        setSelectedP2={setSelectedP2}
                        setStartGW={setStartGW}
                        setEndGW={setEndGW}
                        onSimulate={handleSimulate}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
