'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SeasonSummary } from '@/lib/types';
import { WelcomeCard } from '@/components/cards/WelcomeCard';
import { OverviewCard } from '@/components/cards/OverviewCard';
import { TransferCard } from '@/components/cards/TransferCard';
import { CaptaincyCard } from '@/components/cards/CaptaincyCard';
import { BenchCard } from '@/components/cards/BenchCard';
import { SquadAnalysisCard } from '@/components/cards/SquadAnalysisCard';
import { ChipsCard } from '@/components/cards/ChipsCard';
import { PersonaCard } from '@/components/cards/PersonaCard';
import { SummaryCard } from '@/components/cards/SummaryCard';
import { FooterCard } from '@/components/cards/FooterCard';
import { ShareButton } from '@/components/ui/ShareButton';
import { NavigationControls } from '@/components/ui/NavigationControls';

export default function WrappedPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [summary, setSummary] = useState<SeasonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Fetching your data...');
  const [mounted, setMounted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const isNavigating = useRef(false);
  
  // Section IDs for navigation
  const sections = ['welcome', 'overview', 'transfers', 'captaincy', 'bench', 'chips', 'squadAnalysis', 'persona', 'summary', 'footer'];
  
  // Navigation handler
  const handleNavigate = useCallback((index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      isNavigating.current = true;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSection(index);
      // Prevent focus outline by ensuring no element gets focused
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Reset navigating flag after scroll animation completes
      setTimeout(() => {
        isNavigating.current = false;
      }, 1000);
    }
  }, []);
  
  // Track current section based on scroll position with improved detection
  useEffect(() => {
    let rafId: number;
    
    const updateCurrentSection = () => {
      // Don't update if we're actively navigating
      if (isNavigating.current) return;
      
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      // Find which section is currently in the middle of the viewport
      let newCurrentSection = 0;
      
      for (let i = sectionRefs.current.length - 1; i >= 0; i--) {
        const section = sectionRefs.current[i];
        if (section) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          
          if (scrollPosition >= sectionTop) {
            newCurrentSection = i;
            break;
          }
        }
      }
      
      setCurrentSection(newCurrentSection);
    };
    
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth updates
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateCurrentSection);
    };
    
    // Initial update
    updateCurrentSection();
    
    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [summary]); // Re-run when summary loads

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Show different loading messages
        const messages = [
          'Fetching your data...',
          'Analyzing your transfers...',
          'Reviewing your captain picks...',
          'Calculating your bench points...',
          'Generating your wrapped...',
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
          messageIndex = (messageIndex + 1) % messages.length;
          setLoadingMessage(messages[messageIndex]);
        }, 2000);

        const response = await fetch(`/api/manager/${teamId}`);

        clearInterval(messageInterval);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch data');
        }

        const data = await response.json();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching wrapped data:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="particles">
          {mounted && [...Array(20)].map((_, i) => (
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
        <div className="text-center relative z-10">
          <div className="spinner mx-auto mb-8" style={{ width: '60px', height: '60px', borderWidth: '4px' }} />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Wrapped</h2>
          <p className="text-white/60 animate-pulse uppercase tracking-[0.2em] text-xs">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="particles">
          {mounted && [...Array(10)].map((_, i) => (
            <div
              key={i}
              className="particle opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
        <div className="text-center max-w-md relative z-10">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight italic">Oops!</h2>
          <p className="text-white/60 mb-8 font-medium">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="fpl-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-6">🤔</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Data Found</h2>
          <p className="text-white/60 mb-8">
            We couldn&apos;t find any data for this team ID.
          </p>
          <button
            onClick={() => router.push('/')}
            className="fpl-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-smooth relative overflow-x-hidden">
      {/* Navigation Controls */}
      <NavigationControls 
        sections={sections}
        currentSection={currentSection}
        onNavigate={handleNavigate}
      />
      
      {/* Share Button */}
      <ShareButton />

      {/* Main Content Wrapper for Capture */}
      <div id="wrapped-content">
        {/* Shared Background Particles */}
        <div className="particles">
          {mounted && [...Array(30)].map((_, i) => (
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

        {/* Cards */}
        <section id="welcome" ref={(el) => { sectionRefs.current[0] = el; }}>
          <WelcomeCard summary={summary} />
        </section>

        <section id="overview" ref={(el) => { sectionRefs.current[1] = el; }}>
          <OverviewCard summary={summary} />
        </section>

        <section id="transfers" ref={(el) => { sectionRefs.current[2] = el; }}>
          <TransferCard summary={summary} />
        </section>

        <section id="captaincy" ref={(el) => { sectionRefs.current[3] = el; }}>
          <CaptaincyCard summary={summary} />
        </section>

        <section id="bench" ref={(el) => { sectionRefs.current[4] = el; }}>
          <BenchCard summary={summary} />
        </section>

        <section id="chips" ref={(el) => { sectionRefs.current[5] = el; }}>
          <ChipsCard summary={summary} />
        </section>

        {summary.mvpPlayer && (
          <section id="squadAnalysis" ref={(el) => { sectionRefs.current[6] = el; }}>
            <SquadAnalysisCard summary={summary} />
          </section>
        )}

        <section id="persona" ref={(el) => { sectionRefs.current[7] = el; }}>
          <PersonaCard summary={summary} />
        </section>

        <section id="summary" ref={(el) => { sectionRefs.current[8] = el; }}>
          <SummaryCard summary={summary} />
        </section>

        <section id="footer" ref={(el) => { sectionRefs.current[9] = el; }}>
          <FooterCard />
        </section>
      </div>
    </div>
  );
}



