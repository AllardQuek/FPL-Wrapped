'use client';

import React from 'react';

interface PersonaIdentityProps {
    name: string;
    description: string;
    quote?: string;
    quoteSource?: string;
}

export function PersonaIdentity({ name, description, quote, quoteSource }: PersonaIdentityProps) {
    return (
        <>
            <h3 className="text-xl font-black uppercase mb-4 text-black/90">
                {name}
            </h3>
            {quote && (
                <div className="mb-6 px-4">
                    <p className="text-base leading-relaxed text-black/70 font-medium italic mb-1">
                        &ldquo;{quote}&rdquo;
                    </p>
                    {quoteSource && (
                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider">
                            — {quoteSource}
                        </p>
                    )}
                </div>
            )}
            <p className="text-sm leading-relaxed text-black/50 mb-8 px-6 font-medium">
                {description}
            </p>
        </>
    );
}
