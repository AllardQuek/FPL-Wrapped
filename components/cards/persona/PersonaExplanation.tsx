'use client';

import React from 'react';
import { SeasonSummary } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface PersonaExplanationProps {
    summary: SeasonSummary;
    primaryColor: string;
}

export function PersonaExplanation({ summary, primaryColor }: PersonaExplanationProps) {
    const generatePersonaExplanation = () => {
        const explanations: { icon: string; text: string; tooltip?: React.ReactNode }[] = [];
        
        // Calculate behavioral indicators
        const transfersPerGW = summary.totalTransfers / 38;
        const hitsPerGW = (summary.totalTransfersCost / 4) / 38;
        const totalHits = Math.round(summary.totalTransfersCost / 4);
        
        // Decision-making style: Risk tolerance based on transfer behavior
        if (hitsPerGW > 0.5) {
            explanations.push({
                icon: '🎲',
                text: `**Risk-taker**: You weren't afraid to take hits to chase points, showing aggressive squad management.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Risk Tolerance Analysis</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Transfer hits taken: <strong>{totalHits}</strong></p>
                            <p>• Avg per gameweek: <strong>{hitsPerGW.toFixed(2)}</strong> hits/GW</p>
                            <p>• Decision style: <strong>Aggressive</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            ⚡ High risk tolerance. You prioritize immediate returns over long-term stability.
                        </div>
                    </div>
                )
            });
        } else if (hitsPerGW < 0.1) {
            explanations.push({
                icon: '🛡️',
                text: `**Cautious planner**: You avoided unnecessary risks, taking only ${totalHits} hits all season.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Conservative Approach</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Transfer hits taken: <strong>{totalHits}</strong></p>
                            <p>• Hit frequency: <strong>{hitsPerGW.toFixed(2)}</strong> hits/GW</p>
                            <p>• Decision style: <strong>Conservative</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🛡️ Low risk tolerance. You value stability and long-term planning.
                        </div>
                    </div>
                )
            });
        }
        
        // Squad churn: How often they reshuffled
        if (transfersPerGW > 1.5) {
            explanations.push({
                icon: '🔄',
                text: `**Serial tinkerer**: You averaged ${transfersPerGW.toFixed(1)} transfers per gameweek, constantly hunting for form.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Squad Churn Rate</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Total transfers: <strong>{summary.totalTransfers}</strong></p>
                            <p>• Transfers per GW: <strong>{transfersPerGW.toFixed(2)}</strong></p>
                            <p>• Management style: <strong>Highly Active</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🔄 Very high activity. You constantly reshaped your squad to chase form and fixtures.
                        </div>
                    </div>
                )
            });
        } else if (transfersPerGW < 0.8) {
            explanations.push({
                icon: '🧘',
                text: `**Patient holder**: You made just ${transfersPerGW.toFixed(1)} transfers per gameweek on average, trusting your picks to come good.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Low Squad Churn</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Total transfers: <strong>{summary.totalTransfers}</strong></p>
                            <p>• Transfers per GW: <strong>{transfersPerGW.toFixed(2)}</strong></p>
                            <p>• Management style: <strong>Passive</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🧘 Low activity. You backed your players through rough patches.
                        </div>
                    </div>
                )
            });
        }
        
        // Decision confidence: Based on captaincy patterns
        if (summary.captaincySuccessRate > 70) {
            explanations.push({
                icon: '🎯',
                text: `**Decisive leader**: Your captain choices consistently hit the mark, showing strong conviction.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Decision Confidence</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Captain success: <strong>{summary.captaincySuccessRate.toFixed(1)}%</strong></p>
                            <p>• Decision quality: <strong>Excellent</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🎯 High confidence in key decisions. You backed the right players at the right time.
                        </div>
                    </div>
                )
            });
        } else if (summary.captaincySuccessRate < 50) {
            explanations.push({
                icon: '🎰',
                text: `**Second-guesser**: Your captain picks suggest you may have overthought the obvious choices.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Decision Uncertainty</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Captain success: <strong>{summary.captaincySuccessRate.toFixed(1)}%</strong></p>
                            <p>• Decision quality: <strong>Inconsistent</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🎰 Lower confidence. Sometimes the obvious choice is the right choice.
                        </div>
                    </div>
                )
            });
        }
        
        // Strategic philosophy: Template vs differential
        if (summary.templateOverlap > 40) {
            explanations.push({
                icon: '📊',
                text: `**Consensus follower**: You embraced the template, prioritizing safety in numbers.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Strategic Philosophy</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Template overlap: <strong>{summary.templateOverlap.toFixed(1)}%</strong></p>
                            <p>• Strategy: <strong>Consensus-based</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            📊 Template-heavy approach. Lower variance, but fewer chances for big rank gains.
                        </div>
                    </div>
                )
            });
        } else if (summary.templateOverlap < 20) {
            explanations.push({
                icon: '🎨',
                text: `**Independent thinker**: You carved your own path, backing unique players others overlooked.`,
                tooltip: (
                    <div className="space-y-2">
                        <p className="font-semibold text-white">Unique Strategy</p>
                        <div className="space-y-1 text-white/80 text-xs">
                            <p>• Template overlap: <strong>{summary.templateOverlap.toFixed(1)}%</strong></p>
                            <p>• Strategy: <strong>Differential-focused</strong></p>
                        </div>
                        <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                            🎨 Differential strategy. Higher variance with potential for massive rank swings.
                        </div>
                    </div>
                )
            });
        }
        
        return explanations;
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-xs font-bold text-black/50 tracking-[0.15em] uppercase text-center">
                    Why This Match?
                </p>
                <InfoTooltip
                    variant="light"
                    content={
                        <div className="space-y-2">
                            <p className="font-semibold text-white">How Personas Are Assigned</p>
                            <div className="space-y-1 text-white/80 text-xs">
                                <p>Your persona is determined by analyzing your behavioral patterns and decision-making style:</p>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li>Risk tolerance (hits, transfers)</li>
                                    <li>Decision confidence (captaincy)</li>
                                    <li>Squad management philosophy</li>
                                    <li>Template vs differential approach</li>
                                </ul>
                            </div>
                            <div className="pt-2 border-t border-white/20 text-xs text-white/70">
                                These insights focus on your play style, not just stats. See the info icons below for detailed reasoning.
                            </div>
                        </div>
                    }
                />
            </div>
            <div className="space-y-2">
                {generatePersonaExplanation().map((item, i) => (
                    <div 
                        key={i} 
                        className="group/item bg-black/[0.02] rounded-xl p-3 border border-black/5 text-left transition-all duration-300 hover:bg-white hover:shadow-md hover:border-black/10"
                    >
                        <div className="flex items-start gap-3">
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-colors duration-300"
                                style={{ backgroundColor: `${primaryColor}10` }}
                            >
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs text-black/75 leading-relaxed flex-1">
                                        {item.text.split('**').map((part, j) => 
                                            j % 2 === 1 ? <strong key={j} className="font-black text-black/90">{part}</strong> : part
                                        )}
                                    </p>
                                    {item.tooltip && (
                                        <div className="flex-shrink-0 mt-0.5 opacity-40 group-hover/item:opacity-100 transition-opacity">
                                            <InfoTooltip variant="light" content={item.tooltip} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
