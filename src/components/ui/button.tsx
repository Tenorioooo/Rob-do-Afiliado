import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "glow" | "emerald";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25 border border-primary/40",
      secondary:
        "bg-slate-800/90 text-slate-100 hover:bg-slate-700/90 border border-slate-700/60 shadow-sm",
      outline:
        "bg-transparent border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-slate-600",
      ghost:
        "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50",
      destructive:
        "bg-rose-600/90 text-white hover:bg-rose-500 border border-rose-500/40 shadow-md shadow-rose-900/30",
      glow:
        "bg-gradient-to-r from-primary to-indigo-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/30 border border-indigo-400/40 hover:shadow-indigo-500/50",
      emerald:
        "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 border border-emerald-500/40",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2.5 gap-2 h-10",
      lg: "text-base px-6 py-3.5 gap-2.5 h-12",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
