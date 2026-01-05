'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SeasonSummary } from '@/lib/types';
import { POSITION_COLORS, POSITION_FULL_LABELS, POSITION_EMOJIS, getPositionFromElementType } from '@/lib/constants/positions';
import { SquadInsight } from './squad/SquadInsight';
import { TemplateOverlap } from './squad/TemplateOverlap';
import { ContributionStackedBar } from './squad/ContributionStackedBar';
import { ContributionLegend } from './squad/ContributionLegend';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';
import { getSectionById } from '@/lib/constants/wrapped-sections';

interface SquadAnalysisCardProps {
  summary: SeasonSummary;
}

export function SquadAnalysisCard({ summary }: SquadAnalysisCardProps) {
  const [showPlayerLegend, setShowPlayerLegend] = useState(false);
  const [showPositionLegend, setShowPositionLegend] = useState(false);
  
  const topContributors = summary.topContributors || [];
  const positionBreakdown = summary.positionBreakdown || [];
  const section = getSectionById('squadAnalysis');
  
  if (topContributors.length === 0) {
    return null;
  }

  // Sort positions by points descending
  const sortedPositions = [...positionBreakdown].sort((a, b) => b.points - a.points);

  // Helper: ensure integer percentages sum to 100 by adjusting one or more groups
  function normalizePercentages<T extends { percentage: number }>(items: T[]): T[] {
    if (!items || items.length === 0) return items;

    const rounded = items.map(it => Math.round(it.percentage));
    const sum = rounded.reduce((s, n) => s + n, 0);
    const adjusted = rounded.slice();
    const delta = 100 - sum;

    if (delta === 0) {
      return items.map((it, i) => ({ ...it, percentage: adjusted[i] }));
    }

    if (delta > 0) {
      // Prefer an item that was rounded down (largest fractional part), else the largest group
      let bestIdx = 0;
      let bestFrac = -1;
      items.forEach((it, i) => {
        const frac = it.percentage - Math.floor(it.percentage);
        if (frac > bestFrac) { bestFrac = frac; bestIdx = i; }
      });
      if (bestFrac <= 0) {
        bestIdx = items.reduce((best, it, i) => it.percentage > items[best].percentage ? i : best, 0);
      }
      adjusted[bestIdx] += delta;
    } else {
      // delta < 0: subtract excess from the largest rounded group(s)
      let need = -delta;
      while (need > 0) {
        const idx = adjusted.reduce((bestIdx, val, i) => val > adjusted[bestIdx] ? i : bestIdx, 0);
        const dec = Math.min(need, adjusted[idx]);
        adjusted[idx] -= dec;
        need -= dec;
      }
    }

    return items.map((it, i) => ({ ...it, percentage: adjusted[i] }));
  }

  // Prepare Player Data
  const top4Players = topContributors.slice(0, 4);

  const playerBarItems = top4Players.map((c) => {
    const pos = getPositionFromElementType(c.player.element_type);
    return {
      percentage: c.percentage,
      color: POSITION_COLORS[pos],
      label: c.player.web_name
    };
  });

  const rawTop4Total = top4Players.reduce((sum, c) => sum + c.percentage, 0);

  if (100 - rawTop4Total > 0) {
    playerBarItems.push({
      percentage: 100 - rawTop4Total,
      color: '#334155', // slate-700 for a more subtle "others"
      label: 'Others'
    });
  }

  // Normalize to integer percentages that add up to 100
  const adjustedPlayerBarItems = normalizePercentages(playerBarItems);
  const playerLegendItems = top4Players.map((c, i) => {
    const pos = getPositionFromElementType(c.player.element_type);
    return {
      label: c.player.web_name,
      subLabel: `${POSITION_EMOJIS[pos]} ${pos}`,
      value: `${c.points} pts`,
      color: POSITION_COLORS[pos],
      isHighlight: i === 0
    };
  });

  // Prepare Position Data
  const positionBarItems = sortedPositions.map(pos => ({
    percentage: pos.percentage,
    color: POSITION_COLORS[pos.position],
    label: pos.position
  }));

  const adjustedPositionBarItems = normalizePercentages(positionBarItems);

  const positionLegendItems = sortedPositions.map((pos, i) => ({
    label: `${POSITION_EMOJIS[pos.position]} ${POSITION_FULL_LABELS[pos.position]}`,
    value: `${pos.points} pts`,
    color: POSITION_COLORS[pos.position],
    isHighlight: i === 0
  }));

  // Display-ready totals (integers) after normalization
  const displayedTop4Total = adjustedPlayerBarItems.slice(0, top4Players.length).reduce((s, it) => s + it.percentage, 0);
  const topPositionPercent = adjustedPositionBarItems[0]?.percentage ?? Math.round(sortedPositions[0]?.percentage ?? 0);

  return (
    <WrappedCardLayout
      sectionNumber={section?.number || "07: The Engine Room"}
      sectionTitle={section?.title || "Squad Analysis"}
      className="max-w-7xl p-4"
    >
      <SquadInsight summary={summary} />

      {/* keep a small decorative underline like the original */}
      <div className="h-1 w-16 bg-[#00ff87] mx-auto mb-2 rounded-full opacity-50 mb-4" />
      
      <TemplateOverlap overlap={summary.templateOverlap} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Top Contributors by Player */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Top Contributors</p>
            <span className="text-[9px] font-bold text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full uppercase">By Player</span>
          </div>
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
            
            <div className="flex-1 flex flex-col">
              <div className="mb-3">
                <p className="text-center text-[11px] text-white/40 font-medium leading-relaxed italic">
                  Your top 4 players secured <span className="text-white font-bold">{displayedTop4Total}%</span> of total points.
                </p>
              </div>

              <ContributionStackedBar items={adjustedPlayerBarItems} />
              
              <button 
                onClick={() => setShowPlayerLegend(!showPlayerLegend)}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 transition-colors group/btn"
              >
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest group-hover/btn:text-white/60 transition-colors">
                  {showPlayerLegend ? 'Hide Details' : 'View Details'}
                </span>
                <ChevronDown className={`w-2.5 h-2.5 text-white/30 group-hover/btn:text-white/60 transition-transform duration-300 ${showPlayerLegend ? 'rotate-180' : ''}`} />
              </button>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showPlayerLegend ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ContributionLegend items={playerLegendItems} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Position Breakdown */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Top Positions</p>
            <span className="text-[9px] font-bold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full uppercase">By Position</span>
          </div>
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
            
            <div className="flex-1 flex flex-col">
              <div className="mb-3">
                <p className="text-center text-[11px] text-white/40 font-medium leading-relaxed italic">
                  {sortedPositions[0]?.position} dominated with <span className="text-white font-bold">{topPositionPercent}%</span> of your squad&apos;s output.
                </p>
              </div>

              <ContributionStackedBar items={adjustedPositionBarItems} />
              
              <button 
                onClick={() => setShowPositionLegend(!showPositionLegend)}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 transition-colors group/btn"
              >
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest group-hover/btn:text-white/60 transition-colors">
                  {showPositionLegend ? 'Hide Details' : 'View Details'}
                </span>
                <ChevronDown className={`w-2.5 h-2.5 text-white/30 group-hover/btn:text-white/60 transition-transform duration-300 ${showPositionLegend ? 'rotate-180' : ''}`} />
              </button>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showPositionLegend ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ContributionLegend items={positionLegendItems} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WrappedCardLayout>
  );
}
