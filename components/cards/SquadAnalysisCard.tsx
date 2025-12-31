'use client';

import { SeasonSummary } from '@/lib/types';
import { POSITION_EMOJIS, POSITION_COLORS, POSITION_FULL_LABELS } from '@/lib/constants/positions';

interface SquadAnalysisCardProps {
  summary: SeasonSummary;
}

export function SquadAnalysisCard({ summary }: SquadAnalysisCardProps) {
  const topContributors = summary.topContributors || [];
  const positionBreakdown = summary.positionBreakdown || [];
  
  if (topContributors.length === 0) {
    return null;
  }

  const mvp = topContributors[0];
  const others = topContributors.slice(1, 4);

  // Sort positions by points descending
  const sortedPositions = [...positionBreakdown].sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 05: The Engine Room</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-12 text-center uppercase italic">Squad Analysis</h2>

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: Top Contributors by Player */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6">Top Contributors</p>
            
            {/* Main MVP Card */}
            <div className="bg-white rounded-[2.5rem] p-6 text-black mb-4 shadow-2xl relative overflow-hidden text-left">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-black/30 tracking-[0.2em] uppercase mb-1">Player of the Season</p>
                  <h3 className="text-3xl font-black tracking-tighter mb-0">{mvp.player.web_name.toUpperCase()}</h3>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-black mt-2">
                    <span className="text-[10px] font-black text-[#00ff87] uppercase tracking-wider">
                      {mvp.points} PTS ({mvp.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black italic opacity-20">#1</div>
                </div>
              </div>

              <div className="mt-4 w-full h-1 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full"
                  style={{ width: `${mvp.percentage}%` }}
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none">
                <span className="text-[8rem] font-black rotate-12 leading-none uppercase">{mvp.player.web_name}</span>
              </div>
            </div>

            {/* Supporting Cast */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-2">The Supporting Cast</p>
              <div className="grid grid-cols-1 gap-2">
                {others.map((contributor, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-black text-white/20 italic w-4 text-center">
                        #{i + 2}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white uppercase tracking-tight">
                          {contributor.player.web_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-12 h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white/40 rounded-full"
                              style={{ width: `${contributor.percentage * 2}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-white/40">{contributor.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-white italic">{contributor.points}</p>
                      <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic mt-6">
              Top 4 players secured <span className="text-white font-bold">{topContributors.slice(0, 4).reduce((sum, c) => sum + c.percentage, 0)}%</span> of total points.
            </p>
          </div>

          {/* RIGHT: Position Breakdown */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6">By Position</p>
            
            {/* Main Position Card - Top Contributing Position */}
            <div 
              className="bg-white rounded-[2.5rem] p-6 text-black mb-4 shadow-2xl relative overflow-hidden text-left"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-black/30 tracking-[0.2em] uppercase mb-1">Top Position</p>
                  <h3 className="text-3xl font-black tracking-tighter mb-0">
                    {sortedPositions[0]?.position === 'GKP' ? 'GKP' : 
                     sortedPositions[0]?.position === 'DEF' ? 'DEF' : 
                     sortedPositions[0]?.position === 'MID' ? 'MID' : 'FWD'}
                  </h3>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-black mt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: POSITION_COLORS[sortedPositions[0]?.position] }}>
                      {sortedPositions[0]?.points} PTS ({sortedPositions[0]?.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="text-5xl">
                  {POSITION_EMOJIS[sortedPositions[0]?.position]}
                </div>
              </div>

              <div className="mt-4 w-full h-1 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ 
                    width: `${sortedPositions[0]?.percentage}%`,
                    backgroundColor: POSITION_COLORS[sortedPositions[0]?.position]
                  }}
                />
              </div>
            </div>

            {/* Other Positions - Matching Supporting Cast Style */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-2">Other Positions</p>
              <div className="grid grid-cols-1 gap-2">
                {sortedPositions.slice(1).map((pos) => (
                  <div key={pos.position} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="text-2xl w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${POSITION_COLORS[pos.position]}20` }}
                      >
                        {POSITION_EMOJIS[pos.position]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white uppercase tracking-tight">
                          {POSITION_FULL_LABELS[pos.position]}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-12 h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ 
                                width: `${pos.percentage * 2}%`,
                                backgroundColor: POSITION_COLORS[pos.position]
                              }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-white/40">{pos.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-white italic">{pos.points}</p>
                      <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-white/40 font-medium leading-relaxed italic mt-6">
              {sortedPositions[0]?.position} dominated with <span className="text-white font-bold">{sortedPositions[0]?.percentage}%</span> of your squad&apos;s output.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
