'use client';

import { SeasonSummary } from '@/lib/types';
import { StatNumber } from '@/components/ui/StatNumber';

interface MVPCardProps {
  summary: SeasonSummary;
}

export function MVPCard({ summary }: MVPCardProps) {
  if (!summary.mvpPlayer) {
    return null;
  }

  const { player, points } = summary.mvpPlayer;
  const percentOfTotal = ((points / summary.totalPoints) * 100).toFixed(1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-[#00ff87] text-sm mb-4 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          Your MVP
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-8 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Player of Your Season
        </h2>

        {/* MVP Display */}
        <div className="glass-card p-8 mb-8 animate-scale-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-4xl md:text-5xl font-black glow-text text-[#00ff87] mb-2">
            {player.web_name}
          </h3>
          <p className="text-white/60 text-lg">
            {player.first_name} {player.second_name}
          </p>
        </div>

        {/* Points Contribution */}
        <div className="glass-card p-6 mb-6 animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/50 text-sm mb-2">Points Contributed</p>
          <div className="text-5xl font-black text-white">
            <StatNumber value={points} duration={1500} />
          </div>
          <p className="text-[#00ff87] text-lg mt-2">
            {percentOfTotal}% of your total
          </p>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
          <div className="glass-card p-3">
            <p className="text-white/50 text-xs mb-1">Goals</p>
            <p className="text-xl font-bold text-white">{player.goals_scored}</p>
          </div>
          <div className="glass-card p-3">
            <p className="text-white/50 text-xs mb-1">Assists</p>
            <p className="text-xl font-bold text-white">{player.assists}</p>
          </div>
          <div className="glass-card p-3">
            <p className="text-white/50 text-xs mb-1">Clean Sheets</p>
            <p className="text-xl font-bold text-white">{player.clean_sheets}</p>
          </div>
        </div>

        {/* Fun message */}
        <div className="mt-8 animate-fade-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
          <p className="text-white/40 text-sm">
            {player.web_name} carried your team! 💪
          </p>
        </div>
      </div>
    </div>
  );
}



