'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './chips/PersonaInsight';
import { ChipCardItem } from './chips/ChipCardItem';
import { SharedImageFooter } from '../ui/wrapped/SharedImageFooter';
import { getSectionById } from '@/lib/constants/wrapped-sections';

interface ChipsCardProps {
    summary: SeasonSummary;
}

export function ChipsCard({ summary }: ChipsCardProps) {
    const { chipAnalyses } = summary;
    const section = getSectionById('chips');

    // Sort: Used chips by GW ascending, then Unused chips
    const sortedChips = [...chipAnalyses].sort((a, b) => {
        if (a.used && b.used) return a.event - b.event;
        if (a.used) return -1;
        if (b.used) return 1;
        return 0;
    });

    return (
        <div className="min-h-screen flex flex-col items-center p-6 md:p-8">
            <div className="flex-1 flex flex-col justify-center max-w-6xl w-full py-8 md:py-0">
                <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-2 md:mb-4 text-center">Section {section?.number || "06: Power Plays"}</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 md:mb-8 text-center uppercase italic">Chip Strategy</h2>

                <PersonaInsight summary={summary} />

                {/* Timeline Label */}
                <p className="mb-6 md:mb-8 text-center text-white/30 text-xs tracking-[0.3em] uppercase font-bold">
                    Chip Usage Timeline
                </p>

                {/* Chips Journey */}
                <div className="relative">
                    {/* Connector Line for Desktop Flow */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -translate-y-1/2 hidden md:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
                        {sortedChips.map((chip, i) => (
                            <ChipCardItem 
                                key={i} 
                                chip={chip} 
                                index={i} 
                                isLast={i === sortedChips.length - 1} 
                            />
                        ))}
                    </div>
                </div>
            </div>
            <SharedImageFooter />
        </div>
    );
}
