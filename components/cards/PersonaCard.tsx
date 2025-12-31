'use client';

import { SeasonSummary } from '@/lib/types';
import Image from 'next/image';
import { useState } from 'react';

interface PersonaCardProps {
    summary: SeasonSummary;
}

export function PersonaCard({ summary }: PersonaCardProps) {
    const { persona } = summary;
    const [imageError, setImageError] = useState(false);

    // Generate explanation for why this persona was assigned
    const generatePersonaExplanation = () => {
        const explanations: { icon: string; text: string }[] = [];
        
        // Transfer analysis
        const transfersPerGW = summary.totalTransfers / 38;
        const hitsPerGW = (summary.totalTransfersCost / 4) / 38;
        if (hitsPerGW > 0.5) {
            explanations.push({
                icon: '🔄',
                text: `**High transfer activity**: You averaged ${transfersPerGW.toFixed(1)} transfers per gameweek and took ${(summary.totalTransfersCost / 4).toFixed(0)} hits, showing you're not afraid to reshape your squad.`
            });
        } else if (hitsPerGW < 0.1) {
            explanations.push({
                icon: '🔄',
                text: `**Patient approach**: You took minimal hits (${(summary.totalTransfersCost / 4).toFixed(0)}) and averaged ${transfersPerGW.toFixed(1)} transfers per gameweek, showing discipline and patience.`
            });
        }
        
        // Transfer efficiency
        if (summary.netTransferPoints > 30) {
            explanations.push({
                icon: '📈',
                text: `**Transfer master**: Your net transfer impact of +${summary.netTransferPoints} points ranks as excellent, proving your moves paid off handsomely.`
            });
        } else if (summary.netTransferPoints < -10) {
            explanations.push({
                icon: '📉',
                text: `**Transfer struggles**: Your net transfer impact of ${summary.netTransferPoints} points suggests your moves didn't quite deliver the value hoped for.`
            });
        }
        
        // Captaincy
        if (summary.captaincySuccessRate > 70) {
            explanations.push({
                icon: '⚡',
                text: `**Elite captaincy**: Your ${summary.captaincySuccessRate.toFixed(0)}% captain success rate shows exceptional decision-making when it matters most.`
            });
        } else if (summary.captaincySuccessRate < 50) {
            explanations.push({
                icon: '⚡',
                text: `**Captain roulette**: Your ${summary.captaincySuccessRate.toFixed(0)}% captain success rate left significant points on the table (${summary.captaincyPointsLost} pts missed).`
            });
        }
        
        // Bench management
        if (summary.benchRegrets > 10) {
            explanations.push({
                icon: '😱',
                text: `**Bench nightmares**: You suffered ${summary.benchRegrets} major bench regrets, leaving ${summary.totalBenchPoints.toFixed(0)} points warming the bench across the season.`
            });
        } else if (summary.benchRegrets <= 3) {
            explanations.push({
                icon: '🎯',
                text: `**Bench master**: Only ${summary.benchRegrets} major bench regrets shows you consistently picked the right starting XI.`
            });
        }
        
        // Template strategy
        if (summary.templateOverlap > 40) {
            explanations.push({
                icon: '🐑',
                text: `**Template loyalist**: Your ${summary.templateOverlap.toFixed(0)}% template overlap shows you trusted the crowd's wisdom and rode the popular picks.`
            });
        } else if (summary.templateOverlap < 20) {
            explanations.push({
                icon: '🦄',
                text: `**Differential king**: Your ${summary.templateOverlap.toFixed(0)}% template overlap proves you marched to your own drum and hunted unique assets.`
            });
        }
        
        return explanations;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="max-w-lg w-full animate-fade-in text-center mb-6">
                <p className="text-white/40 text-xs tracking-[0.2em] uppercase">
                    Your Manager Persona
                </p>
            </div>

            <div className="max-w-lg w-full relative group">
                {/* Main Card */}
                <div className="bg-white rounded-[2rem] p-8 text-black shadow-2xl relative z-10 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(0,0,0,1)_0%,_transparent_70%)]"></div>

                    <div className="text-center relative z-10">
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-[10px] font-bold text-black/40 tracking-[0.2em] uppercase mb-1">
                                Archetype
                            </h2>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                                {persona.title.toUpperCase()}
                            </h1>
                        </div>

                        {/* Avatar */}
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <div className="absolute inset-0 bg-slate-100 rounded-full animate-pulse-slow"></div>
                            <div className="relative w-full h-full rounded-full bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                {persona.imageUrl && !imageError ? (
                                    <Image
                                        src={persona.imageUrl}
                                        alt={persona.name}
                                        fill
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                        sizes="128px"
                                        priority
                                    />
                                ) : (
                                    <span className="text-6xl">{persona.emoji || '👔'}</span>
                                )}
                            </div>
                            {/* Decorative ring */}
                            <div className="absolute -inset-2 border border-black/5 rounded-full"></div>
                        </div>

                        {/* Name & Quote */}
                        <h3 className="text-xl font-black uppercase mb-4 text-black/90">
                            {persona.name}
                        </h3>
                        <p className="text-base leading-relaxed text-black/70 mb-8 px-4 font-medium italic">
                            &ldquo;{persona.description}&rdquo;
                        </p>

                        {/* Why This Match - Always Visible */}
                        <div className="mb-8">
                            <p className="text-xs font-bold text-black/50 tracking-[0.15em] uppercase mb-4 text-center">
                                Why This Match?
                            </p>
                            <div className="space-y-2">
                                {generatePersonaExplanation().map((item, i) => (
                                    <div key={i} className="bg-black/[0.02] rounded-lg p-3 border border-black/5 text-left">
                                        <div className="flex items-start gap-2">
                                            <span className="text-base shrink-0">{item.icon}</span>
                                            <p className="text-xs text-black/75 leading-relaxed">
                                                {item.text.split('**').map((part, j) => 
                                                    j % 2 === 1 ? <strong key={j} className="font-black text-black/90">{part}</strong> : part
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Memorable Moments */}
                        {persona.memorableMoments && persona.memorableMoments.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-black/5">
                                <p className="text-xs font-bold text-black/50 tracking-[0.15em] uppercase mb-4">
                                    {persona.memorableMoments.length > 1 ? 'Defining Moments' : 'Your Season Highlight'}
                                </p>
                                <div className="space-y-3">
                                    {persona.memorableMoments.map((moment, i) => (
                                        <div key={i} className="bg-black/[0.02] rounded-xl p-3 border border-black/5">
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg shrink-0">
                                                    {moment.includes('benched') ? '😱' : 
                                                     moment.includes('captained') && moment.includes('but') ? '😭' :
                                                     moment.includes('captained') ? '🎯' :
                                                     moment.includes('signed') || moment.includes('played') ? '⭐' : '📈'}
                                                </span>
                                                <p className="text-sm text-black/75 leading-relaxed font-medium">
                                                    {moment}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ambient Glow */}
                <div
                    className="absolute -inset-10 rounded-[4rem] blur-3xl opacity-20 -z-10 transition-opacity duration-1000"
                    style={{ backgroundColor: persona.primaryColor }}
                ></div>
            </div>
        </div>
    );
}
