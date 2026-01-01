import { ChipAnalysis } from '@/lib/types';

interface WildcardBreakdownProps {
    chip: ChipAnalysis;
}

export function WildcardBreakdown({ chip }: WildcardBreakdownProps) {
    if (chip.name !== 'wildcard' || !chip.metadata?.gameweeksBefore || !chip.metadata?.gameweeksAfter) return null;

    return (
        <div className="text-sm text-white/70 space-y-3">
            <p><strong className="text-white">Wildcard</strong> impact is measured by comparing average points per gameweek before vs after.</p>
            
            {/* Raw Data */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-2">BEFORE WILDCARD</p>
                <div className="space-y-1 mb-3">
                    {chip.metadata.gameweeksBefore.map((gw, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/70">GW{gw}</span>
                            <span className="text-white">{chip.metadata?.pointsBefore?.[idx]} pts</span>
                        </div>
                    ))}
                    <div className="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold text-sm">Average</span>
                        <span className="font-black text-white">{chip.metadata.avgBefore} pts/GW</span>
                    </div>
                </div>

                <p className="text-xs text-white/50 mb-2 mt-4">AFTER WILDCARD</p>
                <div className="space-y-1">
                    {chip.metadata.gameweeksAfter.map((gw, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/70">GW{gw}</span>
                            <span className="text-white">{chip.metadata?.pointsAfter?.[idx]} pts</span>
                        </div>
                    ))}
                    <div className="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold text-sm">Average</span>
                        <span className="font-black text-[#00ff87]">{chip.metadata.avgAfter} pts/GW</span>
                    </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white font-bold">Impact</span>
                    <span className={`font-black text-base ${chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                        {chip.pointsGained > 0 ? '+' : ''}{chip.pointsGained} pts/GW
                    </span>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                <code className="text-xs text-[#00ff87] font-mono">
                    {chip.metadata.avgAfter} - {chip.metadata.avgBefore} = {chip.pointsGained}
                </code>
            </div>
            
            <p className="text-xs text-white/50">
                <strong>Verdict Thresholds:</strong> 5+ = Transformed, 0-4 = Improved, &lt;0 = Tough Run
            </p>
        </div>
    );
}
