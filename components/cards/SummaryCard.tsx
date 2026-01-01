'use client';

import { SeasonSummary } from '@/lib/types';
import { getCurrentFPLSeason } from '@/lib/season';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface SummaryCardProps {
  summary: SeasonSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const { persona } = summary;
  const currentSeason = getCurrentFPLSeason();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4">Season Wrap-up</p>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">THE {currentSeason} SEASON</h2>
        </div>

        {/* The "Manager ID" Card - Clean & Minimalist */}
        <div className="bg-white rounded-3xl p-6 md:p-10 text-black mb-12 shadow-[0_20px_50px_rgba(255,255,255,0.05)] relative overflow-hidden">
          {/* Mobile Layout: Stack everything vertically */}
          <div className="flex flex-col md:hidden gap-6 items-center mb-8">
            {/* Identity Photo Area */}
            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center border border-black/5 shadow-inner overflow-hidden relative">
              {persona.imageUrl && !imageError ? (
                <Image
                  src={persona.imageUrl}
                  alt={persona.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="96px"
                  priority
                />
              ) : (
                <span className="text-4xl">{persona.emoji || '👔'}</span>
              )}
            </div>

            <div className="w-full text-center">
              <p className="text-[10px] font-bold text-black/30 tracking-[0.15em] uppercase mb-2">@{summary.teamName}</p>
              <h3 className="text-2xl font-black tracking-tighter mb-2 break-words px-4">{persona.name.toUpperCase()}</h3>
              <p className="text-xs font-bold text-black/50 tracking-wide uppercase mb-3">{persona.title}</p>
              
              {/* Trait Badges */}
              <div className="flex flex-wrap gap-1.5 justify-center px-4 mb-4">
                {persona.traits.slice(0, 3).map((trait, i) => (
                  <div key={i} className="px-2 py-0.5 bg-black/5 text-black/60 rounded-md text-[8px] font-semibold tracking-wide uppercase whitespace-nowrap border border-black/10">
                    {trait}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Rank & Total Points - Mobile */}
            <div className="w-full text-center px-4">
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Final Rank</p>
              <p className="text-2xl font-black tracking-tighter italic mb-4 text-black/90">#{summary.overallRank.toLocaleString()}</p>
              
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
              <p className="text-3xl font-black tracking-tighter text-black/90">{summary.totalPoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Desktop Layout: Horizontal with absolute positioning */}
          <div className="hidden md:flex flex-row gap-10 items-center mb-8">
            {/* Identity Photo Area */}
            <div className="w-32 h-32 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center border border-black/5 shadow-inner overflow-hidden relative">
              {persona.imageUrl && !imageError ? (
                <Image
                  src={persona.imageUrl}
                  alt={persona.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="128px"
                  priority
                />
              ) : (
                <span className="text-5xl">{persona.emoji || '👔'}</span>
              )}
            </div>

            <div className="flex-1 text-left min-w-0 pr-32">
              <p className="text-[10px] font-bold text-black/30 tracking-[0.15em] uppercase mb-2">@{summary.teamName}</p>
              <h3 className="text-3xl font-black tracking-tighter mb-2 break-words">{persona.name.toUpperCase()}</h3>
              <p className="text-sm font-bold text-black/50 tracking-wide uppercase mb-3">{persona.title}</p>
              
              {/* Trait Badges */}
              <div className="flex flex-wrap gap-1.5">
                {persona.traits.slice(0, 3).map((trait, i) => (
                  <div key={i} className="px-2 py-0.5 bg-black/5 text-black/60 rounded-md text-[8px] font-semibold tracking-wide uppercase whitespace-nowrap border border-black/10">
                    {trait}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Rank & Total Points - Desktop absolute position */}
            <div className="absolute top-10 right-10 text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Final Rank</p>
              <p className="text-3xl font-black tracking-tighter italic mb-4 text-black/90">#{summary.overallRank.toLocaleString()}</p>
              
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
              <p className="text-4xl font-black tracking-tighter text-black/90">{summary.totalPoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Season Performance Breakdown */}
          <div className="border-t border-black/5 pt-6">
            <p className="text-[9px] font-bold text-black/30 tracking-[0.15em] uppercase mb-4 text-center">Season {currentSeason} Performance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Transfer Impact */}
              <div className="bg-black/[0.02] rounded-xl p-5 border border-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔄</span>
                  <p className="text-[11px] font-bold text-black/40 uppercase tracking-wide">Transfer Impact</p>
                </div>
                <p className={`text-3xl font-black ${
                  summary.netTransferPoints >= 50 ? 'text-[#059669]' :
                  summary.netTransferPoints >= 0 ? 'text-black/90' :
                  summary.netTransferPoints <= -20 ? 'text-[#e90052]' :
                  'text-black/90'
                }`}>
                  {summary.netTransferPoints >= 0 ? '+' : ''}{summary.netTransferPoints} pts
                </p>
              </div>

              {/* Captaincy */}
              <div className="bg-black/[0.02] rounded-xl p-5 border border-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚡</span>
                  <p className="text-[11px] font-bold text-black/40 uppercase tracking-wide">Captaincy Success</p>
                </div>
                <p className={`text-3xl font-black ${
                  summary.captaincySuccessRate >= 80 ? 'text-[#059669]' :
                  summary.captaincySuccessRate <= 30 ? 'text-[#e90052]' :
                  'text-black/90'
                }`}>
                  {summary.captaincySuccessRate.toFixed(0)}%
                </p>
              </div>

              {/* Bench Management */}
              <div className="bg-black/[0.02] rounded-xl p-5 border border-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">😱</span>
                  <p className="text-[11px] font-bold text-black/40 uppercase tracking-wide">Bench Regrets</p>
                </div>
                <p className={`text-3xl font-black ${
                  summary.benchRegrets <= 2 ? 'text-[#059669]' :
                  summary.benchRegrets >= 15 ? 'text-[#e90052]' :
                  'text-black/90'
                }`}>
                  {summary.benchRegrets}
                </p>
              </div>

              {/* Template Strategy */}
              <div className="bg-black/[0.02] rounded-xl p-5 border border-black/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">
                    {summary.templateOverlap >= 30 ? '🐑' : 
                     summary.templateOverlap >= 20 ? '⚖️' : '🦄'}
                  </span>
                  <p className="text-[11px] font-bold text-black/40 uppercase tracking-wide">Template Overlap</p>
                  <InfoTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-semibold text-white">How is this calculated?</p>
                        <div className="space-y-1 text-white/80">
                          <p><strong>Template Player</strong> = Any player with ≥15% ownership</p>
                          <p className="text-xs text-white/60 italic">e.g., Salah, Haaland, premium defenders</p>
                        </div>
                        <div className="pt-2 border-t border-white/20">
                          <p className="text-white/90 font-mono text-xs">
                            Template Overlap % = <br/>
                            (Template players in your squad / Total squad slots) × 100
                          </p>
                        </div>
                        <div className="pt-2 space-y-1 text-xs">
                          <p className="text-white/70">📊 Measured across all finished gameweeks</p>
                          <p className="text-white/70">• <strong>30%+</strong>: Template-heavy (following the crowd)</p>
                          <p className="text-white/70">• <strong>20-30%</strong>: Balanced approach</p>
                          <p className="text-white/70">• <strong>&lt;20%</strong>: Differential picks (unique strategy)</p>
                        </div>
                      </div>
                    }
                  />
                </div>
                <p className="text-3xl font-black text-black/90">
                  {summary.templateOverlap.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="text-center space-y-8">
          <div className="inline-block p-1 rounded-full bg-white/5 backdrop-blur-md px-6 py-2 border border-white/10">
            <p className="text-xs text-white/60 font-medium">
              Screenshot & share your Manager ID 📸
            </p>
          </div>

          <div>
            <Link
              href="/"
              className="px-8 py-3 bg-[#00ff87] text-black font-bold rounded-full text-sm hover:scale-105 transition-transform inline-block"
            >
              Analyze Another Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



