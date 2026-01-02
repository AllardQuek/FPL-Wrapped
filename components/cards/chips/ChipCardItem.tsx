import { ChipAnalysis } from '@/lib/types';
import { formatPoints } from '@/lib/analysis/utils';
import { InfoDialog } from '@/components/ui/InfoDialog';
import { chipLabels, chipEmojis } from './constants';
import { ChipDialogContent } from './ChipDialogContent';

interface ChipCardItemProps {
    chip: ChipAnalysis;
    index: number;
    isLast: boolean;
}

export function ChipCardItem({ chip, index, isLast }: ChipCardItemProps) {
    return (
        <div className="relative group">
            {/* Horizontal flow marker for desktop */}
            {!isLast && (
                <div className="absolute top-1/2 -right-3 translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
                    <div className={`w-2 h-2 rounded-full ${chip.used ? 'bg-[#00ff87]' : 'bg-white/10'}`}></div>
                </div>
            )}

            <div
                className={`h-full bg-white/5 rounded-[2.5rem] p-6 border transition-all duration-500 hover:scale-[1.05] hover:bg-white/[0.08] ${chip.used
                    ? 'border-white/20 shadow-lg'
                    : 'border-white/5 opacity-60'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${chip.used ? 'bg-white/10' : 'bg-white/5'}`}>
                            {chipEmojis[chip.name]}
                        </div>
                        {chip.used && (
                            <div className="text-right">
                                <p className={`text-xl font-black tracking-tighter ${chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
                                    {formatPoints(chip.pointsGained, false)}
                                </p>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mt-1">Net Gain</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`text-[10px] font-black tracking-[0.1em] uppercase ${chip.used ? 'text-[#00ff87]' : 'text-white/50'}`}>
                                {chip.used ? `GW${chip.event}` : 'Pending'}
                            </p>
                            <InfoDialog title={`${chipLabels[chip.name]} Analysis`}>
                                <ChipDialogContent chip={chip} />
                            </InfoDialog>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic leading-none">
                            {chipLabels[chip.name]}
                        </h3>
                    </div>

                    <div className="pt-auto">
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase mb-3 ${chip.used
                            ? (chip.isExcellent ? 'bg-[#00ff87] text-[#0d0015]' : 'bg-white text-black')
                            : 'bg-white/10 text-white/40'
                            }`}>
                            {chip.verdict}
                        </div>
                        <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                            {chip.details}
                        </p>
                    </div>
                </div>

                {/* Step Badge */}
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shadow-xl transition-colors ${chip.used ? 'bg-[#00ff87] border-[#00ff87] text-[#0d0015]' : 'bg-white/15 border-white/20 text-white/60'
                    }`}>
                    {index + 1}
                </div>
            </div>
        </div>
    );
}
