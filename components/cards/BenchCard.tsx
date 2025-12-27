'use client';

import { SeasonSummary } from '@/lib/types';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { StatNumber } from '@/components/ui/StatNumber';

interface BenchCardProps {
  summary: SeasonSummary;
}

export function BenchCard({ summary }: BenchCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-yellow-400 text-sm mb-4 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          Bench Analysis
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Your Team Selection
        </h2>

        <div className="mb-8 animate-scale-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <GradeDisplay 
            grade={summary.benchGrade} 
            size="xl" 
            label="Starting XI choices"
          />
        </div>

        {/* Total Bench Points */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-2">Points Left on Bench</p>
          <div className="text-5xl font-black text-yellow-400">
            <StatNumber value={summary.totalBenchPoints} duration={1200} />
          </div>
          <p className="text-white/40 text-sm mt-2">
            total points across all gameweeks
          </p>
        </div>

        {/* Bench Regrets */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-2">Bench Regret Moments</p>
          <div className={`text-4xl font-bold ${summary.benchRegrets > 10 ? 'text-[#e90052]' : summary.benchRegrets > 5 ? 'text-yellow-400' : 'text-[#00ff87]'}`}>
            <StatNumber value={summary.benchRegrets} duration={800} />
          </div>
          <p className="text-white/40 text-sm mt-2">
            weeks where your bench outscored a starter
          </p>
        </div>

        {/* Worst Bench Miss */}
        {summary.worstBenchMiss && (
          <div className="glass-card p-4 text-left animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🪑</span>
              <span className="text-[#e90052] text-sm font-medium">Biggest Bench Regret</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">GW{summary.worstBenchMiss.gameweek}</p>
                <p className="text-white/50 text-sm">
                  {summary.worstBenchMiss.benchPlayers.length > 0 && (
                    <>Best bench: {summary.worstBenchMiss.benchPlayers.sort((a, b) => b.points - a.points)[0]?.player.web_name}</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#e90052] font-bold text-xl">
                  {summary.worstBenchMiss.missedPoints} pts
                </p>
                <p className="text-white/50 text-xs">could have had</p>
              </div>
            </div>
          </div>
        )}

        {/* Fun insight */}
        <div className="mt-8 animate-fade-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/40 text-sm">
            {summary.benchRegrets === 0 ? (
              <>Perfect team selection! Your bench never outscored your starters. 🎯</>
            ) : summary.benchRegrets <= 3 ? (
              <>Only {summary.benchRegrets} bench regrets? That&apos;s impressive team management! 👏</>
            ) : summary.benchRegrets <= 8 ? (
              <>A few bench regrets, but that&apos;s normal in FPL. Can&apos;t predict everything! 🤷</>
            ) : (
              <>Your bench was busy this season! Maybe check those team sheets more carefully? 😅</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}



