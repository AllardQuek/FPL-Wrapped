'use client';

import { useState } from 'react';

interface UserAvatarProps {
  managerId: number;
  firstName: string;
  lastName: string;
  favouriteTeam?: number | null;
  size?: number;
  className?: string;
}

/**
 * User Avatar Component with automatic fallback handling
 * 
 * Priority order:
 * 1. FPL user avatar (if exists)
 * 2. Favourite team badge
 * 3. Generated avatar with initials
 */
export function UserAvatar({
  managerId,
  firstName,
  lastName,
  favouriteTeam,
  size = 128,
  className = ''
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Try FPL avatar first
  const fplAvatarUrl = `https://fantasy.premierleague.com/img/avatar/${managerId}.jpg`;
  
  // Fallback to favourite team badge
  const teamBadgeUrl = favouriteTeam 
    ? `https://fantasy.premierleague.com/dist/img/badges/badge_${favouriteTeam}_80.png`
    : null;
  
  // Ultimate fallback: generated avatar
  const fullName = `${firstName}+${lastName}`;
  const generatedAvatarUrl = `https://ui-avatars.com/api/?name=${fullName}&background=00ff87&color=000&size=${size * 2}&bold=true&rounded=true`;

  const handleImageError = () => {
    if (!usedFallback && teamBadgeUrl) {
      // Try team badge next
      setUsedFallback(true);
      setImageError(false);
    } else {
      // Use generated avatar
      setImageError(true);
    }
  };

  // Determine which image to use
  let imageSrc = fplAvatarUrl;
  if (usedFallback && teamBadgeUrl) {
    imageSrc = teamBadgeUrl;
  }
  if (imageError) {
    imageSrc = generatedAvatarUrl;
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {imageError ? (
        // Generated avatar (external API, use regular img with crossOrigin)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={`${firstName} ${lastName}`}
          width={size}
          height={size}
          className="rounded-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        // FPL or team badge
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={`${firstName} ${lastName}`}
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      )}
      
      {/* Fallback indicator (for debugging - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-white/40 whitespace-nowrap">
          {imageError ? '🎨 Generated' : usedFallback ? '⚽ Badge' : '👤 FPL'}
        </div>
      )}
    </div>
  );
}
