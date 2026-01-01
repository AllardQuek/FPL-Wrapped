interface TraitBadgesProps {
  traits: string[];
  primaryColor: string;
  maxTraits?: number;
  centered?: boolean;
}

export function TraitBadges({ 
  traits, 
  primaryColor, 
  maxTraits = 3,
  centered = false 
}: TraitBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
      {traits.slice(0, maxTraits).map((trait, i) => (
        <div 
          key={i} 
          className="px-3 py-1 rounded-lg text-[9px] font-bold tracking-wide uppercase whitespace-nowrap border-2 shadow-sm"
          style={{
            backgroundColor: `${primaryColor}20`,
            borderColor: `${primaryColor}50`,
            color: primaryColor
          }}
        >
          {trait}
        </div>
      ))}
    </div>
  );
}
