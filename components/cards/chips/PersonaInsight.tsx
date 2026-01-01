'use client';

import { SeasonSummary } from '@/lib/types';

interface PersonaInsightProps {
    summary: SeasonSummary;
}

export function PersonaInsight({ summary }: PersonaInsightProps) {
    const { chipAnalyses } = summary;

    return (
        <div className="bg-white/5 rounded-3xl p-6 mb-16 border border-white/10 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex items-center gap-6 text-left relative z-10">
                <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="absolute inset-0 bg-[#00ff87] rounded-2xl rotate-6 opacity-20 group-hover:rotate-12 transition-transform"></div>
                    <div className="absolute inset-0 bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm">
                        <span className="text-3xl">♟️</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-[#00ff87] uppercase tracking-[0.2em] font-black mb-1">Strategic Review</p>
                    <p className="text-base text-white font-medium leading-relaxed italic">
                        {chipAnalyses.some(c => c.used && c.isExcellent)
                            ? `Strategic brilliance. You knew exactly when to strike, mirroring the clinical timing of the game's elite tacticians.`
                            : chipAnalyses.every(c => !c.used)
                                ? `Patience is a virtue. You're holding your nerve while others panic, a trait found in the most composed veterans.`
                                : `A mix of bold moves and tough breaks. You're playing the game on the edge, much like the most daring tactical masterminds.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
