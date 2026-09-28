"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />

      {/* Spacer pushes modal to bottom on mobile */}
      <div className="flex-1 sm:hidden" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full sm:my-auto border border-slate-700/60 bg-slate-900/98 p-5 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] flex flex-col z-10 overflow-hidden",
          "rounded-t-3xl sm:rounded-3xl",
          maxWidths[maxWidth || size || "md"]
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div>
            {title && <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
