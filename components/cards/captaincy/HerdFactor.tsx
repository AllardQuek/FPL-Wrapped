import { SeasonSummary } from '@/lib/types';
import { getHerdColor } from './constants';

interface HerdFactorProps {
  summary: SeasonSummary;
}

export function HerdFactor({ summary }: HerdFactorProps) {
  const herdCount = summary.captaincyAnalyses.filter(a => a.wasMostCaptainedGlobal).length;
  const herdPercentage = Math.round((herdCount / summary.captaincyAnalyses.length) * 100);

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="bg-black/5 p-4 flex justify-between items-center px-6">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">🐑</span>
            <p className="text-[10px] font-black text-black/50 tracking-[0.15em] uppercase">The Herd Factor</p>
          </div>
          <p className="text-xs font-bold text-black/70 leading-tight">Followed Global #1 Captain</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black leading-none ${getHerdColor(herdPercentage)}`}>
            {herdPercentage}%
          </p>
          <p className="text-[8px] font-bold text-black/30 mt-1 tracking-wider">
            {herdCount}/{summary.captaincyAnalyses.length} GWs
          </p>
        </div>
      </div>
    </div>
  );
}
