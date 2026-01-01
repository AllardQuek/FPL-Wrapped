'use client';

import React from 'react';

interface PersonaHeaderProps {
    title: string;
    primaryColor: string;
    code: string;
}

export function PersonaHeader({ title, primaryColor, code }: PersonaHeaderProps) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
                <h2 
                    className="text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: `${primaryColor}80` }}
                >
                    Persona
                </h2>
                <span 
                    className="text-[10px] font-black tracking-widest opacity-60"
                    style={{ color: primaryColor }}
                >
                    {code}
                </span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                {title.toUpperCase()}
            </h1>
        </div>
    );
}
