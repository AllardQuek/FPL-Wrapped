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
  
  const photoSize = isMobile ? 'w-24 h-24' : 'w-32 h-32';
  const emojiSize = isMobile ? 'text-4xl' : 'text-5xl';
  const nameSize = isMobile ? 'text-2xl' : 'text-3xl';
  const teamSize = isMobile ? 'text-sm' : 'text-base';
  const titleSize = isMobile ? 'text-xs' : 'text-sm';
  const alignment = isMobile ? 'text-center' : 'text-left';
  const padding = isMobile ? 'px-4' : '';
  
  return (
    <div className={`flex ${isMobile ? 'flex-col items-center' : 'gap-6'}`}>
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
            sizes={isMobile ? '96px' : '128px'}
            priority
          />
        ) : (
          <span className={emojiSize}>{emoji || '👔'}</span>
        )}
      </div>

      {/* Name & Details */}
      <div className={`flex-1 ${alignment} min-w-0 ${isMobile ? 'w-full' : ''}`}>
        <h3 
          className={`${nameSize} font-black tracking-tighter mb-1 break-words ${padding}`}
          style={{ color: primaryColor }}
        >
          @{teamName.toUpperCase()}
        </h3>
        <p className="text-[10px] font-medium text-black/40 tracking-wide mb-3">ID: {managerId}</p>
        <p className={`${teamSize} font-black text-black/70 tracking-tight mb-2`}>{name}</p>
        <p 
          className={`${titleSize} font-bold tracking-wide uppercase mb-3`}
          style={{ color: primaryColor }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
