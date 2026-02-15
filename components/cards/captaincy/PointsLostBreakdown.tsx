import { CaptaincyAnalysis } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/CustomTooltip';

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
      captainRaw: Math.round(a.captainPoints / (a.captainMultiplier ?? 2)),
      multiplier: a.captainMultiplier ?? 2,
      bestPick: a.bestPickName,
      bestPts: a.bestPickPoints,
      bestPtsIfCaptain: a.bestPickPoints * (a.captainMultiplier ?? 2),
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
                    <div className="grid grid-cols-4 gap-4 items-center text-[10px]">
                    <div>
                      <div className="text-[10px] font-bold text-white/60">GW{d.gw}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">Your Choice</div>
                      <div className="font-bold text-white text-xs truncate">{d.captain}</div>
                      <div className="text-white/60">{d.captainPts}pts</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">Best Option</div>
                      <div className="font-bold text-[#00ff87] text-xs truncate">{d.bestPick}</div>
                      <div className="text-[#00ff87]">{d.bestPtsIfCaptain}pts <span className="text-white/60 text-[9px]">({d.bestPts} raw)</span></div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <span className="text-xs font-black text-[#ff6b9d]">-{d.lost}pts</span>
                        <InfoTooltip
                          side="left"
                          content={<div className="space-y-1">
                            <div className="font-bold">How this is calculated</div>
                            <div className="text-[12px]">
                              Formula: <code className="font-mono">(multiplier − 1) × (best_raw − captain_raw)</code>
                            </div>
                            <div className="text-[12px]">Example: ({d.multiplier} − 1) × ({d.bestPts} − {d.captainRaw}) = {d.lost}</div>
                            <div className="text-[12px]">Best if captain: {d.bestPtsIfCaptain} pts ({d.bestPts} raw)</div>
                            <div className="text-[12px]">You captained: {d.captainPts} pts ({d.captainRaw} raw)</div>
                          </div>}
                        />
                      </div>
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
