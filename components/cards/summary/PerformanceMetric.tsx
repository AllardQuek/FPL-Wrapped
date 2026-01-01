interface PerformanceMetricProps {
  emoji: string;
  label: string;
  value: string | number;
  primaryColor: string;
  opacityLevel: string;
  isMobile?: boolean;
}

export function PerformanceMetric({ 
  emoji, 
  label, 
  value, 
  primaryColor, 
  opacityLevel,
  isMobile = false 
}: PerformanceMetricProps) {
  const iconSize = isMobile ? 'w-6 h-6' : 'w-7 h-7';
  const emojiSize = isMobile ? 'text-sm' : 'text-base';
  const gap = isMobile ? 'gap-1.5' : 'gap-2';
  
  return (
    <div 
      className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 shadow-sm border" 
      style={{ borderColor: `${primaryColor}25` }}
    >
      <div className={`flex items-center ${gap} mb-2`}>
        <div 
          className={`${iconSize} rounded-lg flex items-center justify-center`} 
          style={{ backgroundColor: `${primaryColor}${opacityLevel}` }}
        >
          <span className={emojiSize}>{emoji}</span>
        </div>
        <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide">{label}</p>
      </div>
      <p 
        className="text-2xl font-black" 
        style={{ color: primaryColor, opacity: 0.9 }}
      >
        {value}
      </p>
    </div>
  );
}
