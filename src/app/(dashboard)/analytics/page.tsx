"use client";

import React, { useEffect, useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  PieChart,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  RefreshCw,
  Award,
  Layers,
  Send,
  HelpCircle,
} from "lucide-react";

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "channels" | "copy" | "products" | "learning" | "experiments">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Analytics states
  const [overview, setOverview] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [copyStyles, setCopyStyles] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any>(null);
  const [learningSignals, setLearningSignals] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);

  // A/B Experiment Form modal
  const [showExpModal, setShowExpModal] = useState<boolean>(false);
  const [expName, setExpName] = useState<string>("");
  const [expMetric, setExpMetric] = useState<"CTR" | "CONVERSION_RATE" | "COMMISSION">("CTR");

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        channelsRes,
        copyRes,
        prodRes,
        slotsRes,
        signalsRes,
        expRes,
      ] = await Promise.all([
        fetch(`/api/analytics/overview?days=${days}`).then((r) => r.json()),
        fetch("/api/analytics/channels").then((r) => r.json()),
        fetch("/api/analytics/copy").then((r) => r.json()),
        fetch("/api/analytics/products").then((r) => r.json()),
        fetch("/api/analytics/timeslots").then((r) => r.json()),
        fetch("/api/analytics/learning").then((r) => r.json()),
        fetch("/api/analytics/experiments").then((r) => r.json()),
      ]);

      setOverview(overviewRes);
      setChannels(channelsRes.channels || []);
      setCopyStyles(copyRes);
      setProducts(prodRes.products || []);
      setTimeSlots(slotsRes);
      setLearningSignals(signalsRes.signals || []);
      setExperiments(expRes.experiments || []);
    } catch (err) {
      console.error("Erro ao carregar dados de analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/analytics/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 35 }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadData();
      } else {
        alert(data.error || "Erro ao simular eventos");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    try {
      const res = await fetch("/api/analytics/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: expName,
          targetMetric: expMetric,
          variants: [
            { style: "DESCONTO", trafficWeight: 0.5 },
            { style: "URGENCIA", trafficWeight: 0.5 },
          ],
        }),
      });

      if (res.ok) {
        setShowExpModal(false);
        setExpName("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const summary = overview?.summary;
  const comparison = overview?.comparison;
  const dataSource = overview?.dataSource || "MOCK";

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Inteligência de Conversão & Analytics
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  dataSource === "REAL"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : dataSource === "MIXED"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                DATA SOURCE: {dataSource}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Rastreamento de ponta a ponta com atribuição determinística e aprendizado contínuo para o Autopiloto.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {[
              { label: "Hoje", val: 1 },
              { label: "7 dias", val: 7 },
              { label: "30 dias", val: 30 },
              { label: "90 dias", val: 90 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setDays(p.val)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  days === p.val
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Simulate Events button (Controlled mock) */}
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            title="Gera cliques e conversões simuladas controladas com identificador MOCK para testes locais"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${simulating ? "animate-spin" : ""}`} />
            {simulating ? "Simulando..." : "Simular Tráfego Mock"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "overview", label: "Visão Geral", icon: BarChart3 },
          { id: "channels", label: "Canais", icon: Send },
          { id: "copy", label: "Estilos de Copy", icon: Layers },
          { id: "products", label: "Produtos", icon: Award },
          { id: "learning", label: `Sinais de Aprendizado (${learningSignals.length})`, icon: Sparkles },
          { id: "experiments", label: `Testes A/B (${experiments.length})`, icon: FlaskConical },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Consolidando métricas e sinais de performance...</p>
        </div>
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cliques */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Total de Cliques</span>
                    <MousePointerClick className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-2xl font-black text-white">
                    {formatNumber(summary?.clicks || 0)}
                  </span>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                    {comparison?.clicksDelta !== null && comparison?.clicksDelta !== undefined ? (
                      <span className={`flex items-center font-bold ${comparison.clicksDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {comparison.clicksDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {comparison.clicksDelta > 0 ? `+${comparison.clicksDelta}%` : `${comparison.clicksDelta}%`}
                        <span className="text-slate-500 font-normal ml-1">vs anterior</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">CTR médio: {summary?.ctr || 0}%</span>
                    )}
                  </div>
                </div>

                {/* 2. Conversões */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Conversões Auditadas</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatNumber(summary?.conversions || 0)}
                  </span>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                    {comparison?.conversionsDelta !== null && comparison?.conversionsDelta !== undefined ? (
                      <span className={`flex items-center font-bold ${comparison.conversionsDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {comparison.conversionsDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {comparison.conversionsDelta > 0 ? `+${comparison.conversionsDelta}%` : `${comparison.conversionsDelta}%`}
                        <span className="text-slate-500 font-normal ml-1">vs anterior</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Taxa: {summary?.conversionRate || 0}%</span>
                    )}
                  </div>
                </div>

                {/* 3. Comissão Confirmada */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Comissão Confirmada</span>
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(summary?.confirmedCommission || 0)}
                  </span>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Volume bruto: <strong className="text-slate-200">{formatCurrency(summary?.revenue || 0)}</strong>
                  </div>
                </div>

                {/* 4. Comissão Estimada & Status */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Comissão Estimada (Pendente)</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-2xl font-black text-amber-400">
                    {formatCurrency(summary?.estimatedCommission || 0)}
                  </span>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Canceladas/Estornos: R$ {(summary?.cancelledCommission || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Performance Score & Smart Scheduling Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Score Panel */}
                <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Performance Score Geral
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cálculo determinístico com pesos transparentes e explicáveis.
                      </p>
                    </div>
                    <span className="text-3xl font-black text-white bg-slate-800/80 px-4 py-1.5 rounded-2xl border border-slate-700">
                      {summary?.performanceScore || 0}<span className="text-xs text-slate-400 font-normal">/100</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">CTR (30%)</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{summary?.ctr || 0}%</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Conversão (30%)</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{summary?.conversionRate || 0}%</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Comissão (25%)</span>
                      <span className="text-sm font-bold text-cyan-400 mt-0.5 block">
                        R$ {((summary?.confirmedCommission || 0) + (summary?.estimatedCommission || 0)).toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Confiança (15%)</span>
                      <span className="text-xs font-bold text-indigo-400 mt-0.5 block">{summary?.confidence || "WEAK"}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      O score combina taxas de engajamento e faturamento ponderadas pela significância amostral para impedir que amostras pequenas distorçam decisões.
                    </span>
                  </div>
                </div>

                {/* Smart Scheduling Panel */}
                <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Smart Scheduling (Horários Inteligentes)
                    </h3>
                    <p className="text-xs text-slate-400">
                      {timeSlots?.recommendationReason || "Analisando histórico de horários para o Autopiloto."}
                    </p>
                  </div>

                  {timeSlots?.bestSlot ? (
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-primary font-bold uppercase tracking-wider block">Melhor Horário Detectado</span>
                        <span className="text-xl font-extrabold text-white mt-0.5 block">{timeSlots.bestSlot.hourSlot}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold block">{timeSlots.bestSlot.conversionRate.toFixed(1)}% Conversão</span>
                        <span className="text-slate-400">{timeSlots.bestSlot.clicks} cliques auditados</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Sem dados suficientes por faixa de horário ainda. O sistema utiliza os horários configurados na regra.</span>
                    </div>
                  )}

                  {/* Hourly preview */}
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                    {(timeSlots?.slots || []).slice(8, 20).map((slot: any, idx: number) => {
                      const isHot = slot.clicks > 5 && slot.conversionRate > 3;
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-center border text-[10px] ${
                            isHot
                              ? "bg-primary/20 border-primary text-white font-bold"
                              : "bg-slate-950/60 border-slate-800 text-slate-400"
                          }`}
                          title={`${slot.hourSlot}: ${slot.clicks} cliques, ${slot.conversions} conv`}
                        >
                          <span>{slot.hourSlot.split("–")[0]}</span>
                          <span className="block text-[9px] text-slate-500 mt-0.5">{slot.clicks} clk</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHANNELS */}
          {activeTab === "channels" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Performance por Canal</h3>
                  <p className="text-xs text-slate-400">
                    Avaliação de rentabilidade e conversão real por destino de publicação.
                  </p>
                </div>
              </div>

              {channels.length === 0 ? (
                <div className="p-12 border border-slate-800 rounded-3xl bg-slate-900/40 text-center text-slate-400 text-sm">
                  Nenhum canal conectado ainda. Acesse a Central de Canais para integrar Telegram, WhatsApp ou Discord.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((ch: any) => (
                    <div
                      key={ch.channelId}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
                            {ch.type}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">{ch.name}</h4>
                        </div>
                        <span className="text-lg font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                          {ch.metrics.performanceScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                        <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] text-slate-500 block">Cliques</span>
                          <strong className="text-white mt-0.5 block">{ch.metrics.clicks}</strong>
                        </div>
                        <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] text-slate-500 block">Conversões</span>
                          <strong className="text-emerald-400 mt-0.5 block">{ch.metrics.conversions}</strong>
                        </div>
                        <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] text-slate-500 block">Comissão</span>
                          <strong className="text-cyan-400 mt-0.5 block">
                            R$ {(ch.metrics.confirmedCommission + ch.metrics.estimatedCommission).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Taxa de Conversão: <strong>{ch.metrics.conversionRate}%</strong></span>
                        <span className="text-slate-500">CTR: <strong>{ch.metrics.ctr}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: COPY STYLES */}
          {activeTab === "copy" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Performance por Estilo de Copy</h3>
                <p className="text-xs text-slate-400">
                  Ranking dos estilos de copywriting gerados pela IA baseado em conversões reais auditadas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(copyStyles?.styles || []).map((styleItem: any) => (
                  <div
                    key={styleItem.style}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white uppercase tracking-wider">
                        {styleItem.style}
                      </span>
                      {styleItem.rank ? (
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                          #{styleItem.rank} Ranking
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded-lg">
                          Amostra Pequena
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">Cliques</span>
                        <strong className="text-white mt-0.5 block">{styleItem.metrics.clicks}</strong>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">Conversões</span>
                        <strong className="text-emerald-400 mt-0.5 block">{styleItem.metrics.conversions}</strong>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">Score</span>
                        <strong className="text-primary mt-0.5 block">{styleItem.metrics.performanceScore}/100</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Taxa de Conversão: <strong className="text-slate-200">{styleItem.metrics.conversionRate}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Ranking de Produtos</h3>
                <p className="text-xs text-slate-400">
                  Classificação automatizada: WINNER (acima da média), NEUTRAL e UNDERPERFORMER.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="p-12 border border-slate-800 rounded-3xl bg-slate-900/40 text-center text-slate-400 text-sm">
                  Nenhum produto analisado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p: any) => (
                    <div
                      key={p.productId}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-400 font-semibold uppercase">{p.platform}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">{p.category}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              p.classification === "WINNER"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : p.classification === "UNDERPERFORMER"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {p.classification}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{p.title}</h4>
                        {p.reason && <p className="text-xs text-slate-400">{p.reason}</p>}
                      </div>

                      <div className="flex items-center gap-6 shrink-0 text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Cliques</span>
                          <strong className="text-white">{p.metrics.clicks}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Conversões</span>
                          <strong className="text-emerald-400">{p.metrics.conversions}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Score</span>
                          <strong className="text-primary text-base font-black">{p.metrics.performanceScore}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: LEARNING SIGNALS */}
          {activeTab === "learning" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Sinais de Aprendizado Contínuo
                </h3>
                <p className="text-xs text-slate-400">
                  Estes sinais são derivados de dados estatísticos auditados e alimentam automaticamente o ciclo de decisões do Autopiloto.
                </p>
              </div>

              {learningSignals.length === 0 ? (
                <div className="p-12 border border-slate-800 rounded-3xl bg-slate-900/40 text-center text-slate-400 text-sm space-y-2">
                  <p>Ainda não há eventos suficientes para gerar sinais de aprendizado confiáveis.</p>
                  <p className="text-xs text-slate-500">
                    O sistema requer no mínimo 30 cliques auditados antes de extrair padrões de alta performance.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningSignals.map((sig: any, i: number) => (
                    <div
                      key={sig.id || i}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-bold uppercase tracking-wider">
                          {sig.signalType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            sig.confidence === "STRONG"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : sig.confidence === "RELIABLE"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          Confiança: {sig.confidence}
                        </span>
                      </div>

                      <div className="text-lg font-black text-white">
                        {sig.targetEntity}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sig.reason}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Amostra: {sig.sampleSize} cliques auditados</span>
                        <span>Score: {sig.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPERIMENTS (A/B) */}
          {activeTab === "experiments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    Testes A/B de Copywriting
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare variações de copy sem gerar spam ou exceder os limites dos canais.
                  </p>
                </div>
                <button
                  onClick={() => setShowExpModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  + Novo Teste A/B
                </button>
              </div>

              {experiments.length === 0 ? (
                <div className="p-12 border border-slate-800 rounded-3xl bg-slate-900/40 text-center text-slate-400 text-sm space-y-2">
                  <p>Nenhum teste A/B ativo no momento.</p>
                  <p className="text-xs text-slate-500">
                    Crie um experimento para testar variações como DESCONTO vs URGENCIA de forma balanceada.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {experiments.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{exp.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {exp.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 block">
                            Métrica Alvo: <strong>{exp.targetMetric}</strong> • Limite: {exp.maxExposure} exposições
                          </span>
                        </div>
                        {exp.winningStyle && (
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Vencedor</span>
                            <span className="text-sm font-extrabold text-white">{exp.winningStyle}</span>
                          </div>
                        )}
                      </div>

                      {exp.analysisReason && (
                        <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                          {exp.analysisReason}
                        </p>
                      )}

                      {/* Variants Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                        {exp.variants?.map((v: any) => (
                          <div key={v.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white uppercase">{v.style}</span>
                              <span className="text-slate-500 text-[10px]">Tráfego: {(v.trafficWeight * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Impressões: <strong>{v.impressions}</strong></span>
                              <span>Cliques: <strong>{v.clicks}</strong></span>
                              <span>Conv: <strong className="text-emerald-400">{v.conversions}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: New Experiment */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Criar Novo Teste A/B</h3>
            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome do Experimento</label>
                <input
                  type="text"
                  required
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="Ex: Desconto vs Urgência em Eletrônicos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Métrica de Otimização</label>
                <select
                  value={expMetric}
                  onChange={(e) => setExpMetric(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-primary"
                >
                  <option value="CTR">Taxa de Cliques (CTR)</option>
                  <option value="CONVERSION_RATE">Taxa de Conversão</option>
                  <option value="COMMISSION">Receita de Comissão</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Iniciar Teste A/B
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
