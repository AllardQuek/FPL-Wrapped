'use client';

import React from 'react';
import { SeasonSummary } from '@/lib/types';

interface WhatIfSimulatorProps {
  summary: SeasonSummary;
  p1Search: string;
  p2Search: string;
  selectedP1: number | null;
  selectedP2: number | null;
  startGW: number;
  endGW: number;
  isSimLoading: boolean;
  setP1Search: (val: string) => void;
  setP2Search: (val: string) => void;
  setSelectedP1: (val: number | null) => void;
  setSelectedP2: (val: number | null) => void;
  setStartGW: (val: number) => void;
  setEndGW: (val: number) => void;
  onSimulate: () => void;
}

export function WhatIfSimulator({
  summary,
  p1Search,
  p2Search,
  selectedP1,
  selectedP2,
  startGW,
  endGW,
  isSimLoading,
  setP1Search,
  setP2Search,
  setSelectedP1,
  setSelectedP2,
  setStartGW,
  setEndGW,
  onSimulate
}: WhatIfSimulatorProps) {
  const filteredPlayers1 = p1Search.length > 1
    ? summary.allPlayers.filter(p => p.web_name.toLowerCase().includes(p1Search.toLowerCase())).slice(0, 5)
    : [];

  const filteredPlayers2 = p2Search.length > 1
    ? summary.allPlayers.filter(p => p.web_name.toLowerCase().includes(p2Search.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10"></div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">What-If Simulator</p>
        <div className="h-px flex-1 bg-white/10"></div>
      </div>
      
      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
          onClick={onSimulate}
          disabled={!selectedP1 || !selectedP2 || isSimLoading}
          className="bg-[#00ff87] disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-tighter text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(0,255,135,0.2)] transition-all active:scale-95"
        >
          {isSimLoading ? 'Analyzing...' : 'Simulate Matchup'}
        </button>
      </div>
    </div>
  );
}
