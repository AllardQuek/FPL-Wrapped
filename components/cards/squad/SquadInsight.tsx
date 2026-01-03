'use client';

import React from 'react';
import { SeasonSummary } from '@/lib/types';
import SQUAD_THRESHOLDS from '@/lib/constants/squadThresholds';

interface SquadInsightProps {
  summary: SeasonSummary;
}

export function SquadInsight({ summary }: SquadInsightProps) {
  const topContributors = summary.topContributors || [];
  const positionBreakdown = summary.positionBreakdown || [];
  
  if (topContributors.length === 0) {
    return null;
  }

  const mvp = topContributors[0];
  const sortedPositions = [...positionBreakdown].sort((a, b) => b.points - a.points);

  const getSquadBuildingInsight = () => {
    const topFourPercentage = topContributors.slice(0, 4).reduce((sum, c) => sum + c.percentage, 0);
    const mvpPercentage = mvp.percentage;
    const templateOverlap = summary.templateOverlap;
    const topPosition = sortedPositions[0];
    const positionDominance = topPosition?.percentage || 0;
    
    // Priority 1: High MVP reliance
    if (mvpPercentage > SQUAD_THRESHOLDS.mvp.heavyReliance) {
      if (mvpPercentage > SQUAD_THRESHOLDS.mvp.dangerousReliance) {
        return `Dangerously dependent on ${mvp.player.web_name}. Over ${mvpPercentage}% from one player. Brilliant when they deliver, catastrophic when they don't.`;
      }
      return `One-man army. ${mvpPercentage}% from ${mvp.player.web_name}, heavy reliance on your talisman to carry the team.`;
    }
    
    // Priority 2: Extreme differential strategy
    if (templateOverlap < SQUAD_THRESHOLDS.templateOverlap.contrarian) {
      return `Fearless differential hunter. Only ${templateOverlap.toFixed(0)}% template overlap. You zigged while others zagged. High risk, high reward.`;
    }
    
    // Priority 3: Position-specific dominance combined with strategy
    if (positionDominance > SQUAD_THRESHOLDS.positionDominance.high) {
      if (topPosition.position === 'MID' && mvpPercentage > 20) {
        return `Midfield maestro. ${positionDominance}% from ${topPosition.position}, heavy investment in engine room playmakers paid dividends.`;
      }
      if (topPosition.position === 'FWD' && topFourPercentage > SQUAD_THRESHOLDS.topFour.strongShare) {
        return `Attack-minded approach. ${positionDominance}% from forwards. You backed the goal scorers to deliver big hauls.`;
      }
      if (topPosition.position === 'DEF' && templateOverlap > 25) {
        return `Defence wins championships. ${positionDominance}% from ${topPosition.position}, premium defenders formed your foundation.`;
      }
      return `${topPosition.position}-centric strategy. ${positionDominance}% from one position, bold specialization with clear conviction.`;
    }
    
    // Priority 4: Star-heavy vs balanced approach
    if (topFourPercentage > SQUAD_THRESHOLDS.topFour.heavyShare) {
      if (templateOverlap > SQUAD_THRESHOLDS.templateOverlap.crowded) {
        return `Template premium strategy. ${topFourPercentage}% from top 4 players. You backed the proven essentials everyone owned.`;
      }
      return `Elite or bust. ${topFourPercentage}% from top 4 players. You trusted premium assets to justify their price tags.`;
    }
    
    if (topFourPercentage < SQUAD_THRESHOLDS.topFour.lowShare) {
      if (templateOverlap < SQUAD_THRESHOLDS.templateOverlap.medium) {
        return `Contrarian depth builder. Only ${topFourPercentage}% from top 4, spread risk across unique picks rather than chasing big names.`;
      }
      if (mvpPercentage < SQUAD_THRESHOLDS.mvp.lowInfluence) {
        return `Democratic squad structure. Points evenly distributed, no single player carried you, everyone pulled their weight.`;
      }
    }
    
    // Priority 5: Template-based insights
    if (templateOverlap > SQUAD_THRESHOLDS.templateOverlap.follower) {
      return `Template follower. ${templateOverlap.toFixed(0)}% template overlap. You played it safe with the crowd, minimizing risk over chasing rank.`;
    }
    
    if (templateOverlap < SQUAD_THRESHOLDS.templateOverlap.low) {
      return `Against the grain. ${templateOverlap.toFixed(0)}% template overlap. You found your own path while others followed the herd.`;
    }
    
    // Default: Balanced approach
    return `Textbook balance. Sensible structure across positions and players, no extreme strategy, just steady competent management.`;
  };

  return (
    <div className="mb-4 p-0 relative group">
      <div className="flex items-center justify-center gap-4 text-center">
        <div className="max-w-xl">
          <p className="text-sm text-white font-medium leading-snug italic">
            {getSquadBuildingInsight()}
          </p>
        </div>
      </div>
    </div>
  );
}
