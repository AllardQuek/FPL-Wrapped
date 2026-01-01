import { ChipAnalysis } from '@/lib/types';

interface BenchBoostBreakdownProps {
    chip: ChipAnalysis;
}

export function BenchBoostBreakdown({ chip }: BenchBoostBreakdownProps) {
    if (chip.name !== 'bboost' || !chip.metadata?.benchPlayers) return null;

    return (
        <div className="text-sm text-white/70 space-y-3">
            <p><strong className="text-white">Bench Boost</strong> counts all points scored by your 4 bench players in that gameweek.</p>
            
            {/* Raw Data */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-2">YOUR BENCH PLAYERS</p>
                <div className="space-y-1.5">
                    {chip.metadata.benchPlayers.map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-white/80">{player.name}</span>
                            <span className="font-black text-[#00ff87]">{player.points} pts</span>
                        </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold">Total</span>
                        <span className="font-black text-[#00ff87] text-base">{chip.pointsGained} pts</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                <code className="text-xs text-[#00ff87] font-mono">
                    {chip.metadata.benchPlayers.map(p => p.points).join(' + ')} = {chip.pointsGained}
                </code>
            </div>
            
            <p className="text-xs text-white/50">
                <strong>Verdict Thresholds:</strong> 15+ = Masterstroke, 5-14 = Decent, &lt;5 = Wasted
            </p>
        </div>
    );
}
