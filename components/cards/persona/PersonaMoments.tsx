'use client';

import React from 'react';

interface PersonaMomentsProps {
    moments: string[];
    primaryColor: string;
}

export function PersonaMoments({ moments, primaryColor }: PersonaMomentsProps) {
    if (!moments || moments.length === 0) return null;

    return (
        <div className="mt-8 pt-6 border-t border-black/5">
            <p 
                className="text-[10px] font-bold tracking-[0.15em] uppercase mb-4"
                style={{ color: `${primaryColor}80` }}
            >
                {moments.length > 1 ? 'Defining Moments' : 'Your Season Highlight'}
            </p>
            <div className="space-y-3">
                {moments.map((moment, i) => (
                    <div 
                        key={i} 
                        className="bg-black/[0.02] rounded-xl p-4 border border-black/5 transition-all duration-300 hover:bg-white hover:shadow-sm"
                    >
                        <div className="flex items-start gap-3 text-left">
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                                style={{ backgroundColor: `${primaryColor}10` }}
                            >
                                {moment.includes('benched') ? '😱' : 
                                 moment.includes('captained') && moment.includes('but') ? '😭' :
                                 moment.includes('captained') ? '🎯' :
                                 moment.includes('signed') || moment.includes('played') ? '⭐' : '📈'}
                            </div>
                            <p className="text-sm text-black/75 leading-relaxed font-medium text-left pt-1">
                                {moment}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
