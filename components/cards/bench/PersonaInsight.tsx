'use client';

import { SeasonSummary } from '@/lib/types';
import { getPersonaImagePath } from '@/lib/constants/persona-images';

interface PersonaInsightProps {
  summary: SeasonSummary;
}

export function PersonaInsight({ summary }: PersonaInsightProps) {
  const { persona } = summary;

  const getStatusEmoji = () => {
    if (summary.benchRegrets > 12) return '🤯';
    if (summary.benchRegrets > 5) return '🤔';
    if (summary.totalBenchPoints < 50) return '🧠';
    return '👍';
  };

  return (
    <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-4 text-left">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPersonaImagePath(persona.key)}
            alt={persona.name}
            className="object-cover w-full h-full"
          />
          <div className="absolute bottom-0 right-0 bg-black/60 rounded-full p-0.5 text-[10px]">
            {getStatusEmoji()}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Manager Critique</p>
          <p className="text-sm text-white font-medium leading-relaxed italic">
            {summary.benchRegrets > 12
              ? `Pure ${persona.name} levels of overthinking. ${summary.benchRegrets} times you benched the wrong player, leaving ${summary.totalBenchPoints} points in the dugout.`
              : summary.benchRegrets > 5
                ? `A few selection headaches. ${summary.benchRegrets} weeks where you picked the wrong XI, but ${persona.name} would respect the squad depth.`
                : summary.totalBenchPoints < 50
                  ? `Masterful team selection. You rarely benched a player who should have started, just as ${persona.name} demands.`
                  : `Solid selection instincts. You usually picked the right XI when it mattered.`}
          </p>
        </div>
      </div>
    </div>
  );
}
