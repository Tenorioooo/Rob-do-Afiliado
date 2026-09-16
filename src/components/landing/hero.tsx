"use client";

import React from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Bot,
  Flame,
  CheckCircle2,
} from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Glowing Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-brand-cyan/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Innovation Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary-200 text-xs font-medium mb-8 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-3.5 h-3.5 text-primary-300 animate-pulse" />
          <span>Motor de Inteligência Artificial para Afiliados 2.0</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold">Online 24/7</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          {BRAND.tagline.split("trabalhando")[0]}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
            trabalhando 24 horas por dia.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          {BRAND.description}
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="glow" size="lg" className="w-full sm:w-auto text-base gap-2 px-8">
              Começar agora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#como-funciona" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base text-slate-200">
              Conhecer a plataforma
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sem necessidade de cartão para testar</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Configuração em menos de 3 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>{BRAND.stats.activeUsers} afiliados ativos</span>
          </div>
        </div>

        {/* Live Interactive Robot Dashboard Mockup */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-700/50 via-slate-800/20 to-transparent shadow-2xl shadow-indigo-950/50 border border-slate-700/60">
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-6 text-left overflow-hidden backdrop-blur-2xl">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  Motor de Automação: <span className="text-emerald-400">ATIVO & MONITORANDO</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Plataformas ativas:</span>
                <Badge variant="default" size="sm">Shopee</Badge>
                <Badge variant="warning" size="sm">Mercado Livre</Badge>
                <Badge variant="purple" size="sm">Amazon</Badge>
              </div>
            </div>

            {/* Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {/* Card 1 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Produtos analisados hoje</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">1.420</div>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↑ +340 produtos</span> nas últimas 2 horas
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Oportunidades em Alta</span>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-white">24 itens</div>
                <p className="text-[11px] text-indigo-400 mt-1">Opportunity Score médio: 94/100</p>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Comissões Estimadas</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">R$ 3.842,60</div>
                <p className="text-[11px] text-slate-400 mt-1">Estimativa com base em 126 disparos</p>
              </div>
            </div>

            {/* Highlight Opportunity Ticker */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-primary/15 via-indigo-900/20 to-slate-900/40 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Oferta Viral Detectada</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Score 97/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Fone Bluetooth TWS Pro Max (Shopee) — 55% OFF — Comissão R$ 12,58
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 hidden sm:inline">Copy gerada por IA ✓</span>
                <span className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-md shadow-primary/30">
                  Publicado no Telegram
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
