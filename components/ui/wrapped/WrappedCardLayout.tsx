'use client';

import { ReactNode } from 'react';
import { SharedImageFooter } from './SharedImageFooter';

interface WrappedCardLayoutProps {
  children: ReactNode;
  sectionNumber: string;
  sectionTitle?: string;
  className?: string;
  centerContent?: boolean;
}

export function WrappedCardLayout({ 
  children, 
  sectionNumber, 
  sectionTitle,
  className = "",
  centerContent = false
}: WrappedCardLayoutProps) {
  const hasMaxWidth = className.includes('max-w-');

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <div className={`flex-1 flex flex-col justify-center w-full ${!hasMaxWidth ? 'max-w-lg' : ''} ${centerContent ? 'text-center' : ''} ${className}`}>
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-4 md:mb-8 text-center">
          Section {sectionNumber}
        </p>
        
        {sectionTitle && (
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 md:mb-8 text-center uppercase italic">
            {sectionTitle}
          </h2>
        )}

        {children}
      </div>

      <SharedImageFooter />
    </div>
  );
}
