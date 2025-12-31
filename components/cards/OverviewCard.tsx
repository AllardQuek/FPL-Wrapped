'use client';

import { SeasonSummary } from '@/lib/types';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-12">Section 01: The Résumé</p>

        <div className="space-y-6">
          {/* Big Number Headline */}
          <div className="relative inline-block mb-8 w-full">
            <h2 className="text-[8rem] md:text-[10rem] font-black tracking-tighter text-white opacity-5 select-none leading-none">SCORE</h2>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <p className="text-xs text-[#00ff87] font-bold tracking-widest uppercase mb-1">Total Points</p>
              <p className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white">{summary.totalPoints}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-md">
            <div className="bg-white/5 p-6 md:p-8 backdrop-blur-md">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2">Final Rank</p>
              <p className="text-2xl md:text-3xl font-black text-white italic">#{formatRank(summary.overallRank)}</p>
            </div>
            <div className="bg-white/5 p-6 md:p-8 border-l border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-2">Decision Grade</p>
              <p className="text-2xl md:text-3xl font-black text-[#00ff87] italic">{summary.overallDecisionGrade}</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Peak Form</p>
              <p className="text-xl font-bold text-[#00ff87]">{summary.bestGameweek.points} PTS</p>
              <p className="text-[9px] text-white/40 uppercase">Gameweek {summary.bestGameweek.event}</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Low Point</p>
              <p className="text-xl font-bold text-[#e90052]">{summary.worstGameweek.points} PTS</p>
              <p className="text-[9px] text-white/40 uppercase">Gameweek {summary.worstGameweek.event}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



