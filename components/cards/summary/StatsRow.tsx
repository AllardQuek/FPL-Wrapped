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
  if (isMobile) {
    return (
      <div className="flex gap-4 justify-center w-full">
        <div className="text-center">
          <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Final Rank</p>
          <p className="text-xl font-black tracking-tighter italic text-black/90">#{overallRank.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
          <p className="text-xl font-black tracking-tighter text-black/90">{totalPoints.toLocaleString()}</p>
        </div>
        {grade && (
          <div className="text-center">
            <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Season Grade</p>
            <p className="text-xl font-black tracking-tighter text-black/90" style={{ color: primaryColor }}>{grade}</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex gap-4">
      <div 
        className="flex-1 text-center bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 border" 
        style={{ borderColor: `${primaryColor}25` }}
      >
        <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Final Rank</p>
        <p className="text-2xl font-black tracking-tighter italic text-black/90">#{overallRank.toLocaleString()}</p>
      </div>
      <div 
        className="flex-1 text-center bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 border" 
        style={{ borderColor: `${primaryColor}25` }}
      >
        <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Total Points</p>
        <p className="text-2xl font-black tracking-tighter text-black/90">{totalPoints.toLocaleString()}</p>
      </div>
      {grade && (
        <div 
          className="flex-1 text-center bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 border" 
          style={{ borderColor: `${primaryColor}25` }}
        >
          <p className="text-[10px] font-bold text-black/30 tracking-widest uppercase mb-1">Season Grade</p>
          <p className="text-2xl font-black tracking-tighter" style={{ color: primaryColor }}>{grade}</p>
        </div>
      )}
    </div>
  );
}
