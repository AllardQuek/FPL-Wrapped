'use client';

import { BenchAnalysis } from '@/lib/types';

interface SelectionErrorsDialogProps {
  benchAnalyses: BenchAnalysis[];
}

export function SelectionErrorsDialog({ benchAnalyses }: SelectionErrorsDialogProps) {
  const errors = benchAnalyses.filter(b => b.hadBenchRegret);
  
  const positionBreakdown = {
    GKP: errors.filter(e => e.errorPosition === 'GKP').length,
    DEF: errors.filter(e => e.errorPosition === 'DEF').length,
    MID: errors.filter(e => e.errorPosition === 'MID').length,
    FWD: errors.filter(e => e.errorPosition === 'FWD').length,
  };

  return (
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
                    {error.replacedPlayers && error.replacedPlayers.length > 0 ? (
                      <>
                        Started: {error.replacedPlayers.map((rp) => rp.player.web_name).join(', ')} ({error.replacedPlayers[0].points} pts)
                      </>
                    ) : (
                      <>Started someone with only {error.replacedPlayerPoints ?? error.lowestStarterPoints ?? 0} pts</>
                    )}
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
}
