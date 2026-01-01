'use client';

import { SeasonSummary } from '@/lib/types';
import { POSITION_COLORS, POSITION_FULL_LABELS, POSITION_EMOJIS, getPositionFromElementType } from '@/lib/constants/positions';
import { SquadInsight } from './squad/SquadInsight';
import { TemplateOverlap } from './squad/TemplateOverlap';
import { ContributionStackedBar } from './squad/ContributionStackedBar';
import { ContributionLegend } from './squad/ContributionLegend';

interface SquadAnalysisCardProps {
  summary: SeasonSummary;
}

export function SquadAnalysisCard({ summary }: SquadAnalysisCardProps) {
  const topContributors = summary.topContributors || [];
  const positionBreakdown = summary.positionBreakdown || [];
  
  if (topContributors.length === 0) {
    return null;
  }

  // Sort positions by points descending
  const sortedPositions = [...positionBreakdown].sort((a, b) => b.points - a.points);

  // Prepare Player Data
  const top4Players = topContributors.slice(0, 4);
  const top4Total = top4Players.reduce((sum, c) => sum + c.percentage, 0);
  
  const playerBarItems = top4Players.map((c) => {
    const pos = getPositionFromElementType(c.player.element_type);
    return {
      percentage: c.percentage,
      color: POSITION_COLORS[pos],
      label: c.player.web_name
    };
  });

  if (100 - top4Total > 0) {
    playerBarItems.push({
      percentage: 100 - top4Total,
      color: '#334155', // slate-700 for a more subtle "others"
      label: 'Others'
    });
  }

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

  const positionLegendItems = sortedPositions.map((pos, i) => ({
    label: `${POSITION_EMOJIS[pos.position]} ${POSITION_FULL_LABELS[pos.position]}`,
    value: `${pos.points} pts`,
    color: POSITION_COLORS[pos.position],
    isHighlight: i === 0
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent to-black/20">
      <div className="max-w-6xl w-full">
        <div className="mb-12 text-center">
          <p className="text-[#00ff87] text-[10px] font-black tracking-[0.4em] uppercase mb-2">Section 05: The Engine Room</p>
          <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Squad Analysis</h2>
          <div className="h-1 w-24 bg-[#00ff87] mx-auto mt-4 rounded-full opacity-50" />
        </div>

        <SquadInsight summary={summary} />
        
        <TemplateOverlap overlap={summary.templateOverlap} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: Top Contributors by Player */}
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Top Contributors</p>
              <span className="text-[10px] font-bold text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full uppercase">By Player</span>
            </div>
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group flex-1 flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
              
              <p className="text-[9px] font-bold text-white/20 tracking-[0.2em] uppercase mb-6 text-center">Points Contribution</p>
              
              <div className="flex-1">
                <ContributionStackedBar items={playerBarItems} />
                <ContributionLegend items={playerLegendItems} />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic">
                  Your top 4 players secured <span className="text-white font-bold">{top4Total.toFixed(0)}%</span> of total points.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Position Breakdown */}
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Top Positions</p>
              <span className="text-[10px] font-bold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full uppercase">By Position</span>
            </div>
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group flex-1 flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors" />
              
              <p className="text-[9px] font-bold text-white/20 tracking-[0.2em] uppercase mb-6 text-center">Squad Composition</p>
              
              <div className="flex-1">
                <ContributionStackedBar items={positionBarItems} />
                <ContributionLegend items={positionLegendItems} />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic">
                  {sortedPositions[0]?.position} dominated with <span className="text-white font-bold">{sortedPositions[0]?.percentage.toFixed(0)}%</span> of your squad&apos;s output.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
