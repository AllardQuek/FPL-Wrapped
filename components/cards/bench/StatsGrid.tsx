'use client';

import { SeasonSummary } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { InfoDialog } from '@/components/ui/InfoDialog';
import { SelectionErrorsDialog } from './SelectionErrorsDialog';

interface StatsGridProps {
  summary: SeasonSummary;
}

export function StatsGrid({ summary }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Selection Errors</p>
          <InfoDialog title="Selection Errors Breakdown">
            <SelectionErrorsDialog benchAnalyses={summary.benchAnalyses} />
          </InfoDialog>
        </div>
        <p className="text-3xl font-black text-[#00ff87]">{summary.benchRegrets} Weeks</p>
      </div>
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Total Bench Points</p>
          <InfoTooltip 
            maxWidth="max-w-[260px]"
            content={
              <div className="space-y-2">
                <p className="font-semibold text-white">Total Bench Points</p>
                <p>The cumulative points scored by all your substitutes throughout the season.</p>
                <div className="pt-2 border-t border-white/20">
                  <p className="text-white/70 text-xs">These are points left on the bench that didn't contribute to your gameweek score.</p>
                </div>
              </div>
            } 
          />
        </div>
        <p className="text-3xl font-black text-white">{summary.totalBenchPoints}</p>
      </div>
    </div>
  );
}
