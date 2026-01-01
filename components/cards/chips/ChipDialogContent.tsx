import { ChipAnalysis } from '@/lib/types';
import { chipLabels } from './constants';
import { BenchBoostBreakdown } from './BenchBoostBreakdown';
import { TripleCaptainBreakdown } from './TripleCaptainBreakdown';
import { FreeHitBreakdown } from './FreeHitBreakdown';
import { WildcardBreakdown } from './WildcardBreakdown';
import { ChipVerdict } from './ChipVerdict';

interface ChipDialogContentProps {
    chip: ChipAnalysis;
}

export function ChipDialogContent({ chip }: ChipDialogContentProps) {
    if (!chip.used) {
        return (
            <div className="text-white">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-white/70 leading-relaxed">
                        This chip has not been used yet. Strategic chips can turn your season around when timed correctly.
                    </p>
                </div>
            </div>
        );
    }

    const chipName = chipLabels[chip.name];
    
    return (
        <div className="text-white space-y-4">
            {/* Summary Card */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                    {chipName} Analysis
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                    Used in <strong className="text-white">Gameweek {chip.event}</strong> with a net impact of <strong className={chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}>{chip.pointsGained > 0 ? '+' : ''}{chip.pointsGained} points</strong>.
                </p>
            </div>

            {/* Chip-specific breakdown */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                    How It Was Calculated
                </p>
                
                {chip.name === 'bboost' && <BenchBoostBreakdown chip={chip} />}
                {chip.name === '3xc' && <TripleCaptainBreakdown chip={chip} />}
                {chip.name === 'freehit' && <FreeHitBreakdown chip={chip} />}
                {chip.name === 'wildcard' && <WildcardBreakdown chip={chip} />}
            </div>

            <ChipVerdict chip={chip} />
        </div>
    );
}
