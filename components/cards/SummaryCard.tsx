'use client';

import { SeasonSummary } from '@/lib/types';
import { getCurrentFPLSeason } from '@/lib/season';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

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
              <p className="text-xl font-black tracking-tighter italic mb-3">#{summary.overallRank.toLocaleString()}</p>
              
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
              <p className="text-xl font-black tracking-tighter text-green-600">{summary.totalPoints.toLocaleString()}</p>
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
              <p className="text-2xl font-black tracking-tighter italic mb-3">#{summary.overallRank.toLocaleString()}</p>
              
              <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
              <p className="text-2xl font-black tracking-tighter text-green-600">{summary.totalPoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Season Performance Breakdown */}
          <div className="border-t border-black/5 pt-6">
            <p className="text-[9px] font-bold text-black/30 tracking-[0.15em] uppercase mb-4 text-center">Season {currentSeason} Performance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Transfer Impact */}
              <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Transfer Impact</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                    summary.transferGrade === 'A' ? 'bg-green-500/20 text-green-700' :
                    summary.transferGrade === 'B' ? 'bg-blue-500/20 text-blue-700' :
                    summary.transferGrade === 'C' ? 'bg-yellow-500/20 text-yellow-700' :
                    summary.transferGrade === 'D' ? 'bg-orange-500/20 text-orange-700' :
                    'bg-red-500/20 text-red-700'
                  }`}>
                    {summary.transferGrade}
                  </span>
                </div>
                <p className={`text-xl font-black mb-2 ${
                  summary.netTransferPoints >= 20 ? 'text-green-600' :
                  summary.netTransferPoints >= 0 ? 'text-green-600/70' :
                  'text-red-600'
                }`}>
                  {summary.netTransferPoints >= 0 ? '+' : ''}{summary.netTransferPoints} pts
                </p>
                <p className="text-[10px] text-black/60 font-medium">
                  {summary.totalTransfers} transfers • {(summary.totalTransfersCost / 4).toFixed(0)} hits taken
                </p>
              </div>

              {/* Captaincy */}
              <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Captaincy</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                    summary.captaincyGrade === 'A' ? 'bg-green-500/20 text-green-700' :
                    summary.captaincyGrade === 'B' ? 'bg-blue-500/20 text-blue-700' :
                    summary.captaincyGrade === 'C' ? 'bg-yellow-500/20 text-yellow-700' :
                    summary.captaincyGrade === 'D' ? 'bg-orange-500/20 text-orange-700' :
                    'bg-red-500/20 text-red-700'
                  }`}>
                    {summary.captaincyGrade}
                  </span>
                </div>
                <p className={`text-xl font-black mb-2 ${
                  summary.captaincySuccessRate >= 70 ? 'text-green-600' :
                  summary.captaincySuccessRate >= 50 ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {summary.captaincySuccessRate.toFixed(0)}% success rate
                </p>
                <p className="text-[10px] text-black/60 font-medium">
                  {summary.totalCaptaincyPoints} pts earned • {summary.captaincyPointsLost} pts missed
                </p>
              </div>

              {/* Bench Management */}
              <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😱</span>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Bench Management</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                    summary.benchGrade === 'A' ? 'bg-green-500/20 text-green-700' :
                    summary.benchGrade === 'B' ? 'bg-blue-500/20 text-blue-700' :
                    summary.benchGrade === 'C' ? 'bg-yellow-500/20 text-yellow-700' :
                    summary.benchGrade === 'D' ? 'bg-orange-500/20 text-orange-700' :
                    'bg-red-500/20 text-red-700'
                  }`}>
                    {summary.benchGrade}
                  </span>
                </div>
                <p className={`text-xl font-black mb-2 ${
                  summary.benchRegrets <= 3 ? 'text-green-600' :
                  summary.benchRegrets <= 6 ? 'text-blue-600' :
                  summary.benchRegrets <= 10 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {summary.benchRegrets} bench regrets
                </p>
                <p className="text-[10px] text-black/60 font-medium">
                  {summary.totalBenchPoints.toFixed(0)} pts left on bench
                </p>
              </div>

              {/* Template Strategy */}
              <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {summary.templateOverlap >= 30 ? '🐑' : 
                       summary.templateOverlap >= 20 ? '⚖️' : '🦄'}
                    </span>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Template Strategy</p>
                  </div>
                </div>
                <p className="text-xl font-black text-black/80 mb-2">
                  {summary.templateOverlap.toFixed(0)}% template overlap
                </p>
                <p className="text-[10px] text-black/60 font-medium">
                  {summary.templateOverlap >= 30 ? 'Template-heavy squad approach' : 
                   summary.templateOverlap >= 20 ? 'Balanced squad strategy' : 'Differential king approach'}
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



