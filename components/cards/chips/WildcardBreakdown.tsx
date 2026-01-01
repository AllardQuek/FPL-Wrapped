import { ChipAnalysis } from '@/lib/types';

interface WildcardBreakdownProps {
    chip: ChipAnalysis;
}

export function WildcardBreakdown({ chip }: WildcardBreakdownProps) {
    if (chip.name !== 'wildcard' || !chip.metadata?.wildcardDetails) return null;

    const { before, after } = chip.metadata.wildcardDetails;

    return (
        <div className="text-sm text-white/70 space-y-3">
            <p>
                <strong className="text-white">Wildcard</strong> impact is measured by comparing your performance relative to the <strong className="text-white">Gameweek Average</strong> before and after the chip.
            </p>
            
            {/* Raw Data */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2">
                    <span>GW</span>
                    <div className="flex gap-4">
                        <span>Score</span>
                        <span>Avg</span>
                        <span>Net</span>
                    </div>
                </div>

                <p className="text-[10px] text-white/50 mb-2 font-bold">BEFORE WILDCARD</p>
                <div className="space-y-1 mb-3">
                    {before.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/70">GW{d.gw}</span>
                            <div className="flex gap-4 font-mono">
                                <span className="text-white w-8 text-right">{d.points - d.hits}</span>
                                <span className="text-white/40 w-8 text-right">{d.avg}</span>
                                <span className={`w-8 text-right ${d.net >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                                    {d.net > 0 ? '+' : ''}{d.net}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold text-xs">Avg vs Field</span>
                        <span className={`font-black ${chip.metadata.avgBefore! >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                            {chip.metadata.avgBefore! > 0 ? '+' : ''}{chip.metadata.avgBefore} pts/GW
                        </span>
                    </div>
                </div>

                <p className="text-[10px] text-white/50 mb-2 mt-4 font-bold">AFTER WILDCARD</p>
                <div className="space-y-1">
                    {after.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/70">GW{d.gw}</span>
                            <div className="flex gap-4 font-mono">
                                <span className="text-white w-8 text-right">{d.points - d.hits}</span>
                                <span className="text-white/40 w-8 text-right">{d.avg}</span>
                                <span className={`w-8 text-right ${d.net >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                                    {d.net > 0 ? '+' : ''}{d.net}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold text-xs">Avg vs Field</span>
                        <span className={`font-black ${chip.metadata.avgAfter! >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                            {chip.metadata.avgAfter! > 0 ? '+' : ''}{chip.metadata.avgAfter} pts/GW
                        </span>
                    </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white font-bold">Net Improvement</span>
                    <span className={`font-black text-base ${chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                        {chip.pointsGained > 0 ? '+' : ''}{chip.pointsGained} pts/GW
                    </span>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-1">CALCULATION</p>
                <p className="text-[11px] leading-relaxed">
                    We compare your average "Points Above Average" before the wildcard to your average "Points Above Average" after. This removes the noise of high or low scoring gameweeks for the general public.
                </p>
            </div>
            
            <p className="text-xs text-white/50 italic">
                * Scores shown are net of any transfer hits.
            </p>
        </div>
    );
}
