'use client';

import { SeasonSummary } from '@/lib/types';
import { getCurrentFPLSeason } from '@/lib/season';
import { ProfileHeader } from './summary/ProfileHeader';
import { StatsRow } from './summary/StatsRow';
import { PersonaMoments } from './persona/PersonaMoments';
import { SeasonVerdict } from './summary/SeasonVerdict';
import { SharedImageFooter } from '../ui/wrapped/SharedImageFooter';
import { getSectionById } from '@/lib/constants/wrapped-sections';

interface SummaryCardProps {
  summary: SeasonSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const { persona } = summary;
  const currentSeason = getCurrentFPLSeason();
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;
  const section = getSectionById('summary');

  return (
    <div className="min-h-screen flex flex-col items-center p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)] pointer-events-none" />
      <div className="flex-1 flex flex-col justify-center relative max-w-6xl w-full mx-auto">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-8 text-center">{section?.number ? `Section ${section.number}` : 'Final Report: The Season Summary'}</p>
        <div 
          className="bg-white rounded-3xl p-6 md:p-8 text-black shadow-[0_20px_50px_rgba(255,255,255,0.05)] border-2 overflow-hidden"
          style={{ borderColor: `${persona.primaryColor}30` }}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-black/50">{currentSeason} Season</p>
            <div className="flex items-center gap-2">
              <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
                style={{ 
                  backgroundColor: `${persona.primaryColor}15`,
                  color: persona.primaryColor,
                  border: `1px solid ${persona.primaryColor}30`,
                }}
              >
                {persona.personalityCode}
              </span>
              <p className="text-[11px] font-semibold text-black/40">Personality Report</p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-12">
            <div className="space-y-4">
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
              </div>

              <div className="pt-3 border-t border-black/5">
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

            <div className="flex flex-col justify-center">
              <PersonaMoments 
                moments={persona.memorableMoments || []} 
                primaryColor={persona.primaryColor} 
              />
            </div>
          </div>

          <div className="md:hidden space-y-6">
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

            <div className="space-y-4 border-t pt-4" style={{ borderColor: `${persona.primaryColor}10` }}>
              <PersonaMoments 
                moments={persona.memorableMoments?.slice(0, 1) || []} 
                primaryColor={persona.primaryColor} 
              />
              <div className="pt-4 border-t border-black/5">
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
      <SharedImageFooter />
    </div>
  );
}


