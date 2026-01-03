import { CaptaincyAnalysis } from '@/lib/types';
import { getAccuracyColor } from './constants';

interface AccuracyBreakdownProps {
  analyses: CaptaincyAnalysis[];
}

export function AccuracyBreakdown({ analyses }: AccuracyBreakdownProps) {
  if (!analyses || analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40">
        <div className="text-4xl mb-4">🎯</div>
        <p className="text-sm font-medium">No captaincy data available yet.</p>
        <p className="text-[10px] uppercase tracking-widest mt-1">Finish some gameweeks first!</p>
      </div>
    );
  }

  const accuracyDetails = analyses.map(a => ({
    gw: a.gameweek,
    captain: a.captainName,
    captainPts: a.captainPoints / a.captainMultiplier,
    bestPick: a.bestPickName,
    bestPts: a.bestPickPoints,
    wasOptimal: a.wasOptimal,
    pointsLeft: a.pointsLeftOnTable,
  }));

  const successfulGWs = accuracyDetails.filter(d => d.wasOptimal);
  const missedGWs = accuracyDetails.filter(d => !d.wasOptimal);
  const accuracyRate = (successfulGWs.length / analyses.length) * 100;

  return (
    <div className="text-white space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Accuracy</div>
          <div className={`text-2xl font-black ${getAccuracyColor(accuracyRate)}`}>
            {Math.round(accuracyRate)}%
          </div>
          <div className="text-[10px] text-white/40">{successfulGWs.length} of {analyses.length} optimal</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Points Lost</div>
          <div className="text-2xl font-black text-[#ff6b9d]">
            -{accuracyDetails.reduce((acc, d) => acc + d.pointsLeft, 0)}
          </div>
          <div className="text-[10px] text-white/40">Total missed potential</div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Gameweek History</h3>
        <div className="space-y-2">
          {accuracyDetails.slice().reverse().map(d => (
            <div key={d.gw} className={`bg-white/5 border rounded-xl p-3 flex items-center justify-between ${d.wasOptimal ? 'border-[#00ff87]/20' : 'border-[#ff6b9d]/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${d.wasOptimal ? 'bg-[#00ff87]/20 text-[#00ff87]' : 'bg-[#ff6b9d]/20 text-[#ff6b9d]'}`}>
                  {d.gw}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{d.captain}</div>
                  <div className="text-[10px] text-white/40">{d.captainPts} pts</div>
                </div>
              </div>
              
              {!d.wasOptimal && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#ff6b9d]">-{d.pointsLeft}pts</div>
                  <div className="text-[8px] text-white/40 uppercase">Missed {d.bestPick}</div>
                </div>
              )}
              {d.wasOptimal && (
                <div className="text-[10px] font-bold text-[#00ff87]">OPTIMAL</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
