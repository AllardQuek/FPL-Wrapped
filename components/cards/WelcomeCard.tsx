'use client';

import { SeasonSummary } from '@/lib/types';

interface WelcomeCardProps {
  summary: SeasonSummary;
}

export function WelcomeCard({ summary }: WelcomeCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <p className="text-[#00ff87] text-lg mb-4 tracking-widest uppercase">
          2024/25 Season
        </p>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black mb-6 animate-slide-in opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
        Hey, {summary.managerName.split(' ')[0]}!
      </h1>
      
      <div className="animate-slide-in opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
        <p className="text-xl text-white/70 mb-2">
          Let&apos;s look at how your
        </p>
        <p className="text-2xl md:text-3xl font-bold text-white mb-8">
          {summary.teamName}
        </p>
      </div>
      
      <div className="animate-scale-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
        <p className="text-white/50 text-lg">
          performed this season
        </p>
      </div>

      <div className="mt-16 animate-fade-in opacity-0 delay-800" style={{ animationFillMode: 'forwards' }}>
        <div className="text-white/30 animate-bounce">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <p className="text-sm mt-2">Scroll to continue</p>
        </div>
      </div>
    </div>
  );
}



