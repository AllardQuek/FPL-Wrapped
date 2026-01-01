'use client';

import React, { useState } from 'react';

interface PersonaAvatarProps {
    imageUrl?: string;
    name: string;
    emoji?: string;
    primaryColor: string;
}

export function PersonaAvatar({ imageUrl, name, emoji, primaryColor }: PersonaAvatarProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="relative w-24 h-24 mx-auto mb-4">
            <div 
                className="absolute inset-0 rounded-full animate-pulse-slow opacity-20"
                style={{ backgroundColor: primaryColor }}
            ></div>
            <div className="relative w-full h-full rounded-full bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                {imageUrl && !imageError ? (
                    // Use regular img for better screenshot compatibility
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={name}
                        className="object-cover w-full h-full"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="text-6xl">{emoji || '👔'}</span>
                )}
            </div>
            {/* Decorative ring */}
            <div 
                className="absolute -inset-2 border rounded-full opacity-20"
                style={{ borderColor: primaryColor }}
            ></div>
        </div>
    );
}
