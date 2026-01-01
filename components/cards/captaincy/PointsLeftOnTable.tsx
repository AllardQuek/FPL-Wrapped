import { InfoDialog } from '@/components/ui/InfoDialog';
import { SeasonSummary } from '@/lib/types';
import { PointsLostBreakdown } from './PointsLostBreakdown';
import { getHerdColor } from './constants';

interface PointsLeftOnTableProps {
  summary: SeasonSummary;
}

export function PointsLeftOnTable({ summary }: PointsLeftOnTableProps) {
  const herdCount = summary.captaincyAnalyses.filter(a => a.wasMostCaptainedGlobal).length;
  const herdPercentage = Math.round((herdCount / summary.captaincyAnalyses.length) * 100);

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden mb-8">
      <div className="p-8 text-black border-b border-black/5">
        <div className="flex items-center justify-center gap-2 mb-6">
          <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase text-center">Points Left on Table</p>
          <InfoDialog title="Points Left on Table - Full Breakdown" variant="light">
            <PointsLostBreakdown 
              analyses={summary.captaincyAnalyses} 
              totalPointsLost={summary.captaincyPointsLost} 
            />
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
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">🐑</span>
            <p className="text-[10px] font-black text-black/50 tracking-[0.2em] uppercase">The Herd Factor</p>
          </div>
          <p className="text-[11px] font-bold text-black/70">Followed Global #1 Captain</p>
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
  );
}
