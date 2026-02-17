'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseVegaSpec, prepareSpec, createSecureLoader } from '@/lib/chat/charts';
import { getUserFriendlyError } from '@/lib/chat/utils';
import type { VisualizationSpec } from 'vega-embed';

export const ChartRenderer = memo(function ChartRenderer({ spec }: { spec: string | object }) {
  const el = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  // Keep track of the last successfully rendered spec to avoid flickering
  const lastValidSpec = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    // Use a small delay for streaming content to avoid parsing partial JSON
    const timeout = setTimeout(async () => {
      if (!el.current) return;
      
      try {
        const vegaEmbed = (await import('vega-embed')).default;
        
        // 1. Parse the spec. If it fails, we assume it's still streaming/invalidly formatted.
        let parsed;
        try {
          parsed = await parseVegaSpec(spec);
        } catch {
          // If we haven't rendered anything yet, keep loading. 
          // If we have, just stay on the last valid one until this one is fixed.
          return;
        }

        if (cancelled) return;

        // 2. Prepare the spec
        const { safeSpec, title: extractedTitle } = prepareSpec(parsed);
        
        // Compare with last valid to avoid redundant re-renders
        const specString = JSON.stringify(safeSpec);
        if (lastValidSpec.current === specString) {
          setLoading(false);
          setIsReady(true);
          return;
        }

        // 3. Create secure loader and render
        const loader = await createSecureLoader();
        if (cancelled) return;

        // Only show loading if we haven't rendered anything successful yet
        if (!lastValidSpec.current) {
          setLoading(true);
          setIsReady(false);
        }
        setError(null);

        await vegaEmbed(el.current, safeSpec as VisualizationSpec, { 
          actions: false, 
          renderer: 'svg', 
          loader,
          tooltip: true,
          theme: 'dark'
        });

        if (!cancelled) {
          lastValidSpec.current = specString;
          if (extractedTitle) setTitle(extractedTitle);
          setLoading(false);
          
          // Small delay to ensure browser has painted the SVG before we fade it in
          requestAnimationFrame(() => {
            if (!cancelled) setIsReady(true);
          });
        }
      } catch (err) {
        // Only show error if we've completely stopped streaming or it's a fatal render error
        if (!cancelled) {
          setError(err instanceof Error ? getUserFriendlyError(err.message) : String(err));
          setLoading(false);
        }
      }
    }, typeof spec === 'string' && spec.length < 1000 ? 100 : 0); // Smaller delay for small specs
    
    return () => { 
      cancelled = true; 
      clearTimeout(timeout);
    };
  }, [spec]);

  return (
    <div className="w-full my-6 relative group overflow-visible">
      <div className="glass-card w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all hover:border-[#00ff87]/30">
        {title && (
          <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-white/10 to-transparent flex items-center justify-between">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,135,0.4)]">{title}</div>
            <div className="flex gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            </div>
          </div>
        )}

        <div className="p-1 sm:p-2 bg-black/20 flex items-center justify-center relative min-h-[300px]">
          <div 
            ref={el} 
            className={`w-full flex justify-center items-center interactive-chart overflow-hidden transition-opacity duration-500 [&>.vega-embed]:!max-w-full [&>.vega-embed]:!w-full [&_svg]:mx-auto ${isReady ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          <AnimatePresence mode="wait">
            {(loading && !lastValidSpec.current) && (
              <motion.div 
                key="loading-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-[#0d0015]/40 backdrop-blur-[2px] z-10"
              >
                <div className="flex flex-col items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 border-2 border-[#00ff87]/5 border-t-[#00ff87] rounded-full animate-spin" />
                  <div className="text-[#00ff87] text-[10px] font-black uppercase tracking-widest">Generating Visualization...</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border-t border-red-500/20">
            <div className="text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
