'use client';

import { SeasonSummary } from '@/lib/types';
import { GradeDisplay } from '@/components/ui/GradeDisplay';

interface SummaryCardProps {
  summary: SeasonSummary;
}

const gradeMessages = {
  A: {
    title: "FPL Mastermind!",
    message: "Your decision-making was elite this season. You made smart transfers, picked the right captains, and selected your team wisely. The FPL gods smile upon you.",
    emoji: "🏆"
  },
  B: {
    title: "Solid Manager!",
    message: "Good season! Your decisions were mostly on point. A few tweaks here and there and you'd be in the elite tier.",
    emoji: "👏"
  },
  C: {
    title: "Average Joe",
    message: "A decent season with room for improvement. Your decisions were neither great nor terrible - right in the middle of the pack.",
    emoji: "😐"
  },
  D: {
    title: "Needs Work",
    message: "Some questionable decisions this season. But hey, FPL is hard! Learn from the data and come back stronger.",
    emoji: "📚"
  },
  F: {
    title: "Chaos Manager",
    message: "Your decisions were... interesting. But that's okay! FPL is about having fun, and you certainly kept things exciting.",
    emoji: "🎲"
  }
};

export function SummaryCard({ summary }: SummaryCardProps) {
  const gradeInfo = gradeMessages[summary.overallDecisionGrade];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-lg w-full">
        <p className="text-white/50 text-sm mb-4 tracking-widest uppercase animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          Final Verdict
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mb-2 animate-slide-in opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          Your Overall Decision Grade
        </h2>

        <div className="mb-8 animate-scale-in opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <GradeDisplay grade={summary.overallDecisionGrade} size="xl" showLabel={false} />
        </div>

        {/* Message */}
        <div className="glass-card p-6 mb-8 animate-slide-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
          <div className="text-5xl mb-4">{gradeInfo.emoji}</div>
          <h3 className="text-2xl font-bold text-white mb-3">{gradeInfo.title}</h3>
          <p className="text-white/60">{gradeInfo.message}</p>
        </div>

        {/* Grade Breakdown */}
        <div className="space-y-3 mb-8">
          <div className="glass-card p-4 flex items-center justify-between animate-slide-in opacity-0 delay-600" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🔄</span>
              <span className="text-white/70">Transfers</span>
            </div>
            <span className={`text-2xl font-bold grade-${summary.transferGrade.toLowerCase()}`}>
              {summary.transferGrade}
            </span>
          </div>

          <div className="glass-card p-4 flex items-center justify-between animate-slide-in opacity-0 delay-700" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">©️</span>
              <span className="text-white/70">Captaincy</span>
            </div>
            <span className={`text-2xl font-bold grade-${summary.captaincyGrade.toLowerCase()}`}>
              {summary.captaincyGrade}
            </span>
          </div>

          <div className="glass-card p-4 flex items-center justify-between animate-slide-in opacity-0 delay-800" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🪑</span>
              <span className="text-white/70">Team Selection</span>
            </div>
            <span className={`text-2xl font-bold grade-${summary.benchGrade.toLowerCase()}`}>
              {summary.benchGrade}
            </span>
          </div>
        </div>

        {/* Season Summary Stats */}
        <div className="glass-card p-6 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '900ms' }}>
          <h4 className="text-white/50 text-sm mb-4">Season Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-white/50 text-xs">Total Points</p>
              <p className="text-xl font-bold text-[#00ff87]">{summary.totalPoints}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Overall Rank</p>
              <p className="text-xl font-bold text-white">#{summary.overallRank.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Transfers Made</p>
              <p className="text-xl font-bold text-white">{summary.totalTransfers}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Chips Used</p>
              <p className="text-xl font-bold text-white">{summary.chipsUsed.length}</p>
            </div>
          </div>
        </div>

        {/* Share prompt */}
        <div className="mt-8 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '1000ms' }}>
          <p className="text-white/40 text-sm mb-4">
            Screenshot and share your FPL Wrapped! 📸
          </p>
          <a
            href="/"
            className="inline-block text-[#00ff87] hover:underline"
          >
            ← Check another team
          </a>
        </div>
      </div>
    </div>
  );
}



