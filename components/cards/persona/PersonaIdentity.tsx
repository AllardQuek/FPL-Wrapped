'use client';

import React from 'react';

interface PersonaIdentityProps {
    name: string;
    description: string;
}

export function PersonaIdentity({ name, description }: PersonaIdentityProps) {
    return (
        <>
            <h3 className="text-xl font-black uppercase mb-4 text-black/90">
                {name}
            </h3>
            <p className="text-base leading-relaxed text-black/70 mb-8 px-4 font-medium italic">
                &ldquo;{description}&rdquo;
            </p>
        </>
    );
}
