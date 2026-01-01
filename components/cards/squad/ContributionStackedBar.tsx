'use client';

import React from 'react';

interface ContributionItem {
  percentage: number;
  color: string;
  label?: string;
}

interface ContributionStackedBarProps {
  items: ContributionItem[];
  height?: string;
  showLabels?: boolean;
}

export function ContributionStackedBar({ 
  items, 
  height = "h-10",
  showLabels = true 
}: ContributionStackedBarProps) {
  return (
    <div className={`w-full ${height} bg-white/5 rounded-xl overflow-hidden flex mb-4 shadow-inner border border-white/5`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-center transition-all hover:brightness-110 relative group border-r border-black/10 last:border-r-0"
          style={{ 
            width: `${item.percentage}%`,
            backgroundColor: item.color,
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent, rgba(0,0,0,0.2))'
          }}
        >
          {showLabels && item.percentage > 5 && (
            <div className="flex flex-col items-center justify-center px-2">
              <span 
                className="text-[10px] font-black text-white text-center leading-tight"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          )}
          
          {/* Hover Tooltip-like effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
