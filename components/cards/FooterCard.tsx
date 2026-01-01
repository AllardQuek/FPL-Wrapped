'use client';

import { getCurrentFPLSeason } from '@/lib/season';
import Link from 'next/link';

export function FooterCard() {
  const currentSeason = getCurrentFPLSeason();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">THANKS FOR VISITING</h2>
        </div> */}

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {/* Main Message */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mb-3">
              THANKS FOR VISITING
            </h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto mb-6">
              Built for the FPL community. Star the repo or share your ideas.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-8">
              <a
                href="https://github.com/AllardQuek/FPL-Wrapped"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-semibold text-sm transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>

              <a
                href="https://github.com/AllardQuek/FPL-Wrapped/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Feedback
              </a>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-white/20 pt-6 text-center space-y-2">
            <p className="text-[10px] font-semibold text-white/40 tracking-[0.15em] uppercase">
              {currentSeason} Season
            </p>
            <p className="text-[12px] text-white/50">
              Made with ⚽
            </p>
          </div>
        </div>

        <div className="text-center space-y-6 mt-12 mb-8">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-share', { detail: { sectionId: 'summary' } }))}
            className="inline-block p-1 rounded-full bg-white/5 backdrop-blur-md px-6 py-2 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <p className="text-xs text-white/60 font-medium">
              Share your Profile 📸
            </p>
          </button>
          <div>
            <Link
              href="/"
              className="px-8 py-3 bg-[#00ff87] text-black font-bold rounded-full text-sm hover:scale-105 transition-transform inline-block"
            >
              Analyze Another Team
            </Link>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="text-center mt-8">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} AllardQuek
          </p>
        </div>
      </div>
    </div>
  );
}
