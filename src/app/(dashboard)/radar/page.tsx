"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  Radar,
  Search,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
  ExternalLink,
} from "lucide-react";

interface OpportunityItem {
  id: string;
  productId: string;
  score: number;
  confidence: string;
  dataCompleteness: number;
  status: string;
  detectedAt: string;
  reasons: string[];
  product: {
    id: string;
    externalId: string;
    platform: string;
    title: string;
    description: string;
    category: string;
    subcategory: string | null;
    brand: string | null;
    imageUrl: string;
    currentPrice: number;
    originalPrice: number;
    currency: string;
    discountPercent: number;
    commissionRate: number;
    commissionAmount: number;
    rating: number | null;
    reviewCount: number | null;
    salesCount: number;
    trendScore: number | null;
    url: string;
    inStock: boolean;
    dataSource: string;
  };
}

export default function RadarPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [minScore, setMinScore] = useState(70);
  const [sortBy, setSortBy] = useState("score_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "9",
        platform: platformFilter,
        category: categoryFilter,
        minScore: minScore.toString(),
        sortBy,
      });

      if (search.trim()) {
        params.set("query", search.trim());
      }

      const res = await fetch(`/api/radar?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setOpportunities(data.opportunities || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, platformFilter, categoryFilter, minScore, sortBy, search]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Radar de Produtos</h2>
            <Badge variant="purple" size="md">IA Scoring 2.0</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Descubra oportunidades qualificadas com alta margem e potencial de conversão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radar em Tempo Real</span>
          </div>

          <Link href="/robot">
            <Button variant="glow" size="sm" className="gap-1.5 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Executar Novo Scan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="lg:col-span-2">
            <Input
              type="text"
              placeholder="Buscar por produto, nicho ou marca..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Platform Selector */}
          <div>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="ALL">Todas as Plataformas</option>
              <option value="SHOPEE">Shopee</option>
              <option value="MERCADO_LIVRE">Mercado Livre</option>
              <option value="AMAZON">Amazon</option>
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Casa e Cozinha">Casa e Cozinha</option>
              <option value="Moda">Moda</option>
              <option value="Beleza">Beleza & Saúde</option>
              <option value="Gamer">Gamer</option>
              <option value="Informática">Informática</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-11 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="score_desc">Maior Score</option>
              <option value="commission_desc">Maior Comissão</option>
              <option value="discount_desc">Maior Desconto</option>
              <option value="rating_desc">Melhor Avaliação</option>
              <option value="recent_desc">Mais Recentes</option>
              <option value="price_asc">Menor Preço</option>
            </select>
          </div>
        </div>

        {/* Range Slider for Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3 w-full sm:max-w-md">
            <span className="text-slate-400 font-medium shrink-0">Opportunity Score Mínimo:</span>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setPage(1);
              }}
              className="w-full accent-primary bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-bold text-emerald-400 shrink-0">{minScore} / 100</span>
          </div>

          <div className="text-slate-400">
            Encontradas: <strong className="text-white">{totalCount}</strong> oportunidades no banco
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Nenhuma oportunidade encontrada no Radar"
          description="Ajuste os filtros ou execute uma nova análise do robô para garimpar novas oportunidades nos marketplaces."
          actionLabel="Executar Análise Agora"
          onAction={() => {
            window.location.href = "/robot";
          }}
          secondaryActionLabel="Limpar Filtros"
          onSecondaryAction={() => {
            setSearch("");
            setPlatformFilter("ALL");
            setCategoryFilter("ALL");
            setMinScore(50);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const p = opp.product;
            const isHighScore = opp.score >= 85;

            return (
              <div
                key={opp.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between transition-all group shadow-xl ${
                  isHighScore
                    ? "border-primary/40 bg-gradient-to-b from-slate-900/90 to-indigo-950/20"
                    : "border-slate-800 bg-slate-900/70"
                }`}
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative rounded-2xl overflow-hidden mb-4 bg-slate-950 aspect-video border border-slate-800/80">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge
                        variant={
                          p.platform === "SHOPEE"
                            ? "danger"
                            : p.platform === "MERCADO_LIVRE"
                            ? "warning"
                            : "purple"
                        }
                      >
                        {p.platform === "MERCADO_LIVRE" ? "Mercado Livre" : p.platform}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold backdrop-blur-md">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{opp.score}/100</span>
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-primary-400 uppercase tracking-wider">
                      {p.category} {p.subcategory && `• ${p.subcategory}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Confiança: <strong className="text-emerald-400">{opp.confidence}</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 mb-3 group-hover:text-primary-300 transition-colors">
                    {p.title}
                  </h3>

                  {/* Price & Commission Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        {p.originalPrice > p.currentPrice && (
                          <span className="text-[11px] text-slate-500 line-through mr-2">
                            {formatCurrency(p.originalPrice)}
                          </span>
                        )}
                        <span className="text-lg font-extrabold text-white">
                          {formatCurrency(p.currentPrice)}
                        </span>
                      </div>
                      {p.discountPercent > 0 && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          -{p.discountPercent}%
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Comissão Estimada:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(p.commissionAmount)} ({(p.commissionRate * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Why recommended mini bullets */}
                  <div className="space-y-1.5 mb-4">
                    {opp.reasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center gap-2">
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      title="Ver Link Original"
                    >
                      <Button variant="outline" size="sm" className="px-3 text-xs gap-1.5 border-slate-800 hover:border-slate-700 text-slate-300">
                        <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
                        <span className="hidden sm:inline">Original</span>
                      </Button>
                    </a>
                  )}
                  <Link href={`/radar/${opp.id}`} className="flex-1">
                    <Button variant="glow" size="sm" className="w-full justify-center gap-1.5 text-xs font-semibold">
                      <span>Ver Raio-X & Breakdown</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <span className="text-xs text-slate-400">
            Página <strong className="text-white">{page}</strong> de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="text-xs gap-1"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
