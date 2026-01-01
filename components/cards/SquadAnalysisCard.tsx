'use client';

import { SeasonSummary } from '@/lib/types';
import { POSITION_EMOJIS, POSITION_COLORS, POSITION_FULL_LABELS } from '@/lib/constants/positions';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface SquadAnalysisCardProps {
  summary: SeasonSummary;
}

export function SquadAnalysisCard({ summary }: SquadAnalysisCardProps) {
  const topContributors = summary.topContributors || [];
  const positionBreakdown = summary.positionBreakdown || [];
  
  if (topContributors.length === 0) {
    return null;
  }

  const mvp = topContributors[0];
  const others = topContributors.slice(1, 4);

  // Sort positions by points descending
  const sortedPositions = [...positionBreakdown].sort((a, b) => b.points - a.points);

  // Squad building philosophy insight
  const getSquadBuildingInsight = () => {
    const topFourPercentage = topContributors.slice(0, 4).reduce((sum, c) => sum + c.percentage, 0);
    const mvpPercentage = mvp.percentage;
    const templateOverlap = summary.templateOverlap;
    const topPosition = sortedPositions[0];
    const positionDominance = topPosition?.percentage || 0;
    
    // Priority 1: High MVP reliance
    if (mvpPercentage > 25) {
      if (mvpPercentage > 30) {
        return `Dangerously dependent on ${mvp.player.web_name}. Over ${mvpPercentage}% from one player. Brilliant when they deliver, catastrophic when they don't.`;
      }
      return `One-man army. ${mvpPercentage}% from ${mvp.player.web_name}, heavy reliance on your talisman to carry the team.`;
    }
    
    // Priority 2: Extreme differential strategy
    if (templateOverlap < 15) {
      return `Fearless differential hunter. Only ${templateOverlap.toFixed(0)}% template overlap. You zigged while others zagged. High risk, high reward.`;
    }
    
    // Priority 3: Position-specific dominance combined with strategy
    if (positionDominance > 42) {
      if (topPosition.position === 'MID' && mvpPercentage > 20) {
        return `Midfield maestro. ${positionDominance}% from ${topPosition.position}, heavy investment in engine room playmakers paid dividends.`;
      }
      if (topPosition.position === 'FWD' && topFourPercentage > 55) {
        return `Attack-minded approach. ${positionDominance}% from forwards. You backed the goal scorers to deliver big hauls.`;
      }
      if (topPosition.position === 'DEF' && templateOverlap > 25) {
        return `Defence wins championships. ${positionDominance}% from ${topPosition.position}, premium defenders formed your foundation.`;
      }
      return `${topPosition.position}-centric strategy. ${positionDominance}% from one position, bold specialization with clear conviction.`;
    }
    
    // Priority 4: Star-heavy vs balanced approach
    if (topFourPercentage > 65) {
      if (templateOverlap > 30) {
        return `Template premium strategy. ${topFourPercentage}% from top 4 players. You backed the proven essentials everyone owned.`;
      }
      return `Elite or bust. ${topFourPercentage}% from top 4 players. You trusted premium assets to justify their price tags.`;
    }
    
    if (topFourPercentage < 48) {
      if (templateOverlap < 22) {
        return `Contrarian depth builder. Only ${topFourPercentage}% from top 4, spread risk across unique picks rather than chasing big names.`;
      }
      // Should not say "evenly distributed" if MVP is still significant
      if (mvpPercentage < 18) {
        return `Democratic squad structure. Points evenly distributed, no single player carried you, everyone pulled their weight.`;
      }
    }
    
    // Priority 5: Template-based insights
    if (templateOverlap > 35) {
      return `Template follower. ${templateOverlap.toFixed(0)}% template overlap. You played it safe with the crowd, minimizing risk over chasing rank.`;
    }
    
    if (templateOverlap < 20) {
      return `Against the grain. ${templateOverlap.toFixed(0)}% template overlap. You found your own path while others followed the herd.`;
    }
    
    // Default: Balanced approach
    return `Textbook balance. Sensible structure across positions and players, no extreme strategy, just steady competent management.`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 05: The Engine Room</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-12 text-center uppercase italic">Squad Analysis</h2>

        {/* Squad Building Insight */}
        <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md max-w-3xl mx-auto">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0 text-black">
              {mvp.percentage > 25 ? '⭐' : 
               summary.templateOverlap < 20 ? '🦄' : 
               summary.templateOverlap > 30 ? '📋' : '⚖️'}
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Squad Building</p>
              <p className="text-sm text-white font-medium leading-relaxed italic">
                {getSquadBuildingInsight()}
              </p>
            </div>
          </div>
        </div>

        {/* Template Overlap - Full Width Row */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 max-w-3xl w-full">
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {summary.templateOverlap >= 30 ? '🐑' : 
                 summary.templateOverlap >= 20 ? '⚖️' : '🦄'}
              </span>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Template Overlap</p>
                  <InfoTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-semibold text-white">How is this calculated?</p>
                        <div className="space-y-1 text-white/80">
                          <p><strong>Template Player</strong> = Any player with ≥15% ownership</p>
                          <p className="text-xs text-white/60 italic">e.g., Haaland, Semenyo, premium defenders</p>
                        </div>
                        <div className="pt-2 border-t border-white/20">
                          <p className="text-white/90 font-mono text-xs">
                            Template Overlap % = <br/>
                            (Template players in your squad / Total squad slots) × 100
                          </p>
                        </div>
                        <div className="pt-2 space-y-1 text-xs">
                          <p className="text-white/70">📊 Measured across all finished gameweeks</p>
                          <p className="text-white/70">• <strong>30%+</strong>: Template-heavy (following the crowd)</p>
                          <p className="text-white/70">• <strong>20-30%</strong>: Balanced approach</p>
                          <p className="text-white/70">• <strong>&lt;20%</strong>: Differential picks (unique strategy)</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <p className="text-3xl md:text-4xl font-black text-white">{summary.templateOverlap.toFixed(0)}%</p>
                <p className="text-xs text-white/60 font-medium mt-1">
                  {summary.templateOverlap >= 30 ? 'Template-heavy squad approach' : 
                   summary.templateOverlap >= 20 ? 'Balanced squad strategy' : 'Differential king approach'}
                </p>
              </div>
            </div>
            <div className="w-full md:w-56 flex-shrink-0">
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00ff87] via-[#fbbf24] to-[#e90052] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(summary.templateOverlap * 1.5, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[8px] text-white/30 font-bold uppercase">
                <span>🦄 Unique</span>
                <span>⚖️ Balanced</span>
                <span>🐑 Template</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: Top Contributors by Player */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6">Top Contributors</p>
            
            {/* Stacked Bar Chart Visualization */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-bold text-white/30 tracking-[0.2em] uppercase mb-4 text-center">Player Contributions</p>
              
              {/* Stacked Bar */}
              <div className="w-full h-24 bg-white/5 rounded-2xl overflow-hidden flex mb-4 shadow-inner">
                {topContributors.slice(0, 4).map((contributor, i) => {
                  // Monochrome gradient from dark to light
                  const playerColor = i === 0 ? '#059669' : i === 1 ? '#10b981' : i === 2 ? '#34d399' : '#6ee7b7';
                  
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center transition-all hover:brightness-110"
                      style={{ 
                        width: `${contributor.percentage}%`,
                        backgroundColor: playerColor
                      }}
                    >
                      <div className="flex flex-col items-center justify-center px-2">
                        <span 
                          className="text-sm font-black text-white text-center leading-tight"
                          style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
                          }}
                        >
                          {contributor.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* Others section for remaining percentage */}
                {(() => {
                  const top4Total = topContributors.slice(0, 4).reduce((sum, c) => sum + c.percentage, 0);
                  const othersPercentage = 100 - top4Total;
                  
                  if (othersPercentage > 0) {
                    return (
                      <div
                        className="flex items-center justify-center transition-all hover:brightness-110"
                        style={{ 
                          width: `${othersPercentage}%`,
                          backgroundColor: '#64748b'
                        }}
                      >
                        <div className="flex flex-col items-center justify-center px-2">
                          <span 
                            className="text-sm font-black text-white text-center leading-tight"
                            style={{
                              textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
                            }}
                          >
                            {othersPercentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Player Labels */}
              <div className="space-y-2">
                {topContributors.slice(0, 4).map((contributor, i) => {
                  const playerColor = i === 0 ? '#059669' : i === 1 ? '#10b981' : i === 2 ? '#34d399' : '#6ee7b7';
                  
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: playerColor }}
                        />
                        <span className="font-bold text-white uppercase tracking-tight truncate">
                          {contributor.player.web_name}
                        </span>
                        <span className="text-[10px] font-bold text-white/30 uppercase">
                          {contributor.player.element_type === 1 ? 'GKP' : 
                           contributor.player.element_type === 2 ? 'DEF' : 
                           contributor.player.element_type === 3 ? 'MID' : 'FWD'}
                        </span>
                        {i === 0 && <span className="text-xs">👑</span>}
                      </div>
                      <div>
                        <span className="text-white/40 font-bold">{contributor.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic mt-6">
                Top 4 players secured <span className="text-white font-bold">{topContributors.slice(0, 4).reduce((sum, c) => sum + c.percentage, 0)}%</span> of total points.
              </p>
            </div>
          </div>

          {/* RIGHT: Position Breakdown */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6">By Position</p>
            
            {/* Stacked Bar Chart Visualization */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-bold text-white/30 tracking-[0.2em] uppercase mb-4 text-center">Squad Composition</p>
              
              {/* Stacked Bar */}
              <div className="w-full h-24 bg-white/5 rounded-2xl overflow-hidden flex mb-4 shadow-inner">
                {sortedPositions.map((pos) => {
                  // Use darker green for MID position for better contrast
                  const positionColor = pos.position === 'MID' ? '#059669' : POSITION_COLORS[pos.position];
                  
                  return (
                    <div
                      key={pos.position}
                      className="flex items-center justify-center transition-all hover:brightness-110"
                      style={{ 
                        width: `${pos.percentage}%`,
                        backgroundColor: positionColor
                      }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span 
                          className="text-sm font-black text-white"
                          style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
                          }}
                        >
                          {pos.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Position Details Breakdown */}
              <div className="space-y-2">
                {sortedPositions.map((pos, i) => {
                  const positionColor = pos.position === 'MID' ? '#059669' : POSITION_COLORS[pos.position];
                  
                  return (
                    <div key={pos.position} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: positionColor }}
                        />
                        <span className="font-bold text-white uppercase tracking-tight">
                          {POSITION_FULL_LABELS[pos.position]}
                        </span>
                        {i === 0 && <span className="text-xs">👑</span>}
                      </div>
                      <div>
                        <span className="text-white/40 font-bold">{pos.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic mt-6">
                {sortedPositions[0]?.position} dominated with <span className="text-white font-bold">{sortedPositions[0]?.percentage}%</span> of your squad&apos;s output.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
