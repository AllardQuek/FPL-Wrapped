'use client';

import { SeasonSummary, ChipAnalysis } from '@/lib/types';
import { InfoDialog } from '@/components/ui/InfoDialog';

interface ChipsCardProps {
    summary: SeasonSummary;
}

const chipLabels: Record<string, string> = {
    '3xc': 'Triple Captain',
    'bboost': 'Bench Boost',
    'freehit': 'Free Hit',
    'wildcard': 'Wildcard'
};

const chipEmojis: Record<string, string> = {
    '3xc': '🚀',
    'bboost': '🪑',
    'freehit': '🪄',
    'wildcard': '🃏'
};

export function ChipsCard({ summary }: ChipsCardProps) {
    const { chipAnalyses, persona } = summary;

    // Sort: Used chips by GW ascending, then Unused chips
    const sortedChips = [...chipAnalyses].sort((a, b) => {
        if (a.used && b.used) return a.event - b.event;
        if (a.used) return -1;
        if (b.used) return 1;
        return 0;
    });

    // Generate detailed dialog content for each chip
    const getChipDialogContent = (chip: ChipAnalysis) => {
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
                    
                    {chip.name === 'bboost' && chip.metadata?.benchPlayers && (
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
                    )}

                    {chip.name === '3xc' && chip.metadata?.captainName && chip.metadata?.captainBasePoints !== undefined && (
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
                                        <span className="font-black text-[#00ff87] text-base">+{chip.pointsGained} pts</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                                <code className="text-xs text-[#00ff87] font-mono">
                                    Net Gain = ({chip.metadata.captainBasePoints} × 3) - ({chip.metadata.captainBasePoints} × 2) = {chip.pointsGained}
                                </code>
                            </div>
                            
                            <p className="text-xs text-white/50">
                                <strong>Verdict Thresholds:</strong> 12+ = Elite Timing, 4-11 = Solid, &lt;4 = Unfortunate
                            </p>
                        </div>
                    )}

                    {chip.name === 'freehit' && chip.metadata?.freeHitPoints !== undefined && chip.metadata?.previousTeamPoints !== undefined && (
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
                                        {chip.pointsGained > 0 ? '+' : ''}{chip.pointsGained} pts
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <p className="text-xs text-white/50 mb-1">FORMULA</p>
                                <code className="text-xs text-[#00ff87] font-mono">
                                    {chip.metadata.freeHitPoints} - {chip.metadata.previousTeamPoints} = {chip.pointsGained}
                                </code>
                            </div>
                            
                            <p className="text-xs text-white/50">
                                <strong>Verdict Thresholds:</strong> 10+ = Clutch, 1-9 = Effective, &lt;0 = Backfired
                            </p>
                        </div>
                    )}

                    {chip.name === 'wildcard' && chip.metadata?.gameweeksBefore && chip.metadata?.gameweeksAfter && (
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
                    )}
                </div>

                {/* Verdict */}
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
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="max-w-4xl w-full">
                <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 03: Power Plays</p>
                <h2 className="text-4xl font-bold tracking-tight text-white mb-12 text-center uppercase italic">Chip Strategy</h2>

                {/* Persona Insight Box */}
                <div className="bg-white/5 rounded-3xl p-6 mb-16 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="flex items-center gap-4 text-left relative z-10">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 text-black shadow-lg">
                            📊
                        </div>
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Strategic Review</p>
                            <p className="text-sm text-white font-medium leading-relaxed italic">
                                {chipAnalyses.some(c => c.used && c.isExcellent)
                                    ? `Strategic brilliance. Like ${persona.name}, you knew exactly when to strike.`
                                    : chipAnalyses.every(c => !c.used)
                                        ? `Patience is a virtue. You're holding your nerve while others panic, a classic ${persona.name} trait.`
                                        : `A mix of bold moves and tough breaks. Even ${persona.name} knows that FPL is a game of fine margins.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline Label */}
                <p className="mb-8 text-center text-white/30 text-xs tracking-[0.3em] uppercase font-bold">
                    Chip Usage Timeline
                </p>

                {/* Chips Journey */}
                <div className="relative">
                    {/* Connector Line for Desktop Flow */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -translate-y-1/2 hidden md:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                        {sortedChips.map((chip, i) => (
                            <div key={i} className="relative group">
                                {/* Horizontal flow marker for desktop */}
                                {i < sortedChips.length - 1 && (
                                    <div className="absolute top-1/2 -right-3 translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
                                        <div className={`w-2 h-2 rounded-full ${sortedChips[i].used ? 'bg-[#00ff87]' : 'bg-white/10'}`}></div>
                                    </div>
                                )}

                                <div
                                    className={`h-full bg-white/5 rounded-[2.5rem] p-6 border transition-all duration-500 hover:scale-[1.05] hover:bg-white/[0.08] ${chip.used
                                        ? 'border-white/10'
                                        : 'border-white/5 opacity-40 grayscale'
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
                                                        {chip.pointsGained > 0 ? '+' : ''}{chip.pointsGained}
                                                    </p>
                                                    <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">Net Gain</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[8px] font-bold text-white/30 tracking-[0.2em] uppercase">
                                                    {chipLabels[chip.name]}
                                                </p>
                                                <InfoDialog title={`${chipLabels[chip.name]} Analysis`}>
                                                    {getChipDialogContent(chip)}
                                                </InfoDialog>
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase italic leading-none">
                                                {chip.used ? `GW${chip.event}` : 'Pending'}
                                            </h3>
                                        </div>

                                        <div className="mt-auto">
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
                                    <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shadow-xl transition-colors ${chip.used ? 'bg-[#00ff87] border-[#00ff87] text-[#0d0015]' : 'bg-[#0d0015] border-white/10 text-white/20'
                                        }`}>
                                        {i + 1}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
