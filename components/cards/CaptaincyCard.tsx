'use client';

import { SeasonSummary } from '@/lib/types';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { StatNumber } from '@/components/ui/StatNumber';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CaptaincyCardProps {
  summary: SeasonSummary;
}

export function CaptaincyCard({ summary }: CaptaincyCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-[#e90052] text-sm mb-4 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          Captaincy Analysis
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Your Captain Picks
        </h2>

        <div className="mb-8 animate-scale-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <GradeDisplay grade={summary.captaincyGrade} size="xl" />
        </div>

        {/* Success Rate */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-4">Captain Success Rate (6+ pts)</p>
          <ProgressBar 
            value={summary.captaincySuccessRate} 
            color={summary.captaincySuccessRate >= 60 ? 'green' : summary.captaincySuccessRate >= 40 ? 'yellow' : 'pink'}
            delay={500}
          />
        </div>

        {/* Points Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-4 animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
            <p className="text-white/50 text-xs mb-1">Your Captain Points</p>
            <p className="text-2xl font-bold text-white">
              <StatNumber value={summary.totalCaptaincyPoints} duration={1200} />
            </p>
          </div>
          <div className="glass-card p-4 animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
            <p className="text-white/50 text-xs mb-1">Optimal Would Be</p>
            <p className="text-2xl font-bold text-white/60">
              <StatNumber value={summary.optimalCaptaincyPoints} duration={1200} />
            </p>
          </div>
        </div>

        {/* Points Left on Table */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-2">Points Left on the Table</p>
          <div className="text-4xl font-black text-[#e90052]">
            <StatNumber value={summary.captaincyPointsLost} duration={1200} /> pts
          </div>
          <p className="text-white/40 text-sm mt-2">
            by not always captaining your best player
          </p>
        </div>

        {/* Best & Worst Captain Picks */}
        <div className="space-y-4">
          {summary.bestCaptainPick && (
            <div className="glass-card p-4 text-left animate-slide-in opacity-0 delay-800" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👑</span>
                <span className="text-[#00ff87] text-sm font-medium">Best Captain Pick</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{summary.bestCaptainPick.captainName}</p>
                  <p className="text-white/50 text-sm">GW{summary.bestCaptainPick.gameweek}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#00ff87] font-bold text-xl">
                    {summary.bestCaptainPick.captainPoints}
                  </p>
                  <p className="text-white/50 text-xs">captain pts</p>
                </div>
              </div>
            </div>
          )}

          {summary.worstCaptainPick && summary.worstCaptainPick.pointsLeftOnTable > 0 && (
            <div className="glass-card p-4 text-left animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '900ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">😬</span>
                <span className="text-[#e90052] text-sm font-medium">Biggest Captain Miss</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">
                    {summary.worstCaptainPick.captainName} <span className="text-white/50">vs</span> {summary.worstCaptainPick.bestPickName}
                  </p>
                  <p className="text-white/50 text-sm">GW{summary.worstCaptainPick.gameweek}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#e90052] font-bold text-xl">
                    -{summary.worstCaptainPick.pointsLeftOnTable}
                  </p>
                  <p className="text-white/50 text-xs">points missed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



