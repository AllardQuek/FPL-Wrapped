import { ChipAnalysis } from '@/lib/types';
import { CHIP_THRESHOLDS, CHIP_VERDICT_LABELS, CHIP_NAMES } from '@/lib/constants/chipThresholds';
import { formatPoints } from '@/lib/analysis/utils';

interface BenchBoostBreakdownProps {
    chip: ChipAnalysis;
}

export function BenchBoostBreakdown({ chip }: BenchBoostBreakdownProps) {
    if (chip.name !== CHIP_NAMES.BBOOST || !chip.metadata?.benchPlayers) return null;

    const t = CHIP_THRESHOLDS.bboost;

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
                    {chip.metadata.benchPlayers.map(p => p.points).join(' + ')} = {formatPoints(chip.pointsGained)}
                </code>
            </div>
            
            {chip.metadata.benchAverage !== undefined && (
                <div className="mt-3 text-sm text-white/70">
                    <p className="mb-1"><strong>Compared to you:</strong> Your average bench is <span className="font-bold">{chip.metadata.benchAverage} pts</span>, this Bench Boost was <span className="font-bold">{formatPoints(chip.metadata.benchDiff ?? 0)}</span> vs your average.</p>
                    <p className="text-xs text-white/50">Verdict uses both absolute points and how much better your bench did vs your usual bench (e.g. {formatPoints(t.decentDiff)} is often {CHIP_VERDICT_LABELS.bboost.decent}, {formatPoints(t.excellentDiff)} is typically {CHIP_VERDICT_LABELS.bboost.excellent}).</p>
                </div>
            )}
            
            <p className="text-xs text-white/50">
                <strong>Verdict Thresholds:</strong> {formatPoints(t.excellentPoints)} = {CHIP_VERDICT_LABELS.bboost.excellent}, {formatPoints(t.decentPoints)} - {formatPoints(t.excellentPoints - 1)} = {CHIP_VERDICT_LABELS.bboost.decent}, &lt;{formatPoints(t.decentPoints)} = {CHIP_VERDICT_LABELS.bboost.wasted}
            </p>
        </div>
    );
}
