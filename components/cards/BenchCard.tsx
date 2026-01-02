'use client';

import { SeasonSummary } from '@/lib/types';
import { PersonaInsight } from './bench/PersonaInsight';
import { StatsGrid } from './bench/StatsGrid';
import { WorstBenchMiss } from './bench/WorstBenchMiss';
import { BenchBoostComparison } from './bench/BenchBoostComparison';
import { WrappedCardLayout } from '@/components/ui/wrapped/WrappedCardLayout';
import { CHIP_NAMES } from '@/lib/constants/chipThresholds';

interface BenchCardProps {
  summary: SeasonSummary;
}

export function BenchCard({ summary }: BenchCardProps) {
  const benchChip = summary.chipAnalyses?.find(c => c.name === CHIP_NAMES.BBOOST && c.used) ?? null;

  return (
    <WrappedCardLayout 
      sectionNumber="04: The Dugout" 
      sectionTitle="Selection"
    >
      <PersonaInsight summary={summary} />

      {/* Bench Boost comparison (if used) */}
      <BenchBoostComparison chip={benchChip} />

      <StatsGrid summary={summary} />
      <WorstBenchMiss worstBenchMiss={summary.worstBenchMiss} />
    </WrappedCardLayout>
  );
}
