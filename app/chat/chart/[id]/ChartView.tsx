'use client';

import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { Particles } from '@/components/ui/Particles';
import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

export function ChartView({ spec }: { spec: string | object }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!chartRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      // Small delay to ensure we don't capture any active hover states
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await toPng(chartRef.current, { 
        backgroundColor: '#0d0015',
        quality: 1.0,
        pixelRatio: 2, // Capture at 2x for retina-quality downloads
      });

      const link = document.createElement('a');
      link.download = `fpl-wrapped-chart-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image', err);
      alert('Failed to generate image. Try taking a screenshot instead!');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <Particles className="fixed inset-0 -z-10" quantity={30} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-[#00ff87] font-bold text-xl drop-shadow-[0_0_10px_rgba(0,255,135,0.3)] tracking-tight">Interactive Chart</h1>
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00ff87]/50 rounded-xl transition-all text-white/70 hover:text-[#00ff87] active:scale-95 ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
          title="Download as PNG"
        >
          {isDownloading ? <div className="w-5 h-5 border-2 border-[#00ff87]/20 border-t-[#00ff87] rounded-full animate-spin" /> : <Download size={20} />}
        </button>
      </div>

      <div 
        ref={chartRef}
        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-center min-h-[400px]"
      >
        <ChartRenderer spec={spec} />
      </div>

      <p className="text-white/40 text-xs text-center">
        Powered by FPL Wrapped • Interactive visuals
      </p>
    </div>
  );
}
