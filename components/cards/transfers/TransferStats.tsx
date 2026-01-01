'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { TransferTimingAnalysis } from '@/lib/types';

interface TransferStatsProps {
  totalTransfers: number;
  netImpact: number;
  grade?: string;
  transferTiming?: TransferTimingAnalysis;
  actualTransferGWs?: number;
}

const ChipHandlingNotes = () => (
  <div className="pt-2 border-t border-white/20 space-y-1">
    <p className="text-white/80 font-medium">Chip Handling:</p>
    <ul className="space-y-1 pl-3">
      <li className="text-white/70">• <span className="text-white/90">Free Hit transfers excluded</span> (temporary moves)</li>
      <li className="text-white/70">• <span className="text-white/90">Wildcard transfers</span> counted as net changes only (before vs after)</li>
    </ul>
  </div>
);

const GradeExplanation = ({ netImpact, actualTransferGWs, grade }: { netImpact: number; actualTransferGWs?: number; grade?: string }) => (
  <div className="space-y-2">
    <p className="font-semibold text-white">Transfer Efficiency Grade</p>
    <p className="text-white/90">Based on <strong>Net Impact</strong> divided by actual gameweeks each transfer was held.</p>
    <p className="text-white/80 text-sm pt-1">Accounts for how long you kept each player (not just when you bought):</p>
    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/20">
      <div className="text-center">
        <div className="text-[#00ff87] font-black text-lg">A</div>
        <div className="text-white/70 text-[10px] leading-tight">+2.0 pt per transfer-GW</div>
      </div>
      <div className="text-center">
        <div className="text-[#39d2c0] font-black text-lg">B</div>
        <div className="text-white/70 text-[10px] leading-tight">+1.5 pt per transfer-GW</div>
      </div>
      <div className="text-center">
        <div className="text-white/90 font-black text-lg">C</div>
        <div className="text-white/70 text-[10px] leading-tight">+1.0 pt per transfer-GW</div>
      </div>
      <div className="text-center">
        <div className="text-[#ff8b39] font-black text-lg">D</div>
        <div className="text-white/70 text-[10px] leading-tight">+0.5 pt per transfer-GW</div>
      </div>
      <div className="text-center">
        <div className="text-[#e90052] font-black text-lg">F</div>
        <div className="text-white/70 text-[10px] leading-tight">&lt;+0.5</div>
      </div>
    </div>
    <p className="text-white/60 text-xs pt-2 italic">Example: 20 transfers × 15 GWs avg = 300 transfer-GWs. A≥+600, B≥+450, C≥+300, D≥+150</p>
    {actualTransferGWs && actualTransferGWs > 0 && (
      <div className="mt-3 pt-3 border-t border-white/20">
        <p className="font-semibold text-white mb-2">Your Calculation:</p>
        <div className="space-y-1.5 text-sm">
          <p className="text-white/90">Net Impact: <span className="font-semibold text-white">{netImpact > 0 ? '+' : ''}{netImpact} pts</span></p>
          <p className="text-white/90">Transfer-GWs: <span className="font-semibold text-white">{actualTransferGWs}</span></p>
          <p className="text-white/90">Efficiency: <span className="font-semibold text-white">{(netImpact / actualTransferGWs).toFixed(2)} pts/transfer-GW</span></p>
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/70 text-xs">Your thresholds:</p>
            <div className="grid grid-cols-5 gap-1 mt-1">
              <div className="text-center">
                <div className={`text-xs font-bold ${grade === 'A' ? 'text-[#00ff87]' : 'text-white/50'}`}>A: +{Math.round(actualTransferGWs * 2.0)}</div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-bold ${grade === 'B' ? 'text-[#39d2c0]' : 'text-white/50'}`}>B: +{Math.round(actualTransferGWs * 1.5)}</div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-bold ${grade === 'C' ? 'text-white' : 'text-white/50'}`}>C: +{Math.round(actualTransferGWs * 1.0)}</div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-bold ${grade === 'D' ? 'text-[#ff8b39]' : 'text-white/50'}`}>D: +{Math.round(actualTransferGWs * 0.5)}</div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-bold ${grade === 'F' ? 'text-[#ef4444]' : 'text-white/50'}`}>F: &lt;{Math.round(actualTransferGWs * 0.5)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

function getTimingBadge(timing?: TransferTimingAnalysis) {
  if (!timing) return [];
  
  const totalTransfers = timing.earlyStrategicTransfers + timing.midWeekTransfers + 
                         timing.deadlineDayTransfers + timing.panicTransfers;
  
  if (totalTransfers < 10) return []; // Need sufficient data
  
  // Calculate percentages
  const kneeJerkPct = (timing.kneeJerkTransfers / totalTransfers) * 100;
  const lateNightPct = (timing.lateNightTransfers / totalTransfers) * 100;
  const earlyPct = (timing.earlyStrategicTransfers / totalTransfers) * 100;
  const panicPct = (timing.panicTransfers / totalTransfers) * 100;
  const deadlineDayPct = (timing.deadlineDayTransfers / totalTransfers) * 100;
  const midWeekPct = (timing.midWeekTransfers / totalTransfers) * 100;
  const priceRisePct = (timing.priceRiseChasers / totalTransfers) * 100;
  
  const percentages = { kneeJerkPct, lateNightPct, earlyPct, panicPct, deadlineDayPct, midWeekPct, priceRisePct };
  const counts = {
    early: timing.earlyStrategicTransfers,
    midWeek: timing.midWeekTransfers,
    deadlineDay: timing.deadlineDayTransfers,
    panic: timing.panicTransfers,
    kneeJerk: timing.kneeJerkTransfers,
    lateNight: timing.lateNightTransfers,
    priceRise: timing.priceRiseChasers,
    total: totalTransfers
  };
  
  interface TimingBadge {
    icon: string;
    label: string;
    color: string;
    summary: string;
    fullExplanation: string;
    percentages: typeof percentages;
    counts: typeof counts;
  }
  
  // Collect ALL timing styles with their percentages (no thresholds)
  const allBadges: Array<{pct: number; badge: TimingBadge}> = [
    {
      pct: kneeJerkPct,
      badge: {
        icon: '⚡',
        label: 'Knee-Jerk Specialist',
        color: 'text-[#fbbf24]',
        summary: `${Math.round(kneeJerkPct)}% of your transfers came within 48h of the previous gameweek finishing`,
        fullExplanation: `You react quickly to early gameweek results, making transfers within 48 hours of the previous deadline. This is before all matches finish and full data is available. This indicates a reactive, fast-response transfer style that prioritizes early momentum over complete information.`,
        percentages,
        counts
      }
    },
    {
      pct: priceRisePct,
      badge: {
        icon: '💰',
        label: 'Price Rise Chaser',
        color: 'text-[#00ff87]',
        summary: `${Math.round(priceRisePct)}% of your transfers were made 2 hours before a price rise.`,
        fullExplanation: `You time your transfers around FPL price changes (9:30am Singapore time). Making transfers in the 2-hour window before price rises indicates you're actively monitoring player values and trying to maximize team value. Strategic timing to beat the market!`,
        percentages,
        counts
      }
    },
    {
      pct: lateNightPct,
      badge: {
        icon: '🌙',
        label: 'Night Owl Manager',
        color: 'text-[#a78bfa]',
        summary: `${Math.round(lateNightPct)}% of your transfers were made between 11pm-5am local time`,
        fullExplanation: `You prefer making transfers during late night hours (11pm-5am in your timezone). Whether it's deep strategic thinking after everyone sleeps, deadline pressure, or simply when you have time - you're nocturnal with your FPL decisions!`,
        percentages,
        counts
      }
    },
    {
      pct: panicPct,
      badge: {
        icon: '📰',
        label: 'Team Leaks Waiter',
        color: 'text-[#f59e0b]',
        summary: `${Math.round(panicPct)}% of your transfers happened in the final 3 hours before deadline`,
        fullExplanation: `You make transfers in the final 3 hours before deadline, waiting for the latest team news, press conferences, and lineup leaks. This strategic patience ensures you have maximum information before committing. Informed decision-making at its finest!`,
        percentages,
        counts
      }
    },
    {
      pct: earlyPct,
      badge: {
        icon: '📋',
        label: 'Early Planner',
        color: 'text-[#3b82f6]',
        summary: `${Math.round(earlyPct)}% of your transfers were made 4+ days before the deadline`,
        fullExplanation: `You're methodical and patient, making most transfers 4+ days before the deadline. This gives you time to analyze all data, avoid price drops, and make well-considered decisions without time pressure. Strategic and disciplined!`,
        percentages,
        counts
      }
    }
  ];
  
  // Sort by percentage descending and take top 2
  allBadges.sort((a, b) => b.pct - a.pct);
  
  return allBadges.slice(0, 2).map(q => q.badge);
}

function getGradeColor(grade?: string) {
  switch (grade) {
    case 'A': return 'text-[#00ff87]'; // Primary positive (matches app highlight color)
    case 'B': return 'text-[#3b82f6]'; // Blue accent (matches Squad card)
    case 'C': return 'text-white';
    case 'D': return 'text-[#f59e0b]'; // Amber warning
    case 'F': return 'text-[#ef4444]'; // Red danger
    default: return 'text-white';
  }
}

export function TransferStats({ totalTransfers, netImpact, grade, transferTiming, actualTransferGWs }: TransferStatsProps) {
  const timingBadges = getTimingBadge(transferTiming);
  const gradeColor = getGradeColor(grade);
  
  return (
    <div className="space-y-3 mb-10">
      {/* Top 2 Timing Styles in One Row */}
      {timingBadges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {timingBadges.map((timingBadge, index) => (
            <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Transfer Timing Style</p>
                
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl" role="img" aria-label="timing-icon">{timingBadge.icon}</span>
                  <p className={`text-sm md:text-base font-bold ${timingBadge.color}`}>
                {timingBadge.label}
              </p>
              <InfoTooltip 
                maxWidth="max-w-[380px]"
                content={
                  <div className="space-y-3">
                    <p className="font-semibold text-white">About This Style</p>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {timingBadge.fullExplanation.split('\n\n')[0]}
                    </p>
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-white/80 font-medium mb-2">Your Timing Profile:</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">📋 Early Strategic (4+ days)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.early}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.earlyPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">📅 Mid-Week (1-4 days)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.midWeek}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.midWeekPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">⏰ Deadline Day (3-24 hrs)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.deadlineDay}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.deadlineDayPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">� Team News Waiter (&lt;3 hrs)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.panic}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.panicPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">⚡ Knee-Jerk Reactions</span>
                          <span className="text-white font-semibold">{timingBadge.counts.kneeJerk}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.kneeJerkPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">🌙 Late Night (11pm-5am)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.lateNight}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.lateNightPct)}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">💰 Price Rise Chasers (7:30-9:30am SGT)</span>
                          <span className="text-white font-semibold">{timingBadge.counts.priceRise}/{timingBadge.counts.total} ({Math.round(timingBadge.percentages.priceRisePct)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                  />
                </div>
                
                <p className="text-[10px] md:text-xs text-white/60">
                  {timingBadge.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Net Impact and Grade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Net Impact Card */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Net Impact</p>
              <InfoTooltip 
                maxWidth="max-w-[340px]"
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Total Transfer Profit</p>
                    <p className="text-white/90 text-sm">Cumulative points gained from all players bought vs. those sold, across their entire time in your team, minus transfer costs (hits).</p>
                    <div className="pt-2 border-t border-white/20 space-y-1.5 text-sm">
                      <p className="text-white/80 font-medium">Calculation:</p>
                      <p className="text-white/70">Net Impact = {netImpact > 0 ? '+' : ''}{netImpact} points</p>
                      <p className="text-white/60 text-xs italic">Sum of (points from players bought − points from players sold) − hit costs</p>
                    </div>
                    <ChipHandlingNotes />
                  </div>
                } 
              />
            </div>
            
            <p className="text-3xl md:text-4xl font-black text-white">
              {netImpact > 0 ? '+' : ''}{netImpact}
            </p>
            
            <p className="text-[10px] md:text-xs text-white/60">
              Total points added from transfers
            </p>
          </div>
        </div>

        {/* Grade Card */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Efficiency Grade</p>
              <InfoTooltip 
                maxWidth="max-w-[360px]"
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">Transfer Efficiency Grade</p>
                    <p className="text-white/90 text-sm">Based on points gained per transfer opportunity, accounting for when transfers were made.</p>
                    <div className="pt-2 border-t border-white/20 space-y-1.5 text-sm">
                      <p className="text-white/80 font-medium">Your Score:</p>
                      <p className="text-white/70">Net Impact: {netImpact > 0 ? '+' : ''}{netImpact} points</p>
                      <p className="text-white/70">Transfers Made: {totalTransfers}</p>
                      <p className="text-white/60 text-xs italic">Transfers made earlier in the season have more gameweeks to accumulate points</p>
                    </div>
                    <div className="pt-3 border-t border-white/20">
                      <GradeExplanation netImpact={netImpact} actualTransferGWs={actualTransferGWs} grade={grade} />
                    </div>
                  </div>
                } 
              />
            </div>
            
            <p className={`text-3xl md:text-4xl font-black ${gradeColor}`}>
              {grade || '-'}
            </p>
            
            <p className="text-[10px] md:text-xs text-white/60">
              Quality of transfer decisions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
