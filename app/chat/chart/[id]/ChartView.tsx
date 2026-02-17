'use client';

import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { Particles } from '@/components/ui/Particles';
import { useRef } from 'react';

export function ChartView({ spec }: { spec: string | object }) {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <Particles className="fixed inset-0 -z-10" quantity={30} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-[#00ff87] font-bold text-xl drop-shadow-[0_0_10px_rgba(0,255,135,0.3)] tracking-tight">FPL Chart</h1>
      </div>

      <div 
        ref={chartRef}
        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-center min-h-[400px]"
      >
        <ChartRenderer spec={spec} />
      </div>

      <p className="text-white/40 text-xs text-center">
        Powered by FPL Wrapped • Data visualization
      </p>
    </div>
  );
}
