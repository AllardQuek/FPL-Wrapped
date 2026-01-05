'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface TemplateOverlapProps {
  overlap: number;
}

export function TemplateOverlap({ overlap }: TemplateOverlapProps) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="bg-white/5 rounded-3xl p-4 border border-white/10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-4xl w-full backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <span className="text-4xl">
            {overlap >= 50 ? '🐑' : 
             overlap >= 25 ? '⚖️' : '🦄'}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Template Overlap</p>
              <InfoTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-white">How is this calculated?</p>
                    <div className="space-y-1 text-white/80">
                      <p><strong>Template Player</strong> = Any player with ≥15% ownership</p>
                      <p className="text-xs text-white/60 italic">e.g., Haaland, Semenyo, premium defenders</p>
                    </div>
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-white/90 font-mono text-xs">
                        Template Overlap % = <br/>
                        (Template players in your squad / Total squad slots) × 100
                      </p>
                    </div>
                    <div className="pt-2 space-y-1 text-xs">
                      <p className="text-white/70">📊 Measured across all finished gameweeks</p>
                      <p className="text-white/70">• <strong>50%+</strong>: Template-heavy (half your team are template picks)</p>
                      <p className="text-white/70">• <strong>25-50%</strong>: Balanced approach</p>
                      <p className="text-white/70">• <strong>&lt;25%</strong>: Differential picks (unique strategy)</p>
                    </div>
                  </div>
                }
              />
            </div>
            <p className="text-3xl md:text-4xl font-black text-white">{overlap.toFixed(0)}%</p>
            <p className="text-xs text-white/60 font-medium mt-1">
              {overlap >= 50 ? 'Template-heavy squad approach' : 
               overlap >= 25 ? 'Balanced squad strategy' : 'Differential king approach'}
            </p>
          </div>
        </div>
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff87] via-[#fbbf24] to-[#e90052] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overlap * 1.5, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[8px] text-white/30 font-bold uppercase">
            <span>🦄 Unique</span>
            <span>⚖️ Balanced</span>
            <span>🐑 Template</span>
          </div>
        </div>
      </div>
    </div>
  );
}
