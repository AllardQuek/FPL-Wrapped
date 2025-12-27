'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SeasonSummary } from '@/lib/types';
import { WelcomeCard } from '@/components/cards/WelcomeCard';
import { OverviewCard } from '@/components/cards/OverviewCard';
import { TransferCard } from '@/components/cards/TransferCard';
import { CaptaincyCard } from '@/components/cards/CaptaincyCard';
import { BenchCard } from '@/components/cards/BenchCard';
import { MVPCard } from '@/components/cards/MVPCard';
import { SummaryCard } from '@/components/cards/SummaryCard';

export default function WrappedPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [summary, setSummary] = useState<SeasonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Fetching your data...');

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
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner mx-auto mb-8" style={{ width: '60px', height: '60px', borderWidth: '4px' }} />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Wrapped</h2>
          <p className="text-white/60 animate-pulse">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
          <p className="text-white/60 mb-8">{error}</p>
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

  // Main wrapped experience
  return (
    <div className="scroll-smooth">
      {/* Navigation dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2">
        {['welcome', 'overview', 'transfers', 'captaincy', 'bench', 'mvp', 'summary'].map((section, index) => (
          <a
            key={section}
            href={`#${section}`}
            className="w-2 h-2 rounded-full bg-white/20 hover:bg-white/50 transition-colors"
            title={section.charAt(0).toUpperCase() + section.slice(1)}
          />
        ))}
      </div>

      {/* Cards */}
      <section id="welcome">
        <WelcomeCard summary={summary} />
      </section>

      <section id="overview">
        <OverviewCard summary={summary} />
      </section>

      <section id="transfers">
        <TransferCard summary={summary} />
      </section>

      <section id="captaincy">
        <CaptaincyCard summary={summary} />
      </section>

      <section id="bench">
        <BenchCard summary={summary} />
      </section>

      {summary.mvpPlayer && (
        <section id="mvp">
          <MVPCard summary={summary} />
        </section>
      )}

      <section id="summary">
        <SummaryCard summary={summary} />
      </section>
    </div>
  );
}



