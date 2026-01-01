'use client';

import { SeasonSummary } from '@/lib/types';
import { PERSONALITY_SPECTRUMS } from '@/lib/analysis/persona/constants';
import { PersonaHeader } from './persona/PersonaHeader';
import { PersonaAvatar } from './persona/PersonaAvatar';
import { PersonaIdentity } from './persona/PersonaIdentity';
import { PersonalitySpectrum } from './summary/PersonalitySpectrum';
import { TraitBadges } from './summary/TraitBadges';

interface PersonaCardProps {
    summary: SeasonSummary;
}

export function PersonaCard({ summary }: PersonaCardProps) {
    const { persona } = summary;

    const spectrums = [
        {
            key: 'differential',
            ...PERSONALITY_SPECTRUMS.DIFFERENTIAL_TEMPLATE,
            getTooltip: () => ({
                lowEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.DIFFERENTIAL_TEMPLATE.lowEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Calculated by identifying &quot;Template Picks&quot; (players with ≥15% ownership). Your {Math.round(summary.templateOverlap)}% overlap shows you trust the consensus.
                        </p>
                    </div>
                ),
                highEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.DIFFERENTIAL_TEMPLATE.highEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Calculated by identifying &quot;Template Picks&quot; (players with ≥15% ownership). Your low {Math.round(summary.templateOverlap)}% overlap shows you hunt for unique differentials.
                        </p>
                    </div>
                )
            })
        },
        {
            key: 'analyzer',
            ...PERSONALITY_SPECTRUMS.ANALYZER_INTUITIVE,
            getTooltip: () => ({
                lowEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.ANALYZER_INTUITIVE.lowEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Based on your Transfer Efficiency ({summary.netTransferPoints >= 0 ? '+' : ''}{summary.netTransferPoints} pts) and Captaincy Accuracy ({summary.captaincySuccessRate.toFixed(0)}%). You back decisions with data.
                        </p>
                    </div>
                ),
                highEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.ANALYZER_INTUITIVE.highEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Based on your Transfer Efficiency ({summary.netTransferPoints >= 0 ? '+' : ''}{summary.netTransferPoints} pts) and Captaincy Accuracy ({summary.captaincySuccessRate.toFixed(0)}%). You trust your gut over pure stats.
                        </p>
                    </div>
                )
            })
        },
        {
            key: 'patient',
            ...PERSONALITY_SPECTRUMS.PATIENT_REACTIVE,
            getTooltip: () => {
                const weeks = summary.rankProgression.length;
                const transfersPerWeek = weeks > 0 ? (summary.totalTransfers / weeks).toFixed(1) : '0';
                const longTermHolds = summary.patienceMetrics.longTermHoldsCount;
                const timing = summary.transferTiming;
                const reactiveTransfers = timing.panicTransfers + timing.deadlineDayTransfers + timing.kneeJerkTransfers;

                return {
                    lowEnd: (
                        <div className="space-y-1">
                            <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.PATIENT_REACTIVE.lowEnd.name}?</p>
                            <p className="text-xs text-white/80">
                                {reactiveTransfers > 0 && `You made ${reactiveTransfers} reactive transfers (panic/deadline/knee-jerk). `}
                                Averaging {transfersPerWeek} transfers per week shows you&apos;re quick to react to the market.
                            </p>
                        </div>
                    ),
                    highEnd: (
                        <div className="space-y-1">
                            <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.PATIENT_REACTIVE.highEnd.name}?</p>
                            <p className="text-xs text-white/80">
                                {timing.earlyStrategicTransfers > 0 && `With ${timing.earlyStrategicTransfers} early planned transfers and `}
                                {longTermHolds} players held for 10+ weeks, you show a patient, methodical strategy.
                            </p>
                        </div>
                    )
                };
            }
        },
        {
            key: 'cautious',
            ...PERSONALITY_SPECTRUMS.CAUTIOUS_AGGRESSIVE,
            getTooltip: () => ({
                lowEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.CAUTIOUS_AGGRESSIVE.lowEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Determined by hit-taking. Taking {Math.abs(summary.totalTransfersCost / 4).toFixed(0)} hits shows an aggressive pursuit of immediate gains.
                        </p>
                    </div>
                ),
                highEnd: (
                    <div className="space-y-1">
                        <p className="font-semibold text-white">Why {PERSONALITY_SPECTRUMS.CAUTIOUS_AGGRESSIVE.highEnd.name}?</p>
                        <p className="text-xs text-white/80">
                            Determined by hit-taking. Taking only {Math.abs(summary.totalTransfersCost / 4).toFixed(0)} hits shows a disciplined, risk-averse approach.
                        </p>
                    </div>
                )
            })
        }
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
            
            <div className="max-w-lg w-full animate-fade-in text-center mb-4 relative z-10">
                <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase">
                    Your Manager Persona
                </p>
            </div>

            <div className="max-w-lg w-full relative group">
                {/* Main Card */}
                <div 
                    className="bg-white rounded-[2.5rem] p-6 md:p-8 text-black shadow-2xl relative z-10 overflow-hidden border-2"
                    style={{ borderColor: `${persona.primaryColor}30` }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(0,0,0,1)_0%,_transparent_70%)]"></div>

                    <div className="text-center relative z-10">
                        <PersonaHeader 
                            title={persona.title} 
                            primaryColor={persona.primaryColor} 
                        />
                        
                        <PersonaAvatar 
                            imageUrl={persona.imageUrl} 
                            name={persona.name} 
                            emoji={persona.emoji} 
                            primaryColor={persona.primaryColor}
                        />

                        <div className="mb-8">
                            <PersonaIdentity 
                                name={persona.name} 
                                description={persona.description} 
                                quote={persona.quote}
                                quoteSource={persona.quoteSource}
                            />
                            <div className="mt-2">
                                <TraitBadges 
                                    traits={persona.traits} 
                                    primaryColor={persona.primaryColor} 
                                    centered 
                                />
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-2">Personality Spectrum</p>
                            {spectrums.map(({ key, getTooltip, ...spectrum }) => {
                                const score = persona.spectrums[key as keyof typeof persona.spectrums];
                                return (
                                    <PersonalitySpectrum
                                        key={key}
                                        lowEnd={spectrum.lowEnd}
                                        highEnd={spectrum.highEnd}
                                        score={score}
                                        primaryColor={persona.primaryColor}
                                        tooltipContent={getTooltip()}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Ambient Glow */}
                <div
                    className="absolute -inset-10 rounded-[4rem] blur-[100px] opacity-20 -z-10 transition-opacity duration-1000"
                    style={{ backgroundColor: persona.primaryColor }}
                ></div>
            </div>
        </div>
    );
}
