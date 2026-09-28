"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-foreground overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:flex lg:flex-col h-full shrink-0">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-950 z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <Sidebar
              onItemClick={() => setMobileSidebarOpen(false)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header is sticky inside this column */}
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 min-h-full">
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
