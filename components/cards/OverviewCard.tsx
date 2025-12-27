'use client';

import { SeasonSummary } from '@/lib/types';
import { StatNumber } from '@/components/ui/StatNumber';

interface OverviewCardProps {
  summary: SeasonSummary;
}

export function OverviewCard({ summary }: OverviewCardProps) {
  const formatRank = (rank: number) => {
    if (rank >= 1000000) return `${(rank / 1000000).toFixed(1)}M`;
    if (rank >= 1000) return `${(rank / 1000).toFixed(0)}K`;
    return rank.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-[#00ff87] text-sm mb-8 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          The Numbers
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-12 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Your Season at a Glance
        </h2>

        <div className="space-y-8">
          {/* Total Points */}
          <div className="glass-card p-6 animate-slide-in opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
            <p className="text-white/50 text-sm mb-2">Total Points</p>
            <div className="text-5xl md:text-6xl font-black glow-text text-[#00ff87]">
              <StatNumber value={summary.totalPoints} duration={1500} />
            </div>
          </div>

          {/* Overall Rank */}
          <div className="glass-card p-6 animate-slide-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
            <p className="text-white/50 text-sm mb-2">Overall Rank</p>
            <div className="text-4xl md:text-5xl font-bold text-white">
              #{formatRank(summary.overallRank)}
            </div>
          </div>

          {/* Best & Worst Gameweeks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 animate-slide-in opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
              <p className="text-white/50 text-xs mb-1">Best Gameweek</p>
              <p className="text-sm text-white/70">GW{summary.bestGameweek.event}</p>
              <p className="text-2xl font-bold text-[#00ff87]">
                <StatNumber value={summary.bestGameweek.points} /> pts
              </p>
            </div>
            <div className="glass-card p-4 animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
              <p className="text-white/50 text-xs mb-1">Worst Gameweek</p>
              <p className="text-sm text-white/70">GW{summary.worstGameweek.event}</p>
              <p className="text-2xl font-bold text-[#e90052]">
                <StatNumber value={summary.worstGameweek.points} /> pts
              </p>
            </div>
          </div>

          {/* Transfers & Chips */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
              <p className="text-white/50 text-xs mb-1">Transfers Made</p>
              <p className="text-2xl font-bold text-white">
                <StatNumber value={summary.totalTransfers} />
              </p>
            </div>
            <div className="glass-card p-4 animate-slide-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
              <p className="text-white/50 text-xs mb-1">Hit Points Taken</p>
              <p className="text-2xl font-bold text-[#e90052]">
                -<StatNumber value={summary.totalTransfersCost} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



