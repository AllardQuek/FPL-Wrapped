import { ChipAnalysis } from '@/lib/types';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';
import { formatPoints } from '@/lib/analysis/utils';

interface TripleCaptainBreakdownProps {
    chip: ChipAnalysis;
}

export function TripleCaptainBreakdown({ chip }: TripleCaptainBreakdownProps) {
    if (chip.name !== CHIP_NAMES.THREE_XC || !chip.metadata?.captainName || chip.metadata?.captainBasePoints === undefined) return null;

    return (
        <div className="text-sm text-white/70 space-y-3">
            <p><strong className="text-white">Triple Captain</strong> gives your captain 3x points instead of 2x. The net gain is the base points (not doubled).</p>
            
            {/* Raw Data */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-2">YOUR TRIPLE CAPTAIN</p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{chip.metadata.captainName}</span>
                        <span className="text-xs text-white/50">Base Points</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Normal captain (2x)</span>
                        <span className="text-white">{chip.metadata.captainBasePoints} × 2 = {chip.metadata.captainBasePoints * 2} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Triple captain (3x)</span>
                        <span className="text-[#00ff87] font-bold">{chip.metadata.captainBasePoints} × 3 = {chip.metadata.captainBasePoints * 3} pts</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white font-bold">Net Gain</span>
                        <span className="font-black text-[#00ff87] text-base">{formatPoints(chip.pointsGained)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                <code className="text-xs text-[#00ff87] font-mono">
                    Net Gain = ({chip.metadata.captainBasePoints} × 3) - ({chip.metadata.captainBasePoints} × 2) = {formatPoints(chip.pointsGained)}
                </code>
            </div>
            
            <p className="text-xs text-white/50">
                <strong>Verdict Thresholds:</strong> 12+ = Elite Timing, 4-11 = Solid, &lt;4 = Unfortunate
            </p>
        </div>
    );
}
