'use client';

import React from 'react';

interface PersonaHeaderProps {
    title: string;
    primaryColor: string;
}

export function PersonaHeader({ title, primaryColor }: PersonaHeaderProps) {
    return (
        <div className="mb-4">
            <h2 
                className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
                style={{ color: `${primaryColor}80` }}
            >
                Persona
            </h2>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                {title.toUpperCase()}
            </h1>
        </div>
    );
}
