import { InfoDialog } from '@/components/ui/InfoDialog';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { SeasonSummary } from '@/lib/types';
import { AccuracyBreakdown } from './AccuracyBreakdown';
import { getAccuracyColor } from './constants';

interface StatsGridProps {
  summary: SeasonSummary;
}

export function StatsGrid({ summary }: StatsGridProps) {
  const successfulGWsCount = summary.captaincyAnalyses.filter(a => a.wasOptimal).length;
  const accuracyRate = summary.captaincySuccessRate;

  return (
    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Accuracy</p>
          <InfoDialog title="Captaincy Accuracy Breakdown">
            <AccuracyBreakdown analyses={summary.captaincyAnalyses} />
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
          <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Season Best</p>
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
  );
}
