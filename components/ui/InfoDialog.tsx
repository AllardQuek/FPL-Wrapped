"use client";

import { Info } from "lucide-react";
import React from "react";
import { Dialog } from "./Dialog";

interface InfoDialogProps {
  title: string;
  children: React.ReactNode;
  variant?: "light" | "dark";
}

export function InfoDialog({ title, children, variant = "dark" }: InfoDialogProps) {
  const iconColor = variant === "light" ? "text-black/40 hover:text-black/70" : "text-white/70 hover:text-white/90";
  
  return (
    <Dialog
      title={title}
      trigger={
        <button className="inline-flex items-center justify-center p-1 opacity-50 hover:opacity-100 transition-opacity focus:outline-none">
          <Info className={`w-3 h-3 ${iconColor}`} />
        </button>
      }
    >
      {children}
    </Dialog>
  );
}
