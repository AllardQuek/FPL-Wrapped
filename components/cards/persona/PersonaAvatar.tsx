'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PersonaAvatarProps {
    imageUrl?: string;
    name: string;
    emoji?: string;
    primaryColor: string;
}

export function PersonaAvatar({ imageUrl, name, emoji, primaryColor }: PersonaAvatarProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="relative w-32 h-32 mx-auto mb-6">
            <div 
                className="absolute inset-0 rounded-full animate-pulse-slow opacity-20"
                style={{ backgroundColor: primaryColor }}
            ></div>
            <div className="relative w-full h-full rounded-full bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        sizes="128px"
                        priority
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
