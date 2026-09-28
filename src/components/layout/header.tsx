"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Bell,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  Radio,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  linkUrl: string | null;
  createdAt: string;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [autopilotStatus, setAutopilotStatus] = useState<{
    enabled: boolean;
    mode: string;
  }>({ enabled: true, mode: "AUTOPILOT" });

  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchAutopilotStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/autopilot");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setAutopilotStatus({
            enabled: data.config.enabled,
            mode: data.config.automationMode,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchAutopilotStatus();
  }, [fetchNotifications, fetchAutopilotStatus, pathname]);

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  // Get readable breadcrumb from pathname
  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/autopilot/history")) return "Histórico do Autopiloto";
    if (path.startsWith("/autopilot")) return "Autopiloto";
    if (path.startsWith("/robot")) return "Meu Robô";
    if (path.startsWith("/radar")) return "Radar";
    if (path.startsWith("/offers")) return "Ofertas & IA";
    if (path.startsWith("/channels")) return "Canais";
    if (path.startsWith("/integrations") || path.startsWith("/connections")) return "Integrações";
    if (path.startsWith("/automation")) return "Automação";
    if (path.startsWith("/publications")) return "Publicações";
    if (path.startsWith("/links")) return "Meus Links";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/plan")) return "Meu Plano";
    if (path.startsWith("/settings")) return "Configurações";
    if (path.startsWith("/admin")) return "Admin";
    return "Affiliate AI";
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-none">
            {getPageTitle(pathname)}
          </h1>
        </div>
      </div>

      {/* Right: Autopilot Live Status, Notifications & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Autopilot Heartbeat Badge — hidden on very small screens */}
        <Link
          href="/autopilot"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-primary/50 transition-colors"
        >
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              autopilotStatus.enabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
            Autopiloto:{" "}
            <span
              className={`font-semibold ${
                autopilotStatus.enabled ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {autopilotStatus.enabled ? "ATIVO" : "PAUSADO"}
            </span>
          </span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-800 transition-colors relative"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown — full-width on mobile */}
          {notificationsOpen && (
            <>
              {/* Mobile full-screen overlay backdrop */}
              <div
                className="fixed inset-0 z-40 sm:hidden"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[calc(3.5rem+0.5rem)] sm:top-auto sm:mt-2 w-auto sm:w-80 md:w-96 rounded-2xl border border-slate-800 bg-slate-950/98 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Notificações do Robô</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Marcar lidas
                      </button>
                    )}
                    <Badge variant="default" size="sm">
                      {unreadCount} novas
                    </Badge>
                    {/* Close button visible on mobile */}
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="sm:hidden p-1 text-slate-400 hover:text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-900 text-xs mt-2 max-h-72 sm:max-h-80 overflow-y-auto space-y-2 overscroll-contain">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      Nenhuma notificação recente.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`pt-2.5 pb-1 ${!n.read ? "bg-primary/5 rounded-xl px-2" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`font-semibold flex items-center gap-1.5 ${
                              n.type === "OPPORTUNITY"
                                ? "text-emerald-400"
                                : n.type === "SUCCESS"
                                ? "text-indigo-400"
                                : n.type === "WARNING"
                                ? "text-amber-400"
                                : "text-slate-200"
                            }`}
                          >
                            {n.type === "OPPORTUNITY" ? (
                              <Zap className="w-3.5 h-3.5 shrink-0" />
                            ) : n.type === "SUCCESS" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{n.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 shrink-0 ml-1">
                            {formatDate(n.createdAt).split(" ")[1] || ""}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">{n.message}</p>
                        {n.linkUrl && (
                          <Link
                            href={n.linkUrl}
                            onClick={() => setNotificationsOpen(false)}
                            className="text-[10px] text-primary hover:text-primary-300 mt-1 inline-flex items-center gap-1 font-medium"
                          >
                            <span>Ver detalhes</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Launch Autopilot */}
        <Link href="/autopilot">
          <Button variant="glow" size="sm" className="hidden sm:inline-flex gap-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autopiloto</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
