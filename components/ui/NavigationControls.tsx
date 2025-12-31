'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface NavigationControlsProps {
  sections: string[];
  currentSection: number;
  onNavigate: (index: number) => void;
}

export function NavigationControls({ sections, currentSection, onNavigate }: NavigationControlsProps) {
  const [showHint, setShowHint] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide UI on desktop after mouse idle
  useEffect(() => {
    if (isMobile) {
      return; // Skip auto-hide on mobile
    }

    let idleTimer: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsVisible(false), 2000);
    };

    // Hide after 4 seconds initially
    const initialTimer = setTimeout(() => setIsVisible(false), 4000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', () => setIsVisible(true));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', () => setIsVisible(true));
      clearTimeout(idleTimer);
      clearTimeout(initialTimer);
    };
  }, [isMobile]);

  useEffect(() => {
    // Hide hint after first interaction
    const hideHint = () => setShowHint(false);
    window.addEventListener('click', hideHint, { once: true });
    window.addEventListener('keydown', hideHint, { once: true });
    window.addEventListener('touchstart', hideHint, { once: true });

    return () => {
      window.removeEventListener('click', hideHint);
      window.removeEventListener('keydown', hideHint);
      window.removeEventListener('touchstart', hideHint);
    };
  }, []);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
        case ' ': // Spacebar
          e.preventDefault();
          if (currentSection < sections.length - 1) {
            onNavigate(currentSection + 1);
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          if (currentSection > 0) {
            onNavigate(currentSection - 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          onNavigate(0);
          break;
        case 'End':
          e.preventDefault();
          onNavigate(sections.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, sections.length, onNavigate]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;

    // Swipe threshold: 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSection < sections.length - 1) {
        // Swiped up - next section
        onNavigate(currentSection + 1);
      } else if (diff < 0 && currentSection > 0) {
        // Swiped down - previous section
        onNavigate(currentSection - 1);
      }
    }

    setTouchStart(null);
  };

  // Click zones for navigation
  const handleClickZone = (direction: 'prev' | 'next') => {
    // Ignore clicks if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    
    if (direction === 'next' && currentSection < sections.length - 1) {
      onNavigate(currentSection + 1);
    } else if (direction === 'prev' && currentSection > 0) {
      onNavigate(currentSection - 1);
    }
  };

  return (
    <>
      {/* Progress Bar - Auto-hide on desktop */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-4 bg-gradient-to-b from-[#0d0015] via-[#0d0015]/90 to-transparent backdrop-blur-sm transition-all duration-300 ${
          !isMobile && !isVisible ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        data-html2canvas-ignore
        onMouseEnter={() => !isMobile && setIsVisible(true)}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                className="flex-1 h-1 rounded-full transition-all duration-300 hover:h-1.5"
                style={{
                  background: index <= currentSection 
                    ? 'rgba(0, 255, 135, 0.8)' 
                    : 'rgba(255, 255, 255, 0.2)',
                }}
                aria-label={`Go to ${sections[index]}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
              {sections[currentSection]?.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-[10px] font-mono text-white/40">
              {currentSection + 1}/{sections.length}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <>
        {/* Swipe handler for touch devices */}
        {isMobile && (
          <div
            className="fixed inset-0 z-40 pointer-events-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            data-html2canvas-ignore
            style={{ touchAction: 'pan-y' }} // Allow vertical scrolling
          />
        )}
        
        {/* Visible Next Button (Bottom Right) */}
        {currentSection < sections.length - 1 && (
          <button
            onClick={() => handleClickZone('next')}
            className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md hover:bg-white/20 active:bg-white/30 text-white p-4 rounded-full shadow-lg border border-white/20 transition-all active:scale-95"
            aria-label="Next section"
            data-html2canvas-ignore
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        )}
      </>

      {/* First-time hint */}
      {showHint && currentSection === 0 && (
        <div 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none"
          data-html2canvas-ignore
        >
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
            <p className="text-xs text-white/70 font-medium flex items-center gap-2">
              {isMobile ? (
                <>
                  <span>Swipe up or tap</span>
                  <span className="text-[#00ff87]">↓</span>
                  <span>to continue</span>
                </>
              ) : (
                <>
                  <span>Scroll, press</span>
                  <kbd className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-mono">Space</kbd>
                  <span>or click</span>
                  <span className="text-[#00ff87]">↓</span>
                  <span>to continue</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help (hidden by default, show on "?" press) */}
      <div className="sr-only" data-html2canvas-ignore>
        <p>Keyboard shortcuts:</p>
        <ul>
          <li>Space, Arrow Down, Arrow Right: Next section</li>
          <li>Arrow Up, Arrow Left: Previous section</li>
          <li>Home: First section</li>
          <li>End: Last section</li>
        </ul>
      </div>
    </>
  );
}
