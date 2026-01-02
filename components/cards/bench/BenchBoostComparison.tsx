import { ChipAnalysis } from '@/lib/types';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';
import { formatPoints } from '@/lib/analysis/utils';

interface Props {
  chip?: ChipAnalysis | null;
}

export function BenchBoostComparison({ chip }: Props) {
  if (!chip || chip.name !== CHIP_NAMES.BBOOST || !chip.used) return null;

  const avg = chip.metadata?.benchAverage;
  const diff = chip.metadata?.benchDiff ?? 0;

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-4">
      <div className="flex items-center justify-between mb-1">
        <strong className="text-white">Bench Boost ({chip.event})</strong>
        <span className="text-sm font-black text-[#00ff87]">{formatPoints(chip.pointsGained)}</span>
      </div>
      {avg !== undefined && (
        <p className="text-sm text-white/70">Compared to your average bench of <span className="font-bold">{avg} pts</span>, this was <span className="font-bold">{formatPoints(diff)}</span> ({chip.verdict}).</p>
      )}
      {!chip.metadata?.benchAverage && (
        <p className="text-sm text-white/70">No prior bench data to compare.</p>
      )}
    </div>
  );
}
