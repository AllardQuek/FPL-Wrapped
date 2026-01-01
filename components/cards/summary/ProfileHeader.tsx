import Image from 'next/image';
import { useState } from 'react';

interface ProfileHeaderProps {
  imageUrl?: string;
  emoji?: string;
  name: string;
  teamName: string;
  managerId: number;
  title: string;
  primaryColor: string;
  isMobile?: boolean;
}

export function ProfileHeader({
  imageUrl,
  emoji,
  name,
  teamName,
  managerId,
  title,
  primaryColor,
  isMobile = false
}: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);
  
  const photoSize = isMobile ? 'w-20 h-20' : 'w-32 h-32';
  const emojiSize = isMobile ? 'text-3xl' : 'text-5xl';
  const nameSize = isMobile ? 'text-xl' : 'text-3xl';
  const teamSize = isMobile ? 'text-xs' : 'text-base';
  const titleSize = isMobile ? 'text-[10px]' : 'text-sm';
  
  return (
    <div className="flex gap-4 items-center">
      {/* Photo */}
      <div 
        className={`${photoSize} rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden relative border-2`}
        style={{ borderColor: `${primaryColor}60` }}
      >
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={isMobile ? '80px' : '128px'}
            priority
          />
        ) : (
          <span className={emojiSize}>{emoji || '👔'}</span>
        )}
      </div>

      {/* Name & Details */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 
            className={`${nameSize} font-black tracking-tighter break-words`}
            style={{ color: primaryColor }}
          >
            @{teamName.toUpperCase()}
          </h3>
        </div>
        <p className="text-[9px] font-medium text-black/40 tracking-wide mb-1">ID: {managerId}</p>
        <p className={`${teamSize} font-black text-black/70 tracking-tight mb-1`}>{name}</p>
        <p 
          className={`${titleSize} font-bold tracking-wide uppercase`}
          style={{ color: primaryColor }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
