'use client';

import React from 'react';

interface PersonaMomentsProps {
    moments: string[];
    primaryColor: string;
}

export function PersonaMoments({ moments, primaryColor }: PersonaMomentsProps) {
    if (!moments || moments.length === 0) return null;

    return (
        <div>
            <p 
                className="text-[11px] font-black tracking-[0.15em] uppercase mb-3"
                style={{ color: `${primaryColor}` }}
            >
                {moments.length > 1 ? 'Defining Moments' : 'Your Season Highlight'}
            </p>
            <div className="space-y-2">
                {moments.map((moment, i) => (
                    <div 
                        key={i} 
                        className="bg-black/[0.02] rounded-xl p-4 border border-black/5 transition-all duration-300 hover:bg-white hover:shadow-sm"
                    >
                        <div className="flex items-start gap-3 text-left">
                            <div 
                                className="w-10 h-10 text-xl rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${primaryColor}10` }}
                            >
                                {moment.includes('benched') ? '😱' : 
                                 moment.includes('captained') && moment.includes('but') ? '😭' :
                                 moment.includes('captained') ? '🎯' :
                                 moment.includes('signed') || moment.includes('played') ? '⭐' : '📈'}
                            </div>
                            <p className="text-base text-black/80 leading-relaxed font-medium text-left pt-0.5">
                                {moment}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
