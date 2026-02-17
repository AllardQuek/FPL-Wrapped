'use client';

import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { Particles } from '@/components/ui/Particles';
import { Download } from 'lucide-react';
import { useRef } from 'react';
import { toPng } from 'html-to-image';

export function ChartView({ spec }: { spec: string | object }) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#0d0015' });
      const link = document.createElement('a');
      link.download = `fpl-chart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <Particles className="fixed inset-0 -z-10" quantity={30} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-[#00ff87] font-bold text-xl">FPL Interactive Chart</h1>
        <button 
          onClick={handleDownload}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-[#00ff87]"
          title="Download as PNG"
        >
          <Download size={20} />
        </button>
      </div>

      <div 
        ref={chartRef}
        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden flex items-center justify-center min-h-[400px]"
      >
        <ChartRenderer spec={spec} />
      </div>

      <p className="text-white/40 text-xs text-center">
        Powered by FPL Wrapped • Interactive visuals
      </p>
    </div>
  );
}
