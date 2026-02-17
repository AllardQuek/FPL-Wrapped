"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import React from "react";

interface InfoTooltipProps {
    content: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    maxWidth?: string;
    variant?: "light" | "dark";
}

export function InfoTooltip({ content, side = "top", maxWidth = "max-w-[200px]", variant = "dark" }: InfoTooltipProps) {
    const iconColor = variant === "light" ? "text-black/40 hover:text-black/70" : "text-white/70 hover:text-white/90";
    
    return (
        <TooltipPrimitive.Provider delayDuration={300}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    <button className="inline-flex items-center justify-center p-1 opacity-50 hover:opacity-100 transition-opacity focus:outline-none">
                        <Info className={`w-3 h-3 ${iconColor}`} />
                    </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        className={`z-50 overflow-y-auto max-h-[80vh] rounded-md border border-white/10 bg-[#0d0015]/95 px-3 py-2 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 backdrop-blur-sm ${maxWidth} leading-relaxed scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}
                        sideOffset={5}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-white/10" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
}

export function Tooltip({ children, content, side = "top", sideOffset = 5 }: TooltipProps) {
    return (
        <TooltipPrimitive.Provider delayDuration={300}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        sideOffset={sideOffset}
                        className="z-50 overflow-hidden rounded-md border border-white/10 bg-[#0d0015]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00ff87] shadow-xl animate-in fade-in-0 zoom-in-95 backdrop-blur-md"
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-white/10" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}
