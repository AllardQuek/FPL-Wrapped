interface StatsRowProps {
  overallRank: number;
  totalPoints: number;
  grade?: string;
  primaryColor: string;
  isMobile?: boolean;
}

export function StatsRow({ 
  overallRank, 
  totalPoints, 
  grade,
  primaryColor,
  isMobile = false
}: StatsRowProps) {
  const labelSize = 'text-[8px]';
  const valueSize = 'text-lg';
  
  if (isMobile) {
    return (
      <div className="flex gap-6 justify-start w-full">
        <div className="text-left">
          <p className={`${labelSize} font-bold text-black/25 tracking-widest uppercase mb-0.5`}>Rank</p>
          <p className={`${valueSize} font-black tracking-tighter italic text-black/90`}>#{overallRank.toLocaleString()}</p>
        </div>
        <div className="text-left">
          <p className={`${labelSize} font-bold text-black/25 tracking-widest uppercase mb-0.5`}>Points</p>
          <p className={`${valueSize} font-black tracking-tighter text-black/90`}>{totalPoints.toLocaleString()}</p>
        </div>
        {grade && (
          <div className="text-left">
            <p className={`${labelSize} font-bold text-black/25 tracking-widest uppercase mb-0.5`}>Grade</p>
            <p className={`${valueSize} font-black tracking-tighter text-black/90`} style={{ color: primaryColor }}>{grade}</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex gap-10">
      <div>
        <p className="text-[9px] font-bold text-black/25 tracking-widest uppercase mb-0.5">Final Rank</p>
        <p className="text-2xl font-black tracking-tighter italic text-black/90">#{overallRank.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-[9px] font-bold text-black/25 tracking-widest uppercase mb-0.5">Total Points</p>
        <p className="text-2xl font-black tracking-tighter text-black/90">{totalPoints.toLocaleString()}</p>
      </div>
      {grade && (
        <div>
          <p className="text-[9px] font-bold text-black/25 tracking-widest uppercase mb-0.5">Season Grade</p>
          <p className="text-2xl font-black tracking-tighter" style={{ color: primaryColor }}>{grade}</p>
        </div>
      )}
    </div>
  );
}
