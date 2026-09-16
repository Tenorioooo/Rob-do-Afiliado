import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "purple"
    | "cyan"
    | "outline"
    | "glow"
    | "shopee"
    | "mercadolivre"
    | "amazon"
    | "destructive";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    destructive: "bg-red-500/15 text-red-400 border-red-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    glow: "bg-primary/15 text-primary-300 border-primary/30 shadow-sm shadow-primary/20",
    shopee: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    mercadolivre: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    amazon: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  const sizes = {
    sm: "text-[11px] px-2.5 py-0.5 font-medium",
    md: "text-xs px-3 py-1 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
