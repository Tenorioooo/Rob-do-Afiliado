"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Flame,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowUpRight,
  Layers,
  MousePointerClick,
  DollarSign,
  Clock,
  Info,
  Activity,
  Link2,
  Radio,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = data?.stats || {
    totalOpportunities: 0,
    qualifiedOpportunities: 0,
    avgScore: 0,
    maxScore: 0,
    totalScansCount: 0,
    totalProductsAnalyzed: 0,
    lastScanAt: null,
    totalLinks: 0,
    totalOffers: 0,
    approvedOffers: 0,
    queuedOffers: 0,
    activeChannelsCount: 0,
    activeRulesCount: 0,
    publicationsToday: 0,
    totalPublications: 0,
    successfulPublications: 0,
    failedPublications: 0,
    successRate: 100,
  };

  const topOpportunities = data?.topOpportunities || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Centro de Controle de Oportunidades & Automação
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Seu operador virtual está conectado, gerando ofertas e distribuindo nos canais conectados 24/7.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>Inteligência & Dispatcher Ativos (Mock)</span>
        </div>
      </div>

      {/* Main Robot Command Center Card */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 p-0.5 shadow-lg shadow-primary/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
                <Bot className="w-7 h-7 text-primary-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white">Meu Robô de Afiliados</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operando normalmente
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.lastScanAt
                  ? `Última varredura realizada em ${formatDate(stats.lastScanAt)}.`
                  : "Nenhuma varredura executada ainda. Execute sua primeira análise."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/robot">
              <Button variant="outline" size="sm" className="text-xs">
                Ajustes do Robô
              </Button>
            </Link>
            <Link href="/automation">
              <Button variant="glow" size="sm" className="gap-1.5 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                Regras de Automação
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Produtos Analisados</span>
            <span className="text-2xl font-bold text-white">
              {isLoading ? "..." : formatNumber(stats.totalProductsAnalyzed || 0)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Oportunidades Qualificadas</span>
            <span className="text-2xl font-bold text-indigo-400">
              {isLoading ? "..." : stats.qualifiedOpportunities}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Score Médio</span>
            <span className="text-2xl font-bold text-emerald-400">
              {isLoading ? "..." : `${stats.avgScore}/100`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">Taxa de Sucesso no Disparo</span>
            <span className="text-2xl font-bold text-cyan-400">
              {isLoading ? "..." : `${stats.successRate ?? 100}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Phase 4 KPI Grid: Channels, Automation, Publications, and Offers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/channels" className="group">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md group-hover:border-primary/50 transition-all h-full">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Canais Conectados</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeChannelsCount || 0}</div>
            <div className="text-[11px] text-cyan-400 mt-2 flex items-center justify-between">
              <span>Canais operacionais ativos</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link href="/automation" className="group">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md group-hover:border-purple-500/50 transition-all h-full">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Regras de Automação</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-300">{stats.activeRulesCount || 0}</div>
            <div className="text-[11px] text-purple-400 mt-2 flex items-center justify-between">
              <span>Filtros automáticos ativos</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link href="/publications" className="group">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md group-hover:border-emerald-500/50 transition-all h-full">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Publicações Hoje</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.publicationsToday || 0}</div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center justify-between">
              <span>{stats.totalPublications || 0} total no histórico</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        <Link href="/offers" className="group">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md group-hover:border-indigo-500/50 transition-all h-full">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Ofertas Geradas com IA</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalOffers || 0}</div>
            <div className="text-[11px] text-primary-300 mt-2 flex items-center justify-between">
              <span>{stats.approvedOffers || 0} aprovadas / {stats.queuedOffers || 0} na fila</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      </div>

      {/* Top Opportunities from DB Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Principais Oportunidades do Radar</h3>
            <p className="text-xs text-slate-400">Itens reais salvos no banco com maior pontuação calculada.</p>
          </div>
          <Link href="/radar">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary-300">
              Ver todas no Radar
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {topOpportunities.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Seu robô ainda não realizou nenhuma análise ou nenhuma oportunidade foi qualificada.
            </p>
            <Link href="/robot">
              <Button variant="glow" size="sm" className="text-xs">
                Executar Primeira Análise Agora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Produto</th>
                    <th className="px-4 py-3.5">Plataforma</th>
                    <th className="px-4 py-3.5 text-center">Score</th>
                    <th className="px-4 py-3.5">Comissão Est.</th>
                    <th className="px-4 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {topOpportunities.map((opp: any) => (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={opp.imageUrl}
                            alt={opp.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0 max-w-[220px] sm:max-w-md">
                            <p className="font-semibold text-white truncate">{opp.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {formatCurrency(opp.currentPrice)}{" "}
                              {opp.discountPercent > 0 && (
                                <span className="text-emerald-400 font-medium">(-{opp.discountPercent}%)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            opp.platform === "SHOPEE"
                              ? "danger"
                              : opp.platform === "MERCADO_LIVRE"
                              ? "warning"
                              : "purple"
                          }
                        >
                          {opp.platform}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {opp.score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-white">
                          {formatCurrency(opp.commissionAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/radar/${opp.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-3">
                            Ver Raio-X
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
