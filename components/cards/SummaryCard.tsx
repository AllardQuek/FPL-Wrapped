'use client';

import { SeasonSummary } from '@/lib/types';
import { getCurrentFPLSeason } from '@/lib/season';
import { PerformanceMetric } from './summary/PerformanceMetric';
import { ProfileHeader } from './summary/ProfileHeader';
import { TraitBadges } from './summary/TraitBadges';
import { StatsRow } from './summary/StatsRow';
import { PersonaMoments } from './persona/PersonaMoments';
import { SeasonVerdict } from './summary/SeasonVerdict';

interface SummaryCardProps {
  summary: SeasonSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const { persona } = summary;
  const currentSeason = getCurrentFPLSeason();
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;

  const metrics = [
    {
      emoji: '🔄',
      label: 'Transfers Made',
      value: `${netImpact >= 0 ? '+' : ''}${netImpact} pts`,
      opacityLevel: '25'
    },
    {
      emoji: '⚡',
      label: 'Captain Success',
      value: `${summary.captaincySuccessRate.toFixed(0)}%`,
      opacityLevel: '35'
    },
    {
      emoji: '😱',
      label: 'Bench Regrets',
      value: summary.benchRegrets,
      opacityLevel: '40'
    },
    {
      emoji: summary.templateOverlap >= 50 ? '🐑' : summary.templateOverlap >= 25 ? '⚖️' : '🦄',
      label: 'Template Overlap',
      value: `${summary.templateOverlap.toFixed(0)}%`,
      opacityLevel: '45'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)] pointer-events-none" />
      <div className="relative max-w-5xl w-full mx-auto">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-8 text-center">Final Report: The Season Summary</p>
        <div 
          className="bg-white rounded-3xl p-6 md:p-8 text-black shadow-[0_20px_50px_rgba(255,255,255,0.05)] border-2 overflow-hidden"
          style={{ borderColor: `${persona.primaryColor}30` }}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-black/50">{currentSeason} Season</p>
            <p className="text-[11px] font-semibold text-black/40">Personality Report</p>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-12">
            <div className="space-y-6">
              <ProfileHeader
                imageUrl={persona.imageUrl}
                emoji={persona.emoji}
                name={persona.name}
                teamName={summary.teamName}
                managerId={summary.managerId}
                title={persona.title}
                primaryColor={persona.primaryColor}
              />

              <StatsRow
                overallRank={summary.overallRank}
                totalPoints={summary.totalPoints}
                grade={summary.overallDecisionGrade}
                primaryColor={persona.primaryColor}
              />

              <div className="space-y-3">
                <p className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: `${persona.primaryColor}80` }}>
                  Key Highlights
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((metric, index) => (
                    <PerformanceMetric
                      key={index}
                      emoji={metric.emoji}
                      label={metric.label}
                      value={metric.value}
                      primaryColor={persona.primaryColor}
                      opacityLevel={metric.opacityLevel}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8 border-l pl-10" style={{ borderColor: `${persona.primaryColor}25` }}>
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Personality Profile</p>
                  <div 
                    className="inline-block px-6 py-3 rounded-xl font-black text-3xl tracking-wider"
                    style={{ 
                      backgroundColor: `${persona.primaryColor}15`,
                      color: persona.primaryColor,
                      border: `2px solid ${persona.primaryColor}30`,
                    }}
                  >
                    {persona.personalityCode}
                  </div>
                </div>
                <TraitBadges traits={persona.traits} primaryColor={persona.primaryColor} centered />
              </div>

              <PersonaMoments 
                moments={persona.memorableMoments || []} 
                primaryColor={persona.primaryColor} 
              />
            </div>
          </div>

          <div className="mt-8 pt-8 border-t" style={{ borderColor: `${persona.primaryColor}20` }}>
            <SeasonVerdict 
              totalTransfers={summary.totalTransfers}
              totalTransfersCost={summary.totalTransfersCost}
              netImpact={netImpact}
              personaName={persona.name}
              managerId={summary.managerId}
              templateOverlap={summary.templateOverlap}
              benchRegrets={summary.benchRegrets}
              captaincySuccessRate={summary.captaincySuccessRate}
              chipsPlayed={summary.chipAnalyses.length}
            />
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-8">
            <ProfileHeader
              imageUrl={persona.imageUrl}
              emoji={persona.emoji}
              name={persona.name}
              teamName={summary.teamName}
              managerId={summary.managerId}
              title={persona.title}
              primaryColor={persona.primaryColor}
              isMobile
            />

            <StatsRow
              overallRank={summary.overallRank}
              totalPoints={summary.totalPoints}
              grade={summary.overallDecisionGrade}
              primaryColor={persona.primaryColor}
              isMobile
            />

            <div className="space-y-3">
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-center" style={{ color: `${persona.primaryColor}80` }}>
                Key Highlights
              </p>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric, index) => (
                  <PerformanceMetric
                    key={index}
                    emoji={metric.emoji}
                    label={metric.label}
                    value={metric.value}
                    primaryColor={persona.primaryColor}
                    opacityLevel={metric.opacityLevel}
                    isMobile
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6 border-t pt-6" style={{ borderColor: `${persona.primaryColor}20` }}>
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">Personality Profile</p>
                  <div 
                    className="inline-block px-6 py-3 rounded-xl font-black text-2xl tracking-wider"
                    style={{ 
                      backgroundColor: `${persona.primaryColor}15`,
                      color: persona.primaryColor,
                      border: `2px solid ${persona.primaryColor}30`,
                    }}
                  >
                    {persona.personalityCode}
                  </div>
                </div>
                <TraitBadges traits={persona.traits} primaryColor={persona.primaryColor} centered />
              </div>

              <PersonaMoments 
                moments={persona.memorableMoments || []} 
                primaryColor={persona.primaryColor} 
              />
            </div>

            <div className="pt-6 border-t" style={{ borderColor: `${persona.primaryColor}20` }}>
              <SeasonVerdict 
                totalTransfers={summary.totalTransfers}
                totalTransfersCost={summary.totalTransfersCost}
                netImpact={netImpact}
                personaName={persona.name}
                managerId={summary.managerId}
                templateOverlap={summary.templateOverlap}
                benchRegrets={summary.benchRegrets}
                captaincySuccessRate={summary.captaincySuccessRate}
                chipsPlayed={summary.chipAnalyses.length}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


