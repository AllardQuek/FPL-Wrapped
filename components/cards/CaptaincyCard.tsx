'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './captaincy/PersonaInsight';
import { StatsGrid } from './captaincy/StatsGrid';
import { PointsLeftOnTable } from './captaincy/PointsLeftOnTable';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';

interface CaptaincyCardProps {
  summary: SeasonSummary;
}

export function CaptaincyCard({ summary }: CaptaincyCardProps) {
  return (
    <WrappedCardLayout 
      sectionNumber="03: The Armband" 
      sectionTitle="Captaincy"
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
