'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './captaincy/PersonaInsight';
import { HerdFactor } from './captaincy/HerdFactor';
import { CaptaincyTimeline } from './captaincy/CaptaincyTimeline';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';
import { getSectionById } from '@/lib/constants/wrapped-sections';

interface CaptaincyCardProps {
  summary: SeasonSummary;
}

export function CaptaincyCard({ summary }: CaptaincyCardProps) {
  const section = getSectionById('captaincy');

  return (
    <WrappedCardLayout 
      sectionNumber={section?.number || "04: The Armband"} 
      sectionTitle={section?.title || "Captaincy"}
    >
      <PersonaInsight
        successRate={summary.captaincySuccessRate}
        templateRate={summary.captaincyTemplateRate ?? 0}
        consistencyRate={summary.captaincyConsistencyRate ?? 0}
        persona={summary.persona}
      />

      <div className="mb-6">
        <CaptaincyTimeline 
          analyses={summary.captaincyAnalyses} 
          successRate={summary.captaincySuccessRate}
          pointsLost={summary.captaincyPointsLost}
          bestCaptainGW={summary.bestCaptainPick?.gameweek}
        />
      </div>

      <HerdFactor summary={summary} />
    </WrappedCardLayout>
  );
}
