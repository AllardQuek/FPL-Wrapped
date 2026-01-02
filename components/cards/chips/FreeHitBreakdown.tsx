import { ChipAnalysis } from '@/lib/types';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';
import { formatPoints } from '@/lib/analysis/utils';

interface FreeHitBreakdownProps {
    chip: ChipAnalysis;
}

export function FreeHitBreakdown({ chip }: FreeHitBreakdownProps) {
    if (chip.name !== CHIP_NAMES.FREEHIT || chip.metadata?.freeHitPoints === undefined || chip.metadata?.previousTeamPoints === undefined) return null;

    return (
        <div className="text-sm text-white/70 space-y-3">
            <p><strong className="text-white">Free Hit</strong> is compared against what your previous gameweek&apos;s team would have scored.</p>
            
            {/* Raw Data - Two Column Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Hit Team */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-white/50 mb-2">YOUR FREE HIT TEAM (GW{chip.event})</p>
                    {chip.metadata.freeHitPlayers && chip.metadata.freeHitPlayers.length > 0 ? (
                        <div className="space-y-1.5 mb-3">
                            {chip.metadata.freeHitPlayers.map((player, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-white/80 flex items-center gap-1">
                                        {player.name}
                                        {player.multiplier === 2 && <span className="text-[#00ff87] text-[10px]">(C)</span>}
                                    </span>
                                    <span className="text-white font-bold">
                                        {player.points}
                                        {player.multiplier === 2 && <span className="text-[#00ff87] text-[10px]"> ×2</span>}
                                        {player.multiplier === 2 && <span className="text-[#00ff87] ml-1">= {player.points * 2}</span>}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold">Total</span>
                                <span className="font-black text-[#00ff87] text-base">{chip.metadata.freeHitPoints} pts</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-white/70">Team Total</span>
                            <span className="text-white font-black">{chip.metadata.freeHitPoints} pts</span>
                        </div>
                    )}
                </div>

                {/* Previous Team */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-white/50 mb-2">YOUR OLD TEAM (WOULD HAVE SCORED)</p>
                    {chip.metadata.previousTeamPlayers && chip.metadata.previousTeamPlayers.length > 0 ? (
                        <div className="space-y-1.5 mb-3">
                            {chip.metadata.previousTeamPlayers.map((player, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-white/80 flex items-center gap-1">
                                        {player.name}
                                        {player.multiplier === 2 && <span className="text-white/50 text-[10px]">(C)</span>}
                                    </span>
                                    <span className="text-white/70 font-bold">
                                        {player.points}
                                        {player.multiplier === 2 && <span className="text-white/50 text-[10px]"> ×2</span>}
                                        {player.multiplier === 2 && <span className="text-white/50 ml-1">= {player.points * 2}</span>}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold">Total</span>
                                <span className="font-black text-white/70 text-base">{chip.metadata.previousTeamPoints} pts</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-white/70">Team Total</span>
                            <span className="text-white/70 font-black">{chip.metadata.previousTeamPoints} pts</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Net Gain Summary */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Net Gain</span>
                    <span className={`font-black text-base ${chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#ff6b9d]'}`}>
                        {formatPoints(chip.pointsGained)}
                    </span>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                <code className="text-xs text-[#00ff87] font-mono">
                    {chip.metadata.freeHitPoints} - {chip.metadata.previousTeamPoints} = {formatPoints(chip.pointsGained)}
                </code>
            </div>
            
            <p className="text-xs text-white/50">
                <strong>Verdict Thresholds:</strong> 10+ = Clutch, 1-9 = Effective, &lt;0 = Backfired
            </p>
        </div>
    );
}
