'use client';

import { SeasonSummary } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { InfoDialog } from '@/components/ui/InfoDialog';

interface CaptaincyCardProps {
  summary: SeasonSummary;
}

export function CaptaincyCard({ summary }: CaptaincyCardProps) {
  const { persona } = summary;

  // Calculate accuracy metrics
  const successfulGWsCount = summary.captaincyAnalyses.filter(a => a.wasOptimal).length;
  const accuracyRate = summary.captaincySuccessRate;
  
  // Calculate accuracy color based on performance (for DARK background)
  // 80%+ = Excellent (bright green), 60-79% = Good (cyan), 40-59% = Average (yellow), <40% = Poor (lighter red for contrast)
  const getAccuracyColor = (rate: number) => {
    if (rate >= 80) return 'text-[#00ff87]'; // Excellent - bright green
    if (rate >= 60) return 'text-[#37ffef]'; // Good - cyan
    if (rate >= 40) return 'text-[#fbbf24]'; // Average - yellow/amber
    return 'text-[#ff6b9d]'; // Poor - lighter/brighter red for dark background
  };

  // Calculate herd factor color and percentage (for LIGHT background)
  const herdCount = summary.captaincyAnalyses.filter(a => a.wasMostCaptainedGlobal).length;
  const herdPercentage = Math.round((herdCount / summary.captaincyAnalyses.length) * 100);
  
  const getHerdColor = (percentage: number) => {
    // Lower is better (independent thinking), higher means following the crowd
    // These colors are optimized for light backgrounds
    if (percentage >= 80) return 'text-[#dc2626]'; // Very template - darker red for light bg
    if (percentage >= 60) return 'text-[#d97706]'; // Mostly template - darker amber/orange for light bg
    if (percentage >= 40) return 'text-[#0891b2]'; // Balanced - darker cyan for light bg
    return 'text-[#059669]'; // Differential captaincy - darker green for light bg
  };

  // Generate detailed accuracy breakdown for tooltip
  const accuracyDetails = summary.captaincyAnalyses.map(a => ({
    gw: a.gameweek,
    captain: a.captainName,
    captainPts: a.captainPoints / 2, // Divide by multiplier to get raw points
    bestPick: a.bestPickName,
    bestPts: a.bestPickPoints / 2,
    wasOptimal: a.wasOptimal,
  }));

  const successfulGWs = accuracyDetails.filter(d => d.wasOptimal);
  const missedGWs = accuracyDetails.filter(d => !d.wasOptimal);

  // Accuracy dialog content - cleaner, more readable format
  const accuracyDialogContent = (
    <div className="text-white">
      <div className="grid grid-cols-1 gap-3">
        {/* Summary Stats */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Season Summary</div>
          <div className="text-xl font-black text-[#00ff87]">{successfulGWs.length} / {summary.captaincyAnalyses.length}</div>
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

  // Generate points left on table breakdown
  const pointsLostDetails = summary.captaincyAnalyses
    .filter(a => a.pointsLeftOnTable > 0)
    .map(a => ({
      gw: a.gameweek,
      captain: a.captainName,
      captainPts: a.captainPoints,
      bestPick: a.bestPickName,
      bestPts: a.bestPickPoints,
      lost: a.pointsLeftOnTable,
    }));

  // Points lost dialog content
  const pointsLostDialogContent = (
    <div className="text-white">
      <div className="grid grid-cols-1 gap-3">
        {/* Summary Stats */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">Total Points Left on Table</div>
          <div className="text-2xl font-black text-[#ff6b9d]">-{summary.captaincyPointsLost}</div>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 03: The Armband</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8 text-center uppercase italic">Captaincy</h2>

        {/* Global Insight - NEW */}
        <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0">
              🛡️
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Persona Insight</p>
              <p className="text-sm text-white font-medium leading-relaxed italic">
                {summary.captaincySuccessRate > 80
                  ? `Clinical leadership. You have a ${persona.name} level of clarity when picking a captain.`
                  : summary.captaincySuccessRate > 60
                    ? `Like ${persona.name}, you mostly trust the right people. A solid season for the armband.`
                    : summary.captaincySuccessRate > 40
                      ? `A few missed opportunities. Even ${persona.name} has games where the tactics don't quite land.`
                      : `Total captaincy chaos. You're overthinking the armband, much like ${persona.name} on a bad day.`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Accuracy</p>
              <InfoDialog title="Captaincy Accuracy Breakdown">
                {accuracyDialogContent}
              </InfoDialog>
            </div>
            <p className={`text-3xl font-black ${getAccuracyColor(accuracyRate)}`}>
              {Math.round(accuracyRate)}%
            </p>
            <p className="text-[9px] font-medium text-white/40 uppercase mt-1">
              {successfulGWsCount}/{summary.captaincyAnalyses.length} Gameweeks
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Season Best</p>
              <InfoTooltip 
                maxWidth="max-w-[260px]"
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Season Best Captain</p>
                    <p>Your highest-scoring captain choice across all gameweeks this season.</p>
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-white/70 text-xs">Points shown include the captain multiplier (2x).</p>
                    </div>
                  </div>
                } 
              />
            </div>
            {summary.bestCaptainPick ? (
              <div>
                <p className="text-3xl font-black text-[#00ff87]">{summary.bestCaptainPick.captainPoints}</p>
                <p className="text-[9px] font-medium text-white/40 uppercase mt-1">
                  {summary.bestCaptainPick.captainName} • GW{summary.bestCaptainPick.gameweek}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-black text-white/40">—</p>
            )}
          </div>
        </div>

        {/* Comparison Area */}
        <div className="bg-white rounded-[2rem] overflow-hidden mb-8">
          <div className="p-8 text-black border-b border-black/5">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase text-center">Points Left on Table</p>
              <InfoDialog title="Points Left on Table - Full Breakdown" variant="light">
                {pointsLostDialogContent}
              </InfoDialog>
            </div>
            <div className="text-6xl font-black tracking-tighter text-center italic mb-4">
              -{summary.captaincyPointsLost}
            </div>
            <p className="text-center text-[10px] text-black/40 font-bold uppercase tracking-widest">
              Captain vs Your Team&apos;s Top Scorer
            </p>
          </div>

          <div className="bg-black/5 p-6 flex justify-between items-center px-8">
            <div className="text-left">
              <p className="text-[9px] font-bold text-black/30 tracking-widest uppercase mb-1">The Herd Factor</p>
              <p className="text-xs font-bold text-black/70">Followed Global #1 Captain</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${getHerdColor(herdPercentage)}`}>
                {herdPercentage}%
              </p>
              <p className="text-[9px] font-medium text-black/40 uppercase mt-0.5">
                {herdCount}/{summary.captaincyAnalyses.length} GWs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



