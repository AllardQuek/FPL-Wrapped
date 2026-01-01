'use client';

import React, { useState } from 'react';
import { SeasonSummary } from '@/lib/types';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface TransferCardProps {
  summary: SeasonSummary;
}

// Define the type for points history entry
interface PointsHistoryEntry {
  gw: number;
  in: number;
  out: number;
}

export function TransferCard({ summary }: TransferCardProps) {
  const netImpact = summary.netTransferPoints - summary.totalTransfersCost;
  const [activeIdx, setActiveIdx] = useState(0);
  const [isWhatIf, setIsWhatIf] = useState(false);
  const [p1Search, setP1Search] = useState('');
  const [p2Search, setP2Search] = useState('');
  const [selectedP1, setSelectedP1] = useState<number | null>(null);
  const [selectedP2, setSelectedP2] = useState<number | null>(null);
  const [startGW, setStartGW] = useState(1);
  const [endGW, setEndGW] = useState(summary.rankProgression.length);
  const [simResult, setSimResult] = useState<SeasonSummary['transferAnalyses'][0] | null>(null);
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [hoveredGwIdx, setHoveredGwIdx] = useState<number | null>(null);

  // Get top 5 transfers
  const topTransfers = summary.transferAnalyses
    .sort((a, b) => b.pointsGained - a.pointsGained)
    .slice(0, 5);

  const activeTransfer = isWhatIf && simResult ? simResult : topTransfers[activeIdx];

  const handleSimulate = async () => {
    if (!selectedP1 || !selectedP2) return;
    setIsSimLoading(true);
    try {
      const resp = await fetch(`/api/compare?p1=${selectedP1}&p2=${selectedP2}&start=${startGW}&end=${endGW}`);
      const data = await resp.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimLoading(false);
    }
  };

  const filteredPlayers1 = p1Search.length > 1
    ? summary.allPlayers.filter(p => p.web_name.toLowerCase().includes(p1Search.toLowerCase())).slice(0, 5)
    : [];

  const filteredPlayers2 = p2Search.length > 1
    ? summary.allPlayers.filter(p => p.web_name.toLowerCase().includes(p2Search.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 text-center">Section 02: Transfer Strategy</p>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8 text-center uppercase italic">Transfers</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-10 text-left">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center">
            <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-1">Volume</p>
            <p className="text-2xl font-black text-white">{summary.totalTransfers}</p>
            <p className="text-[8px] font-bold text-white/20 uppercase">Transfers</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1 justify-center">
              <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase">Net Impact</p>
              <InfoTooltip content="Your total 'Transfer Profit'. This is the cumulative points gained from all players bought vs. those sold, across their entire time in your team, minus transfer costs (hits). Note: Wildcard transfers compare target squad against predicted performance of previous team." />
            </div>
            <p className={`text-2xl font-black ${netImpact >= 0 ? 'text-[#00ff87]' : 'text-[#e90052]'}`}>
              {netImpact > 0 ? '+' : ''}{netImpact}
            </p>
            <p className="text-[8px] font-bold text-white/20 uppercase">Points Added</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1 justify-center">
              <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase">Avg. Impact</p>
              <InfoTooltip content="Total net points gained per transfer compared to the player sold, averaged across all moves. This is the CUMULATIVE profit over the entire time you held the player, not a weekly average." />
            </div>
            <p className="text-2xl font-black text-[#00ff87]">
              {(netImpact / Math.max(1, summary.totalTransfers)).toFixed(1)}
            </p>
            <p className="text-[8px] font-bold text-white/20 uppercase">Pts / Transfer</p>
          </div>
        </div>

        {/* Decision Spotlight viz */}
        {topTransfers.length > 0 && activeTransfer && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* Spotlight Header & Selector */}
            <div className="flex flex-col gap-6 px-2 items-center text-center">
              {/* Title and Player Names */}
              <div className="w-full">
                <p className="text-[10px] font-black text-[#00ff87] uppercase tracking-[0.3em] mb-2">
                  {isWhatIf ? 'Simulator Mode' : 'Decision Spotlight'}
                </p>
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter italic uppercase flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-3">
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <div className="w-1.5 h-6 md:w-2 md:h-8 bg-[#37ffef] rounded-full"></div>
                    <span className="text-[#37ffef]">{activeTransfer.playerIn.web_name}</span>
                  </div>
                  <span className="text-base md:text-lg text-white/30 not-italic md:mx-1">vs</span>
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <div className="w-1.5 h-6 md:w-2 md:h-8 bg-[#ff6b9d] rounded-full"></div>
                    <span className="text-[#ff6b9d]">{activeTransfer.playerOut.web_name}</span>
                  </div>
                </h3>
              </div>

              {/* Controls - Stacked on mobile */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setIsWhatIf(!isWhatIf)}
                  className={`px-4 py-2.5 md:py-1.5 rounded-xl text-xs md:text-[10px] font-black uppercase tracking-tighter transition-all border ${isWhatIf
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-white/5 text-[#00ff87] border-white/10 hover:bg-white/10'
                    }`}
                >
                  {isWhatIf ? 'Close Simulator' : 'What if?'}
                </button>

                {!isWhatIf && (
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
                    {topTransfers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className={`px-3 md:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-[10px] font-black transition-all uppercase tracking-tighter whitespace-nowrap flex-1 md:flex-none ${activeIdx === i
                          ? 'bg-[#00ff87] text-black shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                          : 'text-white/30 hover:text-white'
                          }`}
                      >
                        Move {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* What-If Search UI */}
            {isWhatIf && (
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top-4 duration-500">
                <div className="relative">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2 ml-2">Who you wanted</p>
                  <input
                    type="text"
                    value={p1Search}
                    onChange={(e) => { setP1Search(e.target.value); setSelectedP1(null); }}
                    placeholder="Search player..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff87]/50"
                  />
                  {filteredPlayers1.length > 0 && !selectedP1 && (
                    <div className="absolute top-full left-0 w-full bg-[#1a0a24] border border-white/10 rounded-xl mt-2 z-50 overflow-hidden shadow-2xl">
                      {filteredPlayers1.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedP1(p.id); setP1Search(p.web_name); }}
                          className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                        >
                          {p.web_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2 ml-2">Who you had</p>
                  <input
                    type="text"
                    value={p2Search}
                    onChange={(e) => { setP2Search(e.target.value); setSelectedP2(null); }}
                    placeholder="Search player..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff87]/50"
                  />
                  {filteredPlayers2.length > 0 && !selectedP2 && (
                    <div className="absolute top-full left-0 w-full bg-[#1a0a24] border border-white/10 rounded-xl mt-2 z-50 overflow-hidden shadow-2xl">
                      {filteredPlayers2.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedP2(p.id); setP2Search(p.web_name); }}
                          className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                        >
                          {p.web_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2 ml-2">Window (GW{startGW}-{endGW})</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1" max="38"
                      value={startGW}
                      onChange={(e) => setStartGW(parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white text-center"
                    />
                    <input
                      type="number"
                      min="1" max="38"
                      value={endGW}
                      onChange={(e) => setEndGW(parseInt(e.target.value) || 38)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={!selectedP1 || !selectedP2 || isSimLoading}
                  className="bg-[#00ff87] disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-tighter text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(0,255,135,0.2)] transition-all active:scale-95"
                >
                  {isSimLoading ? 'Analyzing...' : 'Simulate Matchup'}
                </button>
              </div>
            )}

            <div className="bg-white/5 rounded-[48px] p-4 md:p-8 border border-white/10 backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col gap-6">


                <div className="flex flex-col">
                  <div className="flex flex-col gap-2">
                    {/* Chart Title with Metadata */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pl-2 pr-2">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Weekly Points Comparison <span className="text-white/20 font-normal normal-case ml-2">(Points Gained vs Lost)</span>
                      </p>
                      
                      {/* Consolidated GW Range & Window */}
                      <div className="flex items-center gap-2 text-[9px] font-black text-white/60 uppercase tracking-wider">
                        <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">GW {activeTransfer.ownedGWRange.start}</span>
                        <span className="text-white/30">→</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">GW {activeTransfer.ownedGWRange.end}</span>
                        <span className="text-white/30">·</span>
                        <span className="bg-[#37ffef]/10 px-3 py-1 rounded-full border border-[#37ffef]/20 text-[#37ffef]">
                          {activeTransfer.gameweeksHeld}W
                        </span>
                      </div>
                    </div>
                    {/* Chart Layout */}
                    <div className="grid grid-cols-[32px,1fr] gap-2 items-stretch">

                      {/* Graph Arena */}
                      <div className="flex flex-col gap-4">
                        {/* The Grid Arena */}
                        <div className="relative h-[200px] w-full border-b border-white/30">
                          {/* Static Horizontal Grid Lines */}
                          {[15, 10, 5, 0].map((val) => (
                            <div key={val} className="absolute inset-x-0 flex items-center" style={{ bottom: `${(val / 15) * 100}%` }}>
                              <div className="w-full border-t border-white/10 border-dashed"></div>
                              {/* Scale Number - Adjusted to stay clear of the bars */}
                              <span className="absolute -left-8 md:-left-12 w-6 md:w-10 text-right text-[10px] font-black text-white/60 pr-1 md:pr-2 ml-2">
                                {val}
                              </span>
                            </div>
                          ))}

                          {/* The GW-by-GW Trend Bars - Viewport */}
                          <div className="absolute inset-x-0 bottom-0 top-[-100px] overflow-x-auto no-scrollbar pt-32">
                            {/* Flex Content - justify-start fixes the unscrollable week bug */}
                            <div className="h-full flex items-end justify-start gap-2 md:gap-4 px-1 min-w-full">
                              {activeTransfer.breakdown?.pointsHistory.map((entry: PointsHistoryEntry, idx: number) => {
                                const maxVal = 15;
                                const hIn = Math.min(100, (entry.in / maxVal) * 100);
                                const hOut = Math.min(100, (entry.out / maxVal) * 100);

                                return (
                                  <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredGwIdx(idx)}
                                    onMouseLeave={() => setHoveredGwIdx(null)}
                                    className="flex-none flex flex-col items-center group relative min-w-[40px] md:min-w-[70px] max-w-[100px]"
                                  >
                                    {/* Comparison visualization */}
                                    <div className={`w-full relative h-[160px] flex items-end justify-center gap-1.5 px-2 rounded-2xl border-x transition-colors duration-300 ${hoveredGwIdx === idx
                                      ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                                      }`}>
                                      {/* OUT Bar - Baseline (Pink) */}
                                      <div
                                        className="w-3 md:w-6 bg-[#ff6b9d] rounded-t-lg transition-all duration-700 relative group-hover:brightness-125"
                                        style={{ height: `${hOut}%` }}
                                      >
                                        {/* Point label on top - Visible on active */}
                                        <div className={`absolute -top-7 left-1/2 -translate-x-full transition-all duration-300 whitespace-nowrap pr-1 bg-[#ff6b9d] px-2 py-0.5 rounded-md border border-white/20 shadow-xl z-20 ${hoveredGwIdx === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                                          }`}>
                                          <span className="text-[10px] font-black text-white">{entry.out}</span>
                                        </div>
                                      </div>

                                      {/* IN Bar - Hero (Electric Cyan) */}
                                      <div
                                        className={`w-3 md:w-6 bg-[#37ffef] rounded-t-lg shadow-[0_0_20px_rgba(55,255,239,0.2)] transition-all duration-700 relative origin-bottom ${hoveredGwIdx === idx ? 'scale-x-110 brightness-110' : 'group-hover:scale-x-105'
                                          }`}
                                        style={{ height: `${hIn}%` }}
                                      >
                                        {/* Point label on top - Visible on active */}
                                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 transition-all duration-300 whitespace-nowrap bg-[#37ffef] px-2 py-0.5 rounded-md border border-white/20 shadow-xl z-20 ${hoveredGwIdx === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                                          }`}>
                                          <span className="text-[10px] font-black text-[#0b0410]">{entry.in}</span>
                                        </div>

                                        {/* Special indicator for hauls */}
                                        {entry.in >= 10 && (
                                          <div className="absolute inset-x-0 bottom-0 top-0 bg-white/20 animate-pulse rounded-t-lg"></div>
                                        )}
                                      </div>
                                    </div>

                                    {/* GW Tag */}
                                    <div className={`mt-2 pt-2 border-t w-full text-center transition-colors ${hoveredGwIdx === idx ? 'border-[#37ffef] text-[#37ffef]' : 'border-white/20 text-white/60'
                                      }`}>
                                      <p className="text-[11px] font-black uppercase tracking-tighter">GW{entry.gw}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Summary Section */}
                {(() => {
                  const winningWeeks = activeTransfer.breakdown?.pointsHistory.filter((h: PointsHistoryEntry) => h.in > h.out).length || 0;
                  const totalWeeks = activeTransfer.breakdown?.pointsHistory.length || 1;
                  const dominanceRate = Math.round((winningWeeks / totalWeeks) * 100);

                  return (
                    <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 relative z-40">
                      <div className="flex-1 bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col justify-center">
                        <p className="text-[12px] font-black text-[#37ffef] uppercase tracking-widest mb-4">{isWhatIf ? 'Simulator Report' : 'Efficiency Report'}</p>
                        <p className="text-lg text-white/50 leading-relaxed italic">
                          {isWhatIf ? (
                            <>
                              &ldquo;If you had transferred in <span className="text-white font-bold">{activeTransfer.playerIn.web_name}</span> for <span className="text-white font-bold">{activeTransfer.playerOut.web_name}</span>,
                              you would have <span className={`${activeTransfer.pointsGained >= 0 ? 'text-[#37ffef]' : 'text-[#e90052]'} font-black not-italic text-2xl`}>
                                {activeTransfer.pointsGained >= 0 ? `gained ${activeTransfer.pointsGained}` : `lost ${Math.abs(activeTransfer.pointsGained)}`}
                              </span> points.
                              <span className="text-white/80 font-bold not-italic"> This alternative path wins out {dominanceRate}% of the time.</span>&rdquo;
                            </>
                          ) : (
                            <>
                              &ldquo;By transferring in <span className="text-white font-bold">{activeTransfer.playerIn.web_name}</span> for <span className="text-white font-bold">{activeTransfer.playerOut.web_name}</span>,
                              you yielded a <span className="text-[#37ffef] font-black not-italic text-2xl">{activeTransfer.pointsGained} point surplus</span>.
                              <span className="text-white/80 font-bold not-italic"> {activeTransfer.playerIn.web_name} dominated this matchup in {activeTransfer.winRate ?? dominanceRate}% of appearances.</span>&rdquo;
                            </>
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 text-center flex flex-col justify-center min-w-[100px]">
                          <div className="flex items-center gap-1 mb-1 justify-center">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Win Rate</p>
                            <InfoTooltip content="Percentage of gameweeks where your new player outscored the one you sold." />
                          </div>
                          <p className={`text-2xl font-black ${(activeTransfer.winRate ?? dominanceRate) >= 50 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
                            {activeTransfer.winRate ?? dominanceRate}<span className="text-lg ml-0.5">%</span>
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 text-center flex flex-col justify-center min-w-[100px]">
                          <div className="flex items-center gap-1 mb-1 justify-center">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">PPG Diff</p>
                            <InfoTooltip content="Points Per Gameweek differential. How many more points your new player averaged each week vs the one you sold." />
                          </div>
                          <p className={`text-2xl font-black ${(activeTransfer.ppgDifferential ?? (activeTransfer.pointsGained / Math.max(1, activeTransfer.gameweeksHeld))) >= 0 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
                            {(activeTransfer.ppgDifferential ?? (activeTransfer.pointsGained / Math.max(1, activeTransfer.gameweeksHeld))).toFixed(1)}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 text-center flex flex-col justify-center min-w-[100px]">
                          <div className="flex items-center gap-1 mb-1 justify-center">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Net Gain</p>
                            <InfoTooltip content="Total points gained minus any hit cost. The true ROI of this transfer." />
                          </div>
                          <p className={`text-2xl font-black ${(activeTransfer.netGainAfterHit ?? activeTransfer.pointsGained) >= 0 ? 'text-[#37ffef]' : 'text-[#ff6b9d]'}`}>
                            {(activeTransfer.netGainAfterHit ?? activeTransfer.pointsGained) > 0 ? '+' : ''}{activeTransfer.netGainAfterHit ?? activeTransfer.pointsGained}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 text-center flex flex-col justify-center min-w-[100px]">
                          <div className="flex items-center gap-1 mb-1 justify-center">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Best Run</p>
                            <InfoTooltip content="Longest streak of consecutive weeks where your new player outscored the old one." />
                          </div>
                          <p className="text-2xl font-black text-white">
                            {activeTransfer.bestStreak ?? 0}<span className="text-lg ml-0.5 text-white/50">wks</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

        )}
      </div>
    </div >
  );
}
