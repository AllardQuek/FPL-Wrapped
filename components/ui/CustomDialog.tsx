"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

interface DialogProps {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ trigger, title, children }: DialogProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        {trigger}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 max-h-[70vh] w-[90vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-[#0d0015] border border-white/10 p-5 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <DialogPrimitive.Title className="text-base font-black text-white uppercase tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-lg opacity-70 hover:opacity-100 transition-opacity focus:outline-none p-1.5 hover:bg-white/10">
              <X className="h-4 w-4 text-white" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
