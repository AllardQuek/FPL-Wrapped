'use client';

import { SeasonSummary } from '@/lib/types';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { StatNumber } from '@/components/ui/StatNumber';

interface TransferCardProps {
  summary: SeasonSummary;
}

export function TransferCard({ summary }: TransferCardProps) {
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-[#00ff87] text-sm mb-4 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          Transfer Analysis
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Your Transfer Grade
        </h2>

        <div className="mb-8 animate-scale-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <GradeDisplay grade={summary.transferGrade} size="xl" />
        </div>

        {/* Net Impact */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-2">Net Transfer Impact</p>
          <div className={`text-4xl font-black ${netImpact >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
            <StatNumber value={netImpact} prefix={netImpact >= 0 ? '+' : ''} duration={1200} /> pts
          </div>
          <p className="text-white/40 text-sm mt-2">
            ({summary.netTransferPoints} gained - {summary.totalTransfersCost} in hits)
          </p>
        </div>

        {/* Best & Worst Transfers */}
        <div className="space-y-4">
          {summary.bestTransfer && (
            <div className="glass-card p-4 text-left animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏆</span>
                <span className="text-[#00ff87] text-sm font-medium">Best Transfer</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">
                    {summary.bestTransfer.playerOut.web_name} → {summary.bestTransfer.playerIn.web_name}
                  </p>
                  <p className="text-white/50 text-sm">GW{summary.bestTransfer.transfer.event}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#00ff87] font-bold text-xl">
                    +{summary.bestTransfer.pointsGained}
                  </p>
                  <p className="text-white/50 text-xs">points</p>
                </div>
              </div>
            </div>
          )}

          {summary.worstTransfer && summary.worstTransfer.pointsGained < 0 && (
            <div className="glass-card p-4 text-left animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💀</span>
                <span className="text-[#e90052] text-sm font-medium">Worst Transfer</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">
                    {summary.worstTransfer.playerOut.web_name} → {summary.worstTransfer.playerIn.web_name}
                  </p>
                  <p className="text-white/50 text-sm">GW{summary.worstTransfer.transfer.event}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#e90052] font-bold text-xl">
                    {summary.worstTransfer.pointsGained}
                  </p>
                  <p className="text-white/50 text-xs">points</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fun fact */}
        <div className="mt-8 animate-fade-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/40 text-sm">
            You made <span className="text-white font-medium">{summary.totalTransfers}</span> transfers
            {summary.totalTransfersCost > 0 && (
              <> and took <span className="text-[#e90052] font-medium">{summary.totalTransfersCost / 4}</span> hits</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}



