import { ChipAnalysis } from '@/lib/types';

interface ChipVerdictProps {
    chip: ChipAnalysis;
}

export function ChipVerdict({ chip }: ChipVerdictProps) {
    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Final Verdict
            </p>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-black uppercase ${chip.isExcellent ? 'bg-[#00ff87] text-[#0d0015]' : 'bg-white text-black'}`}>
                    {chip.verdict}
                </span>
                <p className="text-sm text-white/70">{chip.details}</p>
            </div>
        </div>
    );
}
