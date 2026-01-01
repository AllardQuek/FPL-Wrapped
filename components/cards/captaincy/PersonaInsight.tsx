import { ManagerPersona } from '@/lib/types';
import { getPersonaImagePath } from '@/lib/constants/persona-images';

interface PersonaInsightProps {
  successRate: number;
  persona: ManagerPersona;
}

export function PersonaInsight({ successRate, persona }: PersonaInsightProps) {
  const getInsightText = () => {
    if (successRate > 80) {
      return `Clinical leadership. You have a ${persona.name} level of clarity when picking a captain.`;
    }
    if (successRate > 60) {
      return `Like ${persona.name}, you mostly trust the right people. A solid season for the armband.`;
    }
    if (successRate > 40) {
      return `A few missed opportunities. Even ${persona.name} has games where the tactics don't quite land.`;
    }
    return `Total captaincy chaos. You're overthinking the armband, much like ${persona.name} on a bad day.`;
  };

  const getStatusEmoji = () => {
    if (successRate > 80) return '🎯';
    if (successRate > 60) return '✅';
    if (successRate > 40) return '⚠️';
    return '🌪️';
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
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">The Armband Logic</p>
          <p className="text-sm text-white font-medium leading-relaxed italic">
            {getInsightText()}
          </p>
        </div>
      </div>
    </div>
  );
}
