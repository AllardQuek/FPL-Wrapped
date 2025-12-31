'use client';

import { SeasonSummary } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { InfoDialog } from '@/components/ui/InfoDialog';

interface BenchCardProps {
  summary: SeasonSummary;
}

export function BenchCard({ summary }: BenchCardProps) {
  const { persona, benchAnalyses } = summary;

  // Calculate position breakdown
  const errors = benchAnalyses.filter(b => b.hadBenchRegret);
  const positionBreakdown = {
    GKP: errors.filter(e => e.errorPosition === 'GKP').length,
    DEF: errors.filter(e => e.errorPosition === 'DEF').length,
    MID: errors.filter(e => e.errorPosition === 'MID').length,
    FWD: errors.filter(e => e.errorPosition === 'FWD').length,
  };

  // Create dialog content for selection errors
  const selectionErrorsDialogContent = (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
          Selection Error Threshold
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          Only gameweeks where your best bench player scored <strong className="text-white">3+ more points</strong> than your worst starter count as errors. 
          This filters out marginal calls and focuses on genuine mistakes.
        </p>
      </div>

      {/* Position Breakdown */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
          Errors by Position
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">Goalkeepers</span>
            <span className="text-lg font-black text-white">{positionBreakdown.GKP}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">Defenders</span>
            <span className="text-lg font-black text-white">{positionBreakdown.DEF}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">Midfielders</span>
            <span className="text-lg font-black text-white">{positionBreakdown.MID}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/60">Forwards</span>
            <span className="text-lg font-black text-white">{positionBreakdown.FWD}</span>
          </div>
        </div>
      </div>

      {/* List of Errors */}
      {errors.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
            All Selection Errors ({errors.length})
          </p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {errors.map((error) => (
              <div
                key={error.gameweek}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-bold text-white/40">GW{error.gameweek}</span>
                  <span className="text-xs font-black text-[#ff6b9d]">
                    -{error.missedPoints} pts
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-white/80 font-medium">
                    Benched: <span className="font-black text-white">{error.bestBenchPick?.player.web_name}</span> ({error.bestBenchPick?.points} pts)
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    Started someone with only {error.lowestStarterPoints} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl font-black text-white mb-2">🏆</p>
          <p className="text-sm font-bold text-white/60">Perfect Selection!</p>
          <p className="text-xs text-white/50 mt-1">No significant errors this season</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 04: The Dugout</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8 text-center uppercase italic">Selection</h2>

        {/* Persona Insight Box */}
        <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 text-black">
              👨‍🏫
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Manager Critique</p>
              <p className="text-sm text-white font-medium leading-relaxed italic">
                {summary.benchRegrets > 12
                  ? `Pure ${persona.name} levels of overthinking. ${summary.benchRegrets} times you benched the wrong player, leaving ${summary.totalBenchPoints} points in the dugout.`
                  : summary.benchRegrets > 5
                    ? `A few selection headaches. ${summary.benchRegrets} weeks where you picked the wrong XI, but ${persona.name} would respect the squad depth.`
                    : summary.totalBenchPoints < 50
                      ? `Masterful team selection. You rarely benched a player who should have started, just as ${persona.name} demands.`
                      : `Solid selection instincts. You usually picked the right XI when it mattered.`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Selection Errors</p>
              <InfoDialog title="Selection Errors Breakdown">
                {selectionErrorsDialogContent}
              </InfoDialog>
            </div>
            <p className="text-3xl font-black text-[#00ff87]">{summary.benchRegrets} Weeks</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Total Bench Points</p>
              <InfoTooltip content="The total number of points scored by your substitutes throughout the season." />
            </div>
            <p className="text-3xl font-black text-white">{summary.totalBenchPoints}</p>
          </div>
        </div>

        {/* The "Graveyard" Card */}
        <div className="bg-white rounded-3xl p-8 text-black mb-8 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-6">Biggest Bench Miss</p>
            {summary.worstBenchMiss ? (
              <>
                <div className="text-5xl font-black tracking-tighter italic mb-2">
                  {summary.worstBenchMiss.missedPoints} PTS
                </div>
                <p className="text-sm font-bold text-black mb-1 uppercase">
                  {summary.worstBenchMiss.bestBenchPick?.player.web_name} ({summary.worstBenchMiss.bestBenchPick?.points} pts)
                </p>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  GW{summary.worstBenchMiss.gameweek} • Benched for a {summary.worstBenchMiss.lowestStarterPoints}pt starter
                </p>
              </>
            ) : (
              <div className="text-xl font-bold italic py-4">Absolute Perfection.</div>
            )}
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <span className="text-[10rem] font-black rotate-12">LOCK</span>
          </div>
        </div>
      </div>
    </div>
  );
}



