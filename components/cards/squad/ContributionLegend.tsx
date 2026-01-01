'use client';

import React from 'react';

interface LegendItem {
  label: string;
  subLabel?: string;
  value: string | number;
  color: string;
  isHighlight?: boolean;
}

interface ContributionLegendProps {
  items: LegendItem[];
}

export function ContributionLegend({ items }: ContributionLegendProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-xs group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.color}40`
              }}
            />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-white uppercase tracking-tight truncate group-hover:text-white/90 transition-colors">
                {item.label}
              </span>
              {item.subLabel && (
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider whitespace-nowrap">
                  • {item.subLabel}
                </span>
              )}
              {item.isHighlight && <span className="text-[10px] bg-white/10 px-1 rounded text-white/60 font-black flex-shrink-0">MVP</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-white font-mono font-bold">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
