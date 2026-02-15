import { ManagerPersona } from '@/lib/types';
import { getPersonaImagePath } from '@/lib/constants/persona-images';
import { CAPTAINCY_THRESHOLDS } from '@/lib/constants/captaincyThresholds';
import { InfoTooltip } from '@/components/ui/CustomTooltip';

interface PersonaInsightProps {
  successRate: number;
  templateRate: number;
  consistencyRate: number;
  persona: ManagerPersona;
}

export function PersonaInsight({ successRate, templateRate, consistencyRate, persona }: PersonaInsightProps) {
  const getInsightText = () => {
    const { success, template, consistency } = CAPTAINCY_THRESHOLDS;
    const successTier = successRate > success.excellent ? 3 : successRate > success.good ? 2 : successRate > success.mixed ? 1 : 0;
    const templateHigh = templateRate > template.high;
    const templateMedium = templateRate > template.medium;
    const consistencyHigh = consistencyRate > consistency.high;

    switch (successTier) {
      case 3: // Excellent
        if (templateHigh) return `Clinical leadership. You picked the optimal captain most weeks and often matched the popular choice — a confident, crowd-smart approach.`;
        if (consistencyHigh) return `Clinical leadership. You consistently back the same choices and usually get them right — strong conviction.`;
        return `Clinical leadership. You have a ${persona.name} level of clarity when picking a captain.`;

      case 2: // Good
        if (templateHigh && consistencyHigh) return `Like ${persona.name}, you mostly trust the right people and tend to stick with the same popular picks — steady and crowd-aware.`;
        if (templateHigh) return `Like ${persona.name}, you mostly trust the right people and frequently follow the popular pick — a steady armband strategy.`;
        if (consistencyHigh) return `Like ${persona.name}, you mostly trust the right people and often stick to your trusted choices.`;
        return `Like ${persona.name}, you mostly trust the right people. A solid season for the armband.`;

      case 1: // Mixed
        if (templateMedium && consistencyHigh) return `A few missed opportunities, but you often lean on the template and tend to stick to the same picks — lower-risk, mixed reward.`;
        if (templateMedium) return `A few missed opportunities, but you often lean on the template (popular pick), which keeps risks lower even when the tactics don't land.`;
        if (consistencyHigh) return `A few missed opportunities. You often stick to the same armband choices even when they don't pay off.`;
        return `A few missed opportunities. Even ${persona.name} has games where the tactics don't quite land.`;

      default: // Poor
        if (templateHigh && consistencyHigh) return `You frequently pick the popular captain and rarely change — a safe, template-led approach, but accuracy is low.`;
        if (templateHigh) return `You frequently pick the popular captain, but accuracy is low — you're playing it safe with template picks rather than finding the optimal armband.`;
        if (consistencyHigh) return `You tend to stick to the same choices, but accuracy is low — stubbornness over strategy.`;
        return `Total captaincy chaos. You're overthinking the armband, much like ${persona.name} on a bad day.`;
    }
  };

  const getStatusEmoji = () => {
    const { success, template, consistency } = CAPTAINCY_THRESHOLDS;
    const successTier = successRate > success.excellent ? 3 : successRate > success.good ? 2 : successRate > success.mixed ? 1 : 0;
    const templateHigh = templateRate > template.high;
    const consistencyHigh = consistencyRate > consistency.high;

    if (successTier === 3) return '🎯';
    if (successTier === 2) return '✅';
    if (successTier === 1) return '⚠️';
    if (templateHigh && consistencyHigh) return '🔒';
    if (templateHigh) return '🤝';
    if (consistencyHigh) return '🔁';
    return '🌪️';
  };

  return (
    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 backdrop-blur-md">
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
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">The Armband Logic</p>
            <InfoTooltip 
              content={
                <div className="space-y-2">
                  <p className="font-bold border-b border-white/10 pb-1 mb-1">Armband Metrics</p>
                  <div className="flex justify-between gap-4">
                    <span>Accuracy:</span>
                    <span className="font-mono">{successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Template:</span>
                    <span className="font-mono">{templateRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Consistency:</span>
                    <span className="font-mono">{consistencyRate.toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] text-white/50 pt-1 border-t border-white/10 mt-1">
                    Accuracy is based on picking the highest scorer in your XI.
                  </p>
                </div>
              }
            />
          </div>
          <p className="text-sm text-white font-medium leading-relaxed italic">
            {getInsightText()}
          </p>
        </div>
      </div>
    </div>
  );
}
