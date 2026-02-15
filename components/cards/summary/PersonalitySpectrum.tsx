import { InfoTooltip } from '@/components/ui/CustomTooltip';

interface SpectrumEnd {
  emoji: string;
  name: string;
}

interface PersonalitySpectrumProps {
  lowEnd: SpectrumEnd;
  highEnd: SpectrumEnd;
  score: number;
  primaryColor: string;
  tooltipContent: {
    lowEnd: React.ReactNode;
    highEnd: React.ReactNode;
  };
}

export function PersonalitySpectrum({
  lowEnd,
  highEnd,
  score,
  primaryColor,
  tooltipContent
}: PersonalitySpectrumProps) {
  const percentage = Math.round(score * 100);
  const isLowEnd = score < 0.5;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`text-base transition-transform duration-300 ${isLowEnd ? 'scale-110' : 'opacity-50'}`}>
            {lowEnd.emoji}
          </span>
          <span 
            className={`font-bold transition-all duration-300 ${isLowEnd ? 'text-sm' : 'opacity-40'}`} 
            style={{ color: isLowEnd ? primaryColor : 'inherit' }}
          >
            {lowEnd.name}
          </span>
          {isLowEnd && (
            <InfoTooltip 
              variant="light"
              content={tooltipContent.lowEnd}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isLowEnd && (
            <InfoTooltip 
              variant="light"
              content={tooltipContent.highEnd}
            />
          )}
          <span 
            className={`font-bold transition-all duration-300 ${!isLowEnd ? 'text-sm' : 'opacity-40'}`}
            style={{ color: !isLowEnd ? primaryColor : 'inherit' }}
          >
            {highEnd.name}
          </span>
          <span className={`text-base transition-transform duration-300 ${!isLowEnd ? 'scale-110' : 'opacity-50'}`}>
            {highEnd.emoji}
          </span>
        </div>
      </div>
      
      <div className="relative h-1.5 bg-gray-200 rounded-full mt-5 mb-2">
        {/* Middle reference line */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-black/30 rounded-full z-0"
        />
        <div 
          className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 top-1/2 -translate-y-1/2 shadow-md border-2 border-white z-10 transition-all duration-500 ease-out"
          style={{ 
            left: `${percentage}%`,
            backgroundColor: primaryColor,
          }}
        />
        <div 
          className="absolute text-[10px] font-bold transform -translate-x-1/2 -top-5"
          style={{ 
            left: `${percentage}%`,
            color: primaryColor,
          }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}
