'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './captaincy/PersonaInsight';
import { StatsGrid } from './captaincy/StatsGrid';
import { PointsLeftOnTable } from './captaincy/PointsLeftOnTable';
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
        persona={summary.persona} 
      />

      <StatsGrid summary={summary} />

      <PointsLeftOnTable summary={summary} />
    </WrappedCardLayout>
  );
}
