'use client';

import { SeasonSummary, BenchAnalysis } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/CustomTooltip';
import { InfoDialog } from '@/components/ui/InfoDialog';
import { SelectionErrorsDialog } from './SelectionErrorsDialog';

interface StatsGridProps {
  summary: SeasonSummary;
  // Optional override allowing parent to pass bench analyses filtered for bench-boost weeks
  benchAnalyses?: BenchAnalysis[];
}

export function StatsGrid({ summary, benchAnalyses: benchAnalysesProp }: StatsGridProps) {
  const benchAnalyses = benchAnalysesProp ?? summary.benchAnalyses ?? [];

  const totalBenchPoints = benchAnalyses.reduce((s, b) => s + (b.benchPoints || 0), 0);
  const gwCount = benchAnalyses.length;
  const avgBench = gwCount > 0 ? totalBenchPoints / gwCount : 0;
  const benchRegrets = benchAnalyses.filter((b) => b.hadBenchRegret).length;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-6 sm:mb-8 text-left">
      <div className="bg-white/5 rounded-2xl p-3.5 sm:p-6 border border-white/5">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-white/40 tracking-widest uppercase">Selection Errors</p>
          <InfoDialog title="Selection Errors Breakdown">
            <SelectionErrorsDialog benchAnalyses={benchAnalyses} />
          </InfoDialog>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-[#00ff87] leading-tight">
          {benchRegrets} <span className="text-[10px] sm:text-xs uppercase tracking-widest opacity-50">Weeks</span>
        </p>
      </div>
      <div className="bg-white/5 rounded-2xl p-3.5 sm:p-6 border border-white/5">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-white/40 tracking-widest uppercase">Avg Bench Points</p>
          <InfoTooltip 
            maxWidth="max-w-[260px]"
            content={
              <div className="space-y-2">
                <p className="font-semibold text-white">Average Bench Points</p>
                <p>The average points your substitutes scored per gameweek.</p>
                <div className="pt-2 border-t border-white/20 space-y-1">
                  <p className="text-white/90 text-xs font-mono">
                    {totalBenchPoints} total pts ÷ {gwCount} GWs = {avgBench.toFixed(1)}
                  </p>
                  <p className="text-white/70 text-xs">
                    This shows how many points you typically left on the bench each week.
                  </p>
                </div>
              </div>
            } 
          />
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {avgBench.toFixed(1)} <span className="text-[10px] sm:text-xs uppercase tracking-widest opacity-50">per GW</span>
        </p>
      </div>
    </div>
  );
}
