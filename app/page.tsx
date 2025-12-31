'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentFPLSeason } from '@/lib/season';

export default function Home() {
  const [teamId, setTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const mounted = typeof window !== 'undefined';
  const router = useRouter();
  const currentSeason = getCurrentFPLSeason();
  
  // Lazy initialize particles on client side only
  const [particles] = useState<Array<{ left: number; delay: number; duration: number }>>(() => {
    if (typeof window === 'undefined') return []; // Return empty array on server
    return Array.from({ length: 25 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
    }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = teamId.trim();
    if (!id) {
      setError('Please enter your Team ID');
      return;
    }
    if (!/^\d+$/.test(id)) {
      setError('Team ID must be a number');
      return;
    }
    setIsLoading(true);
    router.push(`/wrapped/${id}`);
  };

  const featuredPersonas = [
    { name: "Sir Alex", title: "GOAT", emoji: "👑" },
    { name: "Pep", title: "Overthinker", emoji: "🧠" },
    { name: "Bielsa", title: "Extremist", emoji: "🔥" },
    { name: "Dyche", title: "Survivalist", emoji: "🛡️" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-x-hidden py-10 md:py-16">
      {/* Background particles */}
      <div className="particles">
        {mounted && particles.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center">
        {/* Compact Hero */}
        <div className="text-center mb-8 md:mb-10 animate-slide-in">
          <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[#00ff87] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
            Season {currentSeason} • Wrapped
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-3 leading-[0.9]">
            <span className="text-white">FPL</span>
            <span className="glow-text text-[#00ff87]"> WRAPPED</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/50 font-medium tracking-tight">
            Discover your <span className="text-[#00ff87] italic">FPL Persona</span>
          </p>
        </div>

        {/* Input Form - Optimized for space and layout stability */}
        <div className="w-full max-w-lg mb-10 md:mb-12 animate-slide-in delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff87] to-[#018146] rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
            <form onSubmit={handleSubmit} className="relative glass-card p-2 flex flex-col sm:flex-row gap-2 rounded-2xl">
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Enter Team ID"
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-6 py-4 text-base font-bold min-w-0"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#00ff87] hover:bg-[#00e67a] text-[#0d0015] font-black px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 shadow-lg text-sm md:text-base sm:w-auto"
              >
                {isLoading ? (
                  <div className="spinner w-5 h-5 border-2 border-black/30 border-t-black" />
                ) : (
                  <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C12 2 12.5 8.5 14.5 10.5C16.5 12.5 22 13 22 13C22 13 16.5 13.5 14.5 15.5C12.5 17.5 12 24 12 24C12 24 11.5 17.5 9.5 15.5C7.5 13.5 2 13 2 13C2 13 7.5 12.5 9.5 10.5C11.5 8.5 12 2 12 2Z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className="flex justify-between items-center mt-3 px-2">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Find ID in Team URL</p>
            {error && <p className="text-xs text-[#e90052] font-black uppercase italic animate-pulse">{error}</p>}
          </div>
        </div>

        {/* Persona Quick Row - Improved Readability */}
        <div className="w-full mb-12 md:mb-16 animate-slide-in delay-400 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {featuredPersonas.map((p, i) => (
              <div key={i} className="glass-card px-4 py-3 border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5 group flex items-center gap-3 rounded-2xl">
                <div className="text-2xl">{p.emoji}</div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-[#00ff87] uppercase leading-none mb-1">{p.title}</p>
                  <h3 className="text-xs md:text-sm font-black text-white uppercase">{p.name}</h3>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mt-8 md:mt-10">
            Matching against 16 legendary archetypes
          </p>
        </div>

        {/* Value Props - Improved Readability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-4xl px-4 animate-slide-in delay-600 opacity-0 mb-12 md:mb-16" style={{ animationFillMode: 'forwards' }}>
          {[
            { title: "Ghost Points", desc: "We track exactly how many points you left on the bench over the season." },
            { title: "Tactical Path", desc: "Your season timeline turned into a beautiful, shareable tactical roadmap." },
            { title: "Identity Match", desc: "Advanced data-driven matching against iconic manager manager archetypes." }
          ].map((feat, i) => (
            <div key={i} className="text-center md:text-left flex flex-col md:block items-center">
              <h4 className="text-white text-xs font-black uppercase tracking-widest mb-2 italic">{feat.title}</h4>
              <p className="text-sm text-white/60 leading-relaxed max-w-[240px] md:max-w-none">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-[9px] tracking-[0.3em] uppercase font-bold border-t border-white/10 pt-10 w-full max-w-md">
          <p className="mb-2">Official FPL API Connection</p>
          <p className="mb-6 text-[#00ff87] normal-case tracking-normal text-sm font-medium">Made with ⚽</p>
          {/* <div className="flex justify-center gap-8 opacity-70">
            <span>Season {currentSeason}</span>
            <span>Community Project</span>
          </div> */}
        </footer>
      </div>
    </main>
  );
}
