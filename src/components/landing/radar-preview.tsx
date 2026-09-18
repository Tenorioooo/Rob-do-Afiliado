"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Flame, Star, ArrowUpRight, Check, Filter } from "lucide-react";
import Link from "next/link";

const FEATURED_SHOWCASE_PRODUCTS = [
  {
    id: "feat-ml-01",
    title: "Smartwatch Amazfit GTS 4 Mini Alexa 120+ Modos Esportivos",
    platform: "MERCADO_LIVRE",
    originalPrice: 699.0,
    currentPrice: 429.9,
    discountPercent: 38,
    commissionRate: 0.08,
    commissionAmount: 34.39,
    opportunityScore: 94,
    opportunityReasons: ["Desconto de 38% com selo Full", "Alta taxa de conversão no nicho de tecnologia"],
  },
  {
    id: "feat-shopee-01",
    title: "Fone de Ouvido Bluetooth TWS Cancelamento de Ruído Ativo",
    platform: "SHOPEE",
    originalPrice: 199.9,
    currentPrice: 89.9,
    discountPercent: 55,
    commissionRate: 0.14,
    commissionAmount: 12.58,
    opportunityScore: 91,
    opportunityReasons: ["Cupom oficial acumulativo", "Mais de 10.000 avaliações 5 estrelas"],
  },
  {
    id: "feat-amz-01",
    title: "Fritadeira Sem Óleo Air Fryer Digital 4L Antiaderente",
    platform: "AMAZON",
    originalPrice: 459.9,
    currentPrice: 289.0,
    discountPercent: 37,
    commissionRate: 0.09,
    commissionAmount: 26.01,
    opportunityScore: 96,
    opportunityReasons: ["Frete Grátis Prime com entrega em 24h", "Preço mais baixo dos últimos 90 dias"],
  },
];

export function RadarPreviewSection() {
  const [activePlatform, setActivePlatform] = useState<string>("ALL");

  const filtered =
    activePlatform === "ALL"
      ? FEATURED_SHOWCASE_PRODUCTS
      : FEATURED_SHOWCASE_PRODUCTS.filter((p) => p.platform === activePlatform);

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
