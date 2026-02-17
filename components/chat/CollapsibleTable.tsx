'use client';

import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A collapsible table component for Raw Data
 */
export function CollapsibleTable({ children, hasChart }: { children: ReactNode; hasChart: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const tableContent = (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/10 custom-scrollbar shadow-2xl bg-black/20">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );

  if (!hasChart) return tableContent;

  return (
    <div className="group my-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 cursor-pointer text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-[#00ff87] transition-colors outline-none"
      >
        <span
          className={`w-6 h-6 flex items-center justify-center rounded bg-white/5 border border-white/10 transition-transform ${isOpen ? 'rotate-90 text-[#00ff87] border-[#00ff87]/30' : 'text-white/80'}`}
          aria-hidden
        >
          <ChevronRight className="w-4 h-4" />
        </span>
        Raw Data Source
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              {tableContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
