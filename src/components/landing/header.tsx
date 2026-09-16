"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Menu, X, ArrowRight } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">{BRAND.name}</span>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                PRO
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#como-funciona" className="hover:text-white transition-colors">
            Como Funciona
          </a>
          <a href="#recursos" className="hover:text-white transition-colors">
            Recursos
          </a>
          <a href="#radar-demo" className="hover:text-white transition-colors">
            Radar IA
          </a>
          <a href="#planos" className="hover:text-white transition-colors">
            Planos
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="glow" size="sm" className="gap-1.5">
              Começar agora
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-5 backdrop-blur-xl animate-in slide-in-from-top-3">
          <div className="flex flex-col gap-4 text-sm font-medium text-slate-300">
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Como Funciona
            </a>
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Recursos
            </a>
            <a
              href="#radar-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Radar IA
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Planos
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">
              FAQ
            </a>
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Entrar na conta
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="glow" className="w-full justify-center">
                  Criar conta gratuita
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
