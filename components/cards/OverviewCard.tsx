'use client';

import { SeasonSummary } from '@/lib/types';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';

interface OverviewCardProps {
  summary: SeasonSummary;
}

export function OverviewCard({ summary }: OverviewCardProps) {
  const formatRank = (rank: number) => {
    if (rank >= 1000000) return `${(rank / 1000000).toFixed(1)}M`;
    if (rank >= 1000) return `${(rank / 1000).toFixed(0)}K`;
    return rank.toLocaleString();
  };

  const getTrendIcon = () => {
    if (summary.squadValueTrend === 'rising') return <TrendingUp className="w-4 h-4" />;
    if (summary.squadValueTrend === 'falling') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (summary.squadValueTrend === 'rising') return 'text-[#00ff87]';
    if (summary.squadValueTrend === 'falling') return 'text-[#e90052]';
    return 'text-white/50';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-[#00ff87]';  // Bright green - excellent
    if (grade === 'B') return 'text-[#22d3ee]';  // Cyan - good
    if (grade === 'C') return 'text-[#fbbf24]';  // Yellow - average
    if (grade === 'D') return 'text-[#fb923c]';  // Orange - below average
    return 'text-[#e90052]';                      // Red - fail
  };

  const renderOverallGradeTooltip = () => {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-white text-xs">Overall Grade Breakdown</div>
        <div className="text-[11px] text-white/80 leading-relaxed">
          Your overall grade is the average of your performance across three key decision areas:
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/70">Transfer Decisions</span>
            <span className={`text-xs font-bold ${getGradeColor(summary.transferGrade)}`}>{summary.transferGrade}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/70">Captaincy Choices</span>
            <span className={`text-xs font-bold ${getGradeColor(summary.captaincyGrade)}`}>{summary.captaincyGrade}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/70">Bench Management</span>
            <span className={`text-xs font-bold ${getGradeColor(summary.benchGrade)}`}>{summary.benchGrade}</span>
          </div>
        </div>
        <div className="text-[10px] text-white/50 pt-2 border-t border-white/10">
          Each grade reflects your efficiency and decision quality in that area.
        </div>
      </div>
    );
  };

  const formatValue = (value?: number | null) => {
    if (!value || isNaN(value)) return '£100.0m';
    return `£${(value / 10).toFixed(1)}m`;
  };

  const getArchetypeInfo = () => {
    const archetypeData: Record<string, { 
      badge: string; 
      badgeColor: string;
      insight: string; 
      personas: string; 
    }> = {
      'value-builder': {
        badge: 'Value Builder',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        insight: 'You spot bargains early and sell at peaks. Smart trading that grows team value while gaining points.',
        personas: 'Wenger, Amorim, Mourinho',
      },
      'bank-hoarder': {
        badge: 'Strategic Planner',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        insight: 'You maintain cash reserves and time moves carefully. Patient approach waiting for the perfect moment.',
        personas: 'Emery, Ancelotti, Arteta',
      },
      'fully-invested': {
        badge: 'All-In Optimizer',
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        insight: 'Every penny working on the pitch. You maximize value deployment with zero waste.',
        personas: 'Slot, Maresca, Wenger',
      },
      'value-burner': {
        badge: 'Form Chaser',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        insight: 'Aggressive moves chasing form. You prioritize immediate points over long-term value.',
        personas: 'Redknapp, Ten Hag, Postecoglou',
      }
    };

    const archetype = summary.squadValueArchetype;
    return archetype ? archetypeData[archetype] : null;
  };

  const renderValueTrendTooltip = () => {
    const info = getArchetypeInfo();
    
    if (!info) return null;

    return (
      <div className="space-y-2">
        <div className="font-semibold text-white text-xs">Transfer Strategy</div>
        <div className="text-white/80 text-[11px] leading-relaxed">
          {info.insight}
        </div>
        <div className="pt-2 border-t border-white/10">
          <div className="text-[10px] text-white/50 mb-1">Similar managers:</div>
          <div className="text-[#00ff87] text-[10px] font-semibold">
            {info.personas}
          </div>
        </div>
      </div>
    );
  };

  // Calculate rank percentile
  const calculatePercentile = (rank: number) => {
    // Assuming ~10M FPL players globally
    const totalPlayers = 10000000;
    const percentile = ((totalPlayers - rank) / totalPlayers) * 100;
    return Math.round(percentile * 10) / 10; // Round to 1 decimal
  };

  const percentile = calculatePercentile(summary.overallRank);

  const getSeasonOverviewInsight = () => {
    const percentileText = percentile >= 1 ? `Top ${percentile.toFixed(1)}%` : 'Top <0.1%';
    
    if (percentile >= 99) {
      return `${percentileText} globally. Elite territory. You've played with world-class precision and deserve every accolade.`;
    } else if (percentile >= 95) {
      return `${percentileText} finish. Outstanding season with tactical mastery that puts you in rare company.`;
    } else if (percentile >= 85) {
      return `${percentileText} worldwide. Strong campaign, a top-tier finish outplaying the vast majority.`;
    } else if (percentile >= 70) {
      return `${percentileText} globally. Solid season, your decisions mostly landed, navigating the fixture chaos like a pro.`;
    } else if (percentile >= 50) {
      return `${percentileText} finish. Mid-table respectable, every season has its ups and downs, you're right in the mix.`;
    } else if (percentile >= 25) {
      return `${percentileText} placement. Rebuilding season, not every campaign clicks perfectly. Room to grow.`;
    } else {
      return `Learning year. Every manager starts somewhere. Use this as fuel to study and come back stronger.`;
    }
  };

  return (
    <WrappedCardLayout 
      sectionNumber="01: The Résumé" 
      centerContent
    >
      <div className="space-y-6">
        {/* Season Overview Insight */}
        <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 text-black">
              {percentile >= 90 ? '🏆' : percentile >= 70 ? '⚡' : percentile >= 50 ? '⚽' : '📊'}
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Season Overview</p>
              <p className="text-sm text-white font-medium leading-relaxed italic">
                {getSeasonOverviewInsight()}
              </p>
            </div>
          </div>
        </div>

        {/* Big Number Headline */}
        <div className="relative inline-block mb-8 w-full">
          <h2 className="text-[8rem] md:text-[10rem] font-black tracking-tighter text-white opacity-5 select-none leading-none">SCORE</h2>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <p className="text-xs text-[#00ff87] font-bold tracking-widest uppercase mb-1">Total Points</p>
            <p className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white">{summary.totalPoints}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-md">
          <div className="bg-white/5 p-6 md:p-8 backdrop-blur-md">
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2">Final Rank</p>
            <p className="text-2xl md:text-3xl font-black text-white italic">#{formatRank(summary.overallRank)}</p>
          </div>
          <div className="bg-white/5 p-6 md:p-8 border-l border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Overall Grade</p>
              <TooltipPrimitive.Provider delayDuration={300}>
                <TooltipPrimitive.Root>
                  <TooltipPrimitive.Trigger asChild>
                    <button className="inline-flex items-center justify-center p-0.5 opacity-50 hover:opacity-100 transition-opacity">
                      <Info className="w-3 h-3 text-white/70" />
                    </button>
                  </TooltipPrimitive.Trigger>
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="bottom"
                      className="z-50 max-w-[280px] rounded-md border border-white/10 bg-[#0d0015]/95 px-3 py-2 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 backdrop-blur-sm"
                      sideOffset={5}
                    >
                      {renderOverallGradeTooltip()}
                      <TooltipPrimitive.Arrow className="fill-white/10" />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                </TooltipPrimitive.Root>
              </TooltipPrimitive.Provider>
            </div>
            <p className={`text-2xl md:text-3xl font-black italic ${getGradeColor(summary.overallDecisionGrade)}`}>{summary.overallDecisionGrade}</p>
          </div>
        </div>

        {/* Squad Value Card */}
        {summary.currentSquadValue && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center sm:text-left">
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">Squad Value</p>
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-black text-white">{formatValue(summary.currentSquadValue)}</p>
                <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="text-sm font-bold">
                    {(summary.squadValueChange || 0) >= 0 ? '+' : ''}{formatValue(summary.squadValueChange)}
                  </span>
                </div>
              </div>
              {getArchetypeInfo() && (
                <TooltipPrimitive.Provider delayDuration={300}>
                  <TooltipPrimitive.Root>
                    <TooltipPrimitive.Trigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border whitespace-nowrap transition-all hover:opacity-80 hover:scale-105 cursor-pointer ${getArchetypeInfo()!.badgeColor}`}>
                        {getArchetypeInfo()!.badge}
                        <Info className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    </TooltipPrimitive.Trigger>
                    <TooltipPrimitive.Portal>
                      <TooltipPrimitive.Content
                        side="top"
                        className="z-50 max-w-[260px] rounded-md border border-white/10 bg-[#0d0015]/95 px-3 py-2 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 backdrop-blur-sm"
                        sideOffset={5}
                      >
                        {renderValueTrendTooltip()}
                        <TooltipPrimitive.Arrow className="fill-white/10" />
                      </TooltipPrimitive.Content>
                    </TooltipPrimitive.Portal>
                  </TooltipPrimitive.Root>
                </TooltipPrimitive.Provider>
              )}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 text-center sm:text-left">
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1">Peak Form</p>
            <p className="text-xl font-bold text-[#00ff87]">{summary.bestGameweek.points} PTS</p>
            <p className="text-[9px] text-white/40 uppercase">Gameweek {summary.bestGameweek.event}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 text-center sm:text-left">
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1">Low Point</p>
            <p className="text-xl font-bold text-[#e90052]">{summary.worstGameweek.points} PTS</p>
            <p className="text-[9px] text-white/40 uppercase">Gameweek {summary.worstGameweek.event}</p>
          </div>
        </div>
      </div>
    </WrappedCardLayout>
  );
}
