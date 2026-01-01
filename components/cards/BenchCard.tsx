'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './bench/PersonaInsight';
import { StatsGrid } from './bench/StatsGrid';
import { WorstBenchMiss } from './bench/WorstBenchMiss';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';

interface BenchCardProps {
  summary: SeasonSummary;
}

export function BenchCard({ summary }: BenchCardProps) {
  return (
    <WrappedCardLayout 
      sectionNumber="04: The Dugout" 
      sectionTitle="Selection"
    >
      <PersonaInsight summary={summary} />
      <StatsGrid summary={summary} />
      <WorstBenchMiss worstBenchMiss={summary.worstBenchMiss} />
    </WrappedCardLayout>
  );
}
