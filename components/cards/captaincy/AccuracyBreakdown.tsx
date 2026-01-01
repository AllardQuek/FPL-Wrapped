import { CaptaincyAnalysis } from '@/lib/types';

interface AccuracyBreakdownProps {
  analyses: CaptaincyAnalysis[];
}

export function AccuracyBreakdown({ analyses }: AccuracyBreakdownProps) {
  const accuracyDetails = analyses.map(a => ({
    gw: a.gameweek,
    captain: a.captainName,
    captainPts: a.captainPoints / 2, // Divide by multiplier to get raw points
    bestPick: a.bestPickName,
    bestPts: a.bestPickPoints / 2,
    wasOptimal: a.wasOptimal,
  }));

  const successfulGWs = accuracyDetails.filter(d => d.wasOptimal);
  const missedGWs = accuracyDetails.filter(d => !d.wasOptimal);

  return (
    <div className="text-white">
      <div className="grid grid-cols-1 gap-3">
        {/* Summary Stats */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Season Summary</div>
          <div className="text-xl font-black text-[#00ff87]">{successfulGWs.length} / {analyses.length}</div>
          <div className="text-[10px] text-white/40">Optimal Captain Choices</div>
        </div>

        {/* Successful Picks */}
        {successfulGWs.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-[#00ff87] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>✅</span> Optimal Picks ({successfulGWs.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {successfulGWs.map(d => (
                <div key={d.gw} className="bg-[#00ff87]/10 border border-[#00ff87]/20 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-white/40 font-bold uppercase">GW{d.gw}</div>
                  <div className="text-xs font-bold text-white mt-1 truncate">{d.captain}</div>
                  <div className="text-[10px] text-[#00ff87] font-black">{d.captainPts}pts</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missed Opportunities */}
        {missedGWs.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-[#ff6b9d] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>❌</span> Missed Opportunities ({missedGWs.length})
            </h3>
            <div className="space-y-2">
              {missedGWs.map(d => (
                <div key={d.gw} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/60">GW{d.gw}</span>
                    <span className="text-xs font-bold text-[#ff6b9d]">-{d.bestPts - d.captainPts}pts</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">You Picked</div>
                      <div className="font-bold text-white text-xs truncate">{d.captain}</div>
                      <div className="text-white/60">{d.captainPts}pts</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[9px] uppercase">Should Have Been</div>
                      <div className="font-bold text-[#00ff87] text-xs truncate">{d.bestPick}</div>
                      <div className="text-[#00ff87]">{d.bestPts}pts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
