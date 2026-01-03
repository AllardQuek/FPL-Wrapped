'use client';

import { SeasonSummary } from '@/lib/types';

interface PersonaInsightProps {
    summary: SeasonSummary;
}

export function PersonaInsight({ summary }: PersonaInsightProps) {
    const { chipAnalyses } = summary;

    return (
        <div className="mb-4 p-0 relative group">
            <div className="flex items-center justify-center gap-4 mb-3 text-center">
                <div className="max-w-xl">
                    {/* <p className="text-[10px] text-[#00ff87] uppercase tracking-[0.2em] font-black mb-1">Strategic Review</p> */}
                    <p className="text-sm text-white font-medium leading-snug italic">
                        {chipAnalyses.some(c => c.used && c.isExcellent)
                                ? `Spot-on timing. Decisive, brilliant plays.`
                                : chipAnalyses.every(c => !c.used)
                                    ? `Patient and steady. Holding firm.`
                                    : `Bold moves with mixed results, intent was right.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
