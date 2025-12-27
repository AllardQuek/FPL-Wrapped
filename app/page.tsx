'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [teamId, setTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    
    // Navigate to the wrapped page
    router.push(`/wrapped/${id}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo/Title */}
        <div className="mb-12 animate-slide-in">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">
            <span className="text-white">FPL</span>
            <br />
            <span className="glow-text text-[#00ff87]">WRAPPED</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-light">
            Your 2024/25 Season in Review
          </p>
        </div>

        {/* Description */}
        <div className="mb-10 animate-slide-in delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <p className="text-lg text-white/60 max-w-md mx-auto">
            Discover how your transfers, captaincy picks, and team selections 
            shaped your FPL season.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in delay-400 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="glass-card p-8">
            <label htmlFor="teamId" className="block text-left text-sm text-white/60 mb-2">
              Enter your FPL Team ID
            </label>
            <input
              type="text"
              id="teamId"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. 123456"
              className="fpl-input"
              disabled={isLoading}
            />
            <p className="text-xs text-white/40 mt-3 text-left">
              Find your Team ID in the URL when viewing your team on the FPL website:
              <br />
              <code className="text-[#00ff87]/70">fantasy.premierleague.com/entry/<strong>123456</strong>/event/1</code>
            </p>
          </div>

          {error && (
            <p className="text-[#e90052] text-sm animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="fpl-button w-full flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="spinner w-5 h-5 border-2 border-[#37003c]/30 border-t-[#37003c]" />
                Loading your season...
              </>
            ) : (
              <>
                Get Your Wrapped
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Features preview */}
        <div className="mt-16 grid grid-cols-3 gap-4 animate-slide-in delay-600 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm text-white/60">Transfer Analysis</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl mb-2">©️</div>
            <p className="text-sm text-white/60">Captaincy Review</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-white/60">Decision Grades</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-white/30 text-sm animate-fade-in delay-800 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <p>
            Not affiliated with the Premier League or Fantasy Premier League.
            <br />
            Data sourced from the public FPL API.
          </p>
        </footer>
      </div>
    </main>
  );
}
