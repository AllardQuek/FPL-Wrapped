"use client";

import { HelpCircle } from "lucide-react";
import React from "react";
import { Dialog } from "./Dialog";

interface InfoDialogProps {
  title: string;
  children: React.ReactNode;
  variant?: "light" | "dark";
}

export function InfoDialog({ title, children, variant = "dark" }: InfoDialogProps) {
  const iconColor = variant === "light" 
    ? "text-black/50 hover:text-black/80 hover:bg-black/5" 
    : "text-white/70 hover:text-white/100 hover:bg-white/10";
  
  return (
    <Dialog
      title={title}
      trigger={
        <button 
          className={`inline-flex items-center justify-center p-1 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 ${iconColor}`}
          aria-label="Click for more information"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      }
    >
      {children}
    </Dialog>
  );
}
