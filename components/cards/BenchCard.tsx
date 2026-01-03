'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './bench/PersonaInsight';
import { StatsGrid } from './bench/StatsGrid';
import { WorstBenchMiss } from './bench/WorstBenchMiss';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';
import { getSectionById } from '@/lib/constants/wrapped-sections';

interface BenchCardProps {
  summary: SeasonSummary;
}

export function BenchCard({ summary }: BenchCardProps) {
  const section = getSectionById('bench');

  return (
    <WrappedCardLayout 
      sectionNumber={section?.number || "05: The Dugout"} 
      sectionTitle={section?.title || "Selection"}
    >
      <PersonaInsight summary={summary} />

      <StatsGrid summary={summary} benchAnalyses={summary.benchAnalyses} />
      <WorstBenchMiss worstBenchMiss={summary.worstBenchMiss} />
    </WrappedCardLayout>
  );
}
