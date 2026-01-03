import { CaptaincyAnalysis } from '@/lib/types';
import { InfoDialog } from '@/components/ui/InfoDialog';
import { AccuracyBreakdown } from './AccuracyBreakdown';
import { PointsLostBreakdown } from './PointsLostBreakdown';
import { Star } from 'lucide-react';
import { getAccuracyColor } from './constants';

interface CaptaincyTimelineProps {
  analyses: CaptaincyAnalysis[];
  successRate: number;
  pointsLost: number;
  bestCaptainGW?: number;
}

const ITEMS_PER_ROW = 5;

export function CaptaincyTimeline({ analyses, successRate, pointsLost, bestCaptainGW }: CaptaincyTimelineProps) {
  if (!analyses || analyses.length === 0) return null;

  const accuracyDetails = analyses.map(a => ({
    gw: a.gameweek,
    captain: a.captainName,
    captainPts: a.captainPoints / a.captainMultiplier,
    bestPick: a.bestPickName,
    bestPts: a.bestPickPoints,
    wasOptimal: a.wasOptimal,
    pointsLeft: a.pointsLeftOnTable,
    isSeasonBest: a.gameweek === bestCaptainGW,
  }));

  const successfulGWsCount = analyses.filter(a => a.wasOptimal).length;

  // Group into rows for the snake timeline
  const rows = [];
  for (let i = 0; i < accuracyDetails.length; i += ITEMS_PER_ROW) {
    const row = accuracyDetails.slice(i, i + ITEMS_PER_ROW);
    // Pad the row with nulls to ensure consistent alignment across rows
    while (row.length < ITEMS_PER_ROW) {
      row.push(null as any);
    }
    rows.push(row);
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-end justify-between px-1">
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Captaincy Success Streak</h3>
          
          <div className="flex items-center gap-6">
            {/* Accuracy Stat */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-3xl font-black leading-none ${getAccuracyColor(successRate)}`}>
                  {Math.round(successRate)}%
                </span>
                <InfoDialog title="Captaincy Accuracy Breakdown">
                  <AccuracyBreakdown analyses={analyses} />
                </InfoDialog>
              </div>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-tight">
                {successfulGWsCount}/{analyses.length} Optimal
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 self-center" />

            {/* Points Lost Stat */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-3xl font-black leading-none text-[#ff6b9d]">
                  -{pointsLost}
                </span>
                <InfoDialog title="Points Left on Table - Full Breakdown">
                  <PointsLostBreakdown 
                    analyses={analyses} 
                    totalPointsLost={pointsLost} 
                  />
                </InfoDialog>
              </div>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-tight">
                Points Lost
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 pb-1">
          <div className="flex gap-3 text-[8px] font-bold uppercase tracking-tighter opacity-40">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
              <span>Optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b9d]" />
              <span>Missed</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-tighter text-[#00ff87] animate-pulse">
            <Star className="w-2 h-2 fill-current" />
            <span>Season Best</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/5 overflow-hidden">
        <div className="flex flex-col items-center gap-y-6 sm:gap-y-8">
          {rows.map((row, rowIndex) => {
            const isEvenRow = rowIndex % 2 === 0;
            const isLastRow = rowIndex === rows.length - 1;
            
            return (
              <div 
                key={rowIndex} 
                className={`flex items-center justify-center gap-x-3 sm:gap-x-6 relative w-full ${isEvenRow ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {row.map((analysis, index) => {
                  if (!analysis) {
                    return <div key={`empty-${rowIndex}-${index}`} className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />;
                  }

                  const isLastInRow = index === ITEMS_PER_ROW - 1;
                  const hasNextNode = index < ITEMS_PER_ROW - 1 && row[index + 1] !== null;
                  
                  return (
                    <div key={analysis.gw} className="relative flex-shrink-0">
                      {/* Node */}
                      <div className="group relative">
                        <div 
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center text-[9px] font-black border-2 transition-all shadow-lg cursor-help relative
                            ${analysis.wasOptimal 
                              ? 'bg-[#00ff87]/20 border-[#00ff87] text-[#00ff87] shadow-[#00ff87]/10' 
                              : 'bg-[#ff6b9d]/20 border-[#ff6b9d] text-[#ff6b9d] shadow-[#ff6b9d]/10'
                            }
                            ${analysis.isSeasonBest ? 'ring-4 ring-[#00ff87]/30 scale-110 z-10' : ''}
                          `}
                        >
                          {analysis.isSeasonBest && (
                            <div className="absolute -top-2 -right-2 bg-[#00ff87] text-[#0d0015] rounded-full p-0.5 shadow-lg">
                              <Star className="w-2 h-2 fill-current" />
                            </div>
                          )}
                          <span className="opacity-60 text-[6px] sm:text-[7px] leading-none mb-0.5">GW</span>
                          <span className="text-xs leading-none">{analysis.gw}</span>
                        </div>

                        {/* Hover Info Card */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-32 p-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                          {analysis.isSeasonBest && (
                            <div className="text-[7px] font-black text-[#00ff87] uppercase mb-1 flex items-center justify-center gap-1">
                              <Star className="w-2 h-2 fill-current" /> Season Best <Star className="w-2 h-2 fill-current" />
                            </div>
                          )}
                          <div className="text-[8px] text-white/40 uppercase font-bold mb-1">GW{analysis.gw} Captain</div>
                          <div className="text-[10px] font-bold text-white truncate">{analysis.captain}</div>
                          <div className="text-[10px] font-black text-[#00ff87]">{analysis.captainPts}pts</div>
                          
                          {!analysis.wasOptimal && (
                            <div className="mt-1 pt-1 border-t border-white/5">
                              <div className="text-[7px] text-white/40 uppercase">Should have been</div>
                              <div className="text-[9px] font-bold text-[#ff6b9d] truncate">{analysis.bestPick}</div>
                              <div className="text-[9px] text-white/60">{analysis.bestPts}pts</div>
                            </div>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1a1a]" />
                        </div>
                      </div>

                      {/* Horizontal Line */}
                      {hasNextNode && (
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-10
                            ${isEvenRow ? 'left-full w-3 sm:w-6' : 'right-full w-3 sm:w-6'}`} 
                        />
                      )}

                      {/* Vertical Line to next row */}
                      {isLastInRow && !isLastRow && (
                        <div 
                          className={`absolute top-full h-6 sm:h-8 w-0.5 bg-white/10 -z-10 left-1/2 -translate-x-1/2`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
