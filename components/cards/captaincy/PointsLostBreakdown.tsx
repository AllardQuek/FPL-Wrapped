import { CaptaincyAnalysis } from '@/lib/types';

interface PointsLostBreakdownProps {
  analyses: CaptaincyAnalysis[];
  totalPointsLost: number;
}

export function PointsLostBreakdown({ analyses, totalPointsLost }: PointsLostBreakdownProps) {
  const pointsLostDetails = analyses
    .filter(a => a.pointsLeftOnTable > 0)
    .map(a => ({
      gw: a.gameweek,
      captain: a.captainName,
      captainPts: a.captainPoints,
      bestPick: a.bestPickName,
      bestPts: a.bestPickPoints,
      lost: a.pointsLeftOnTable,
    }));

  return (
    <div className="text-white">
      <div className="grid grid-cols-1 gap-3">
        {/* Summary Stats */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Total Points Left on Table</div>
          <div className="text-2xl font-black text-[#ff6b9d]">-{totalPointsLost}</div>
          <div className="text-[10px] text-white/40">Across {pointsLostDetails.length} gameweeks where you didn&apos;t captain your best starter</div>
        </div>

        {pointsLostDetails.length > 0 ? (
          <div>
            <h3 className="text-xs font-black text-[#ff6b9d] uppercase tracking-wider mb-2">
              Gameweek Breakdown
            </h3>
            <div className="space-y-2">
              {pointsLostDetails.map(d => (
                <div key={d.gw} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/60">GW{d.gw}</span>
                    <span className="text-xs font-black text-[#ff6b9d]">-{d.lost}pts</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">You Captained</div>
                      <div className="font-bold text-white text-xs truncate">{d.captain}</div>
                      <div className="text-white/60">{d.captainPts}pts</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">Best Option Was</div>
                      <div className="font-bold text-[#00ff87] text-xs truncate">{d.bestPick}</div>
                      <div className="text-[#00ff87]">{d.bestPts}pts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#00ff87]/10 border border-[#00ff87]/20 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm font-black text-[#00ff87]">Perfect Season!</div>
            <div className="text-[10px] text-white/60 mt-1">You captained optimally every single week</div>
          </div>
        )}
      </div>
    </div>
  );
}
