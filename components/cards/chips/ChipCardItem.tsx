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
                className={`h-full bg-white/5 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 border transition-all duration-500 hover:scale-[1.05] hover:bg-white/[0.08] ${chip.used
                    ? 'border-white/20 shadow-lg'
                    : 'border-white/5 opacity-60'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header Section: Horizontal on mobile, Vertical on desktop */}
                    <div className="flex flex-row md:flex-col justify-between items-start md:items-stretch gap-4">
                        {/* Left Side (Mobile) / Bottom Side (Desktop) */}
                        <div className="flex-1 order-1 md:order-2">
                            <div className="flex items-center gap-2 mb-1">
                                <p className={`text-[10px] font-black tracking-[0.1em] uppercase ${chip.used ? 'text-[#00ff87]' : 'text-white/50'}`}>
                                    {chip.used ? `GW${chip.event}` : 'Pending'}
                                </p>
                                <InfoDialog title={`${chipLabels[chip.name]} Analysis`}>
                                    <ChipDialogContent chip={chip} />
                                </InfoDialog>
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-white uppercase italic leading-none">
                                {chipLabels[chip.name]}
                            </h3>
                        </div>

                        {/* Right Side (Mobile) / Top Side (Desktop) */}
                        <div className="flex flex-col items-end md:items-start md:flex-row md:justify-between order-2 md:order-1">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-inner ${chip.used ? 'bg-white/10' : 'bg-white/5'} mb-2 md:mb-0`}>
                                {chipEmojis[chip.name]}
                            </div>
                            {chip.used && (
                                <div className="text-right">
                                    <p className={`text-lg md:text-xl font-black tracking-tighter ${chip.pointsGained >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
                                        {formatPoints(chip.pointsGained, false)}
                                    </p>
                                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mt-1">Net Gain</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto md:mt-2">
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${chip.used
                            ? (chip.isExcellent ? 'bg-[#00ff87] text-[#0d0015]' : 'bg-white text-black')
                            : 'bg-white/10 text-white/40'
                            }`}>
                            {chip.verdict}
                        </div>
                    </div>
                </div>

                {/* Step Badge */}
                <div className={`absolute -top-3 -left-2 md:-left-3 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shadow-xl transition-colors ${chip.used ? 'bg-[#00ff87] border-[#00ff87] text-[#0d0015]' : 'bg-white/15 border-white/20 text-white/60'
                    }`}>
                    {index + 1}
                </div>
            </div>
        </div>
    );
}
