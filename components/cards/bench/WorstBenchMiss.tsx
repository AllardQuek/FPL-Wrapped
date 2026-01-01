'use client';

import { BenchAnalysis } from '@/lib/types';

interface WorstBenchMissProps {
  worstBenchMiss: BenchAnalysis | null;
}

export function WorstBenchMiss({ worstBenchMiss }: WorstBenchMissProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 text-black mb-8 relative overflow-hidden">
      <div className="relative z-10 text-center">
        <p className="text-[9px] sm:text-[10px] font-bold text-black/30 tracking-widest uppercase mb-4 sm:mb-6">Biggest Bench Miss</p>
        {worstBenchMiss ? (
          <>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter italic mb-2">
              {worstBenchMiss.missedPoints} PTS
            </div>
            <p className="text-xs sm:text-sm font-bold text-black mb-1 uppercase">
              {worstBenchMiss.bestBenchPick?.player.web_name} ({worstBenchMiss.bestBenchPick?.points} pts)
            </p>
            <p className="text-[9px] sm:text-[10px] text-black/40 font-bold uppercase tracking-widest">
              GW{worstBenchMiss.gameweek} • Benched for a {worstBenchMiss.lowestStarterPoints}pt starter
            </p>
          </>
        ) : (
          <div className="text-xl font-bold italic py-4">Absolute Perfection.</div>
        )}
      </div>
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <span className="text-[8rem] sm:text-[10rem] font-black rotate-12">LOCK</span>
      </div>
    </div>
  );
}
