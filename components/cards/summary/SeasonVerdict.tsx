'use client';

import React, { useMemo } from 'react';
import { MANAGER_QUOTES, CATEGORY_QUOTES } from '@/lib/analysis/persona/quotes';

interface SeasonVerdictProps {
  totalTransfers: number;
  totalTransfersCost: number;
  netImpact: number;
  personaName: string;
  managerId: number;
  templateOverlap: number;
  benchRegrets: number;
}

export function SeasonVerdict({ 
  totalTransfers, 
  totalTransfersCost, 
  netImpact, 
  personaName, 
  managerId,
  templateOverlap,
  benchRegrets
}: SeasonVerdictProps) {
  const insight = useMemo(() => {
    const hitsCount = totalTransfersCost / 4;
    const avgImpact = netImpact / Math.max(1, totalTransfers);
    
    // Use managerId to pick a stable quote
    const quoteIndex = managerId % 3;
    
    // 1. Persona-specific "Easter Eggs"
    if (MANAGER_QUOTES[personaName]) {
      return MANAGER_QUOTES[personaName];
    }

    // 2. Bench Regrets (High priority for relatability)
    if (benchRegrets > 150) {
      return CATEGORY_QUOTES.BENCH_REGRET[quoteIndex % CATEGORY_QUOTES.BENCH_REGRET.length];
    }

    // 3. Template Hugger
    if (templateOverlap > 75) {
      return CATEGORY_QUOTES.TEMPLATE[quoteIndex % CATEGORY_QUOTES.TEMPLATE.length];
    }

    // 4. Statistical Categories
    if (totalTransfers < 15) {
      return CATEGORY_QUOTES.PATIENT[quoteIndex % CATEGORY_QUOTES.PATIENT.length];
    } 
    
    if (totalTransfers > 40) {
      return CATEGORY_QUOTES.CHAOS[quoteIndex % CATEGORY_QUOTES.CHAOS.length];
    }

    if (hitsCount > 8) {
      return CATEGORY_QUOTES.HIT_MERCHANT[quoteIndex % CATEGORY_QUOTES.HIT_MERCHANT.length];
    }

    if (avgImpact > 2) {
      return CATEGORY_QUOTES.SNIPER[quoteIndex % CATEGORY_QUOTES.SNIPER.length];
    }

    // 5. Fallback
    return CATEGORY_QUOTES.FALLBACK[quoteIndex % CATEGORY_QUOTES.FALLBACK.length];
  }, [totalTransfers, totalTransfersCost, netImpact, personaName, managerId, templateOverlap, benchRegrets]);

  const getStatusEmoji = () => {
    if (totalTransfers < 15) return '🛡️';
    if (totalTransfers > 40) return '⚡';
    if (netImpact > 20) return '🎯';
    return '♟️';
  };

  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getStatusEmoji()}</span>
        <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">Season Strategy</span>
      </div>
      <p className="text-sm text-black/60 font-medium leading-relaxed italic px-4">
        &quot;{insight}&quot;
      </p>
    </div>
  );
}
