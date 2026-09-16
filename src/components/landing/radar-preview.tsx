"use client";

import React, { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Flame, Star, ArrowUpRight, Check, Filter } from "lucide-react";
import Link from "next/link";

export function RadarPreviewSection() {
  const [activePlatform, setActivePlatform] = useState<string>("ALL");

  const filtered =
    activePlatform === "ALL"
      ? MOCK_PRODUCTS.slice(0, 3)
      : MOCK_PRODUCTS.filter((p) => p.platform === activePlatform).slice(0, 3);

  return (
    <section id="radar-demo" className="py-24 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
              Demonstração ao Vivo
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Radar de Oportunidades em Ação
            </p>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Veja como o sistema detecta descontos agressivos, calcula comissões e atribui a pontuação do algoritmo.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {["ALL", "SHOPEE", "MERCADO_LIVRE", "AMAZON"].map((plat) => {
              const label =
                plat === "ALL"
                  ? "Todos"
                  : plat === "SHOPEE"
                  ? "Shopee"
                  : plat === "MERCADO_LIVRE"
                  ? "Mercado Livre"
                  : "Amazon";
              return (
                <button
                  key={plat}
                  onClick={() => setActivePlatform(plat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activePlatform === plat
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge
                    variant={
                      item.platform === "SHOPEE"
                        ? "danger"
                        : item.platform === "MERCADO_LIVRE"
                        ? "warning"
                        : "purple"
                    }
                  >
                    {item.platform === "SHOPEE"
                      ? "Shopee"
                      : item.platform === "MERCADO_LIVRE"
                      ? "Mercado Livre"
                      : "Amazon"}
                  </Badge>

                  {/* Opportunity Score Pill */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Score {item.opportunityScore}/100</span>
                  </div>
                </div>

                {/* Product Title */}
                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-3 group-hover:text-primary-300 transition-colors">
                  {item.title}
                </h3>

                {/* Price & Discount block */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 line-through mr-2">
                        {formatCurrency(item.originalPrice)}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(item.currentPrice)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      -{item.discountPercent}%
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Sua Comissão:</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(item.commissionAmount)} ({(item.commissionRate * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Why recommended mini bullets */}
                <div className="space-y-1.5 mb-5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Por que recomendamos:
                  </span>
                  {item.opportunityReasons?.slice(0, 2).map((reason, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/register">
                <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 text-xs">
                  Criar oferta com IA
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/register">
            <Button variant="glow" size="md" className="gap-2">
              Acessar Radar Completo com +150.000 Produtos
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
