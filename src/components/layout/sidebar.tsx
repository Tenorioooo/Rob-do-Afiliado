"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND, NAVIGATION_ITEMS } from "@/lib/constants/brand";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Bot,
  Radar,
  Link2,
  Radio,
  BarChart3,
  Settings,
  Sparkles,
  Zap,
  Send,
  Cpu,
  Layers,
  LogOut,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { MOCK_USER, MOCK_ADMIN_USER } from "@/lib/mock";
import { useToast } from "@/components/ui/toast";

const ICON_MAP = {
  LayoutDashboard,
  Cpu,
  Bot,
  Radar,
  Link2,
  Radio,
  Layers,
  BarChart3,
  Settings,
  Sparkles,
  Zap,
  Send,
};

interface SidebarProps {
  onItemClick?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ onItemClick, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({
        title: "Sessão encerrada",
        message: "Você saiu com segurança da plataforma.",
        type: "info",
      });
      router.push("/login");
      router.refresh();
    } catch (e) {
      router.push("/login");
    }
  };

  const user = isAdmin ? MOCK_ADMIN_USER : MOCK_USER;

  return (
    <aside className="w-64 flex flex-col justify-between border-r border-slate-800/80 bg-slate-950 text-slate-300 h-full select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white">{BRAND.name}</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                  PRO
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Menu Principal
          </div>

          {NAVIGATION_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary-300 border border-primary/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin link if user is admin */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-800/80">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
                Administração
              </div>
              <Link
                href="/admin"
                onClick={onItemClick}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Painel Admin</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* User Profile & Quick Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-300 shrink-0 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Plano {user.plan}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
