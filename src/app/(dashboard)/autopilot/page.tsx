"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Cpu,
  Play,
  Pause,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  History,
  Layers,
  Sparkles,
  Send,
  Radio,
  Eye,
  ArrowRight,
  Info,
  Flame,
  Check,
  SlidersHorizontal,
} from "lucide-react";

export default function AutopilotPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleStep, setCycleStep] = useState<number>(0);
  const [autopilotData, setAutopilotData] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "decisions" | "activity">("overview");
  const [decisionModal, setDecisionModal] = useState<any | null>(null);
  const [cycleResultModal, setCycleResultModal] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/autopilot");
      if (res.ok) {
        const json = await res.json();
        setAutopilotData(json);
        setConfig(json.config);
      }
    } catch (err) {
      console.error("Error fetching autopilot data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAutopilot = async () => {
    if (!config) return;
    const isCurrentlyEnabled = config.enabled;
    const endpoint = isCurrentlyEnabled ? "/api/autopilot/pause" : "/api/autopilot/start";

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setConfig(json.config);
        toast({
          title: !isCurrentlyEnabled ? "Autopiloto Ativado" : "Autopiloto Pausado",
          message: !isCurrentlyEnabled
            ? "O robô executará o ciclo conforme as regras configuradas."
            : "O ciclo automático foi temporariamente pausado.",
          type: !isCurrentlyEnabled ? "success" : "warning",
        });
        fetchData();
      } else {
        throw new Error(json.error || "Erro ao alterar estado");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação";
      toast({ title: "Falha na alteração", message: msg, type: "error" });
    }
  };

  const handleModeChange = async (mode: "MANUAL" | "ASSISTED" | "AUTOPILOT") => {
    if (!config) return;
    try {
      setSavingConfig(true);
      const res = await fetch("/api/autopilot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationMode: mode }),
      });
      const json = await res.json();
      if (res.ok) {
        setConfig(json.config);
        toast({
          title: `Modo Alterado para ${mode}`,
          message:
            mode === "MANUAL"
              ? "Você tem o controle manual total de cada etapa."
              : mode === "ASSISTED"
              ? "O robô busca e prepara ofertas para sua aprovação."
              : "O robô opera de forma autônoma de ponta a ponta.",
          type: "success",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar modo";
      toast({ title: "Erro na configuração", message: msg, type: "error" });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      setSavingConfig(true);
      const res = await fetch("/api/autopilot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanIntervalMinutes: Number(config.scanIntervalMinutes),
          minOpportunityScore: Number(config.minOpportunityScore),
          minCommission: Number(config.minCommission),
          minDiscount: Number(config.minDiscount),
          maxPrice: config.maxPrice ? Number(config.maxPrice) : null,
          maxOffersPerDay: Number(config.maxOffersPerDay),
          maxOpportunitiesPerCycle: Number(config.maxOpportunitiesPerCycle),
          minPublicationInterval: Number(config.minPublicationInterval),
          duplicateCooldownHours: Number(config.duplicateCooldownHours),
          preferredPlatforms: config.preferredPlatforms,
          preferredCategories: config.preferredCategories,
          channelBalancingStrategy: config.channelBalancingStrategy,
          autoGenerateOffers: Boolean(config.autoGenerateOffers),
          autoApproveOffers: Boolean(config.autoApproveOffers),
          autoPublish: Boolean(config.autoPublish),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setConfig(json.config);
        toast({
          title: "Configurações salvas!",
          message: "As preferências do autopiloto foram atualizadas com sucesso.",
          type: "success",
        });
      } else {
        throw new Error(json.error || "Erro ao salvar");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast({ title: "Erro ao salvar configurações", message: msg, type: "error" });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExecuteCycle = async () => {
    setIsRunningCycle(true);
    setCycleStep(1);

    const stepTimer1 = setTimeout(() => setCycleStep(2), 500);
    const stepTimer2 = setTimeout(() => setCycleStep(3), 1100);
    const stepTimer3 = setTimeout(() => setCycleStep(4), 1700);

    try {
      const res = await fetch("/api/autopilot/run", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao executar ciclo");
      }

      setCycleStep(5);
      await fetchData();

      setTimeout(() => {
        setIsRunningCycle(false);
        setCycleStep(0);
        setCycleResultModal(json.summary);
        toast({
          title: "Ciclo Autônomo Concluído!",
          message: `${json.summary?.productsAnalyzed || 0} analisados, ${json.summary?.opportunitiesQualified || 0} qualificadas, ${json.summary?.offersGenerated || 0} ofertas, ${json.summary?.publicationsPublished || 0} publicações.`,
          type: "success",
        });
      }, 700);
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsRunningCycle(false);
      setCycleStep(0);
      const msg = err instanceof Error ? err.message : "Falha na execução do ciclo";
      toast({ title: "Erro no ciclo do Autopiloto", message: msg, type: "error" });
    }
  };

  const togglePlatform = (plat: string) => {
    const current: string[] = config?.preferredPlatforms || [];
    const updated = current.includes(plat)
      ? current.filter((p) => p !== plat)
      : [...current, plat];
    setConfig({ ...config, preferredPlatforms: updated });
  };

  const toggleCategory = (cat: string) => {
    const current: string[] = config?.preferredCategories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setConfig({ ...config, preferredCategories: updated });
  };

  const isAutopilotActive = config?.enabled ?? true;
  const stats = autopilotData?.stats || {
    totalRuns: 0,
    completedRuns: 0,
    successRate: 100,
    productsDiscovered: 0,
    productsAnalyzed: 0,
    opportunitiesCreated: 0,
    opportunitiesQualified: 0,
    offersGenerated: 0,
    offersApproved: 0,
    publicationsQueued: 0,
    publicationsPublished: 0,
  };

  const latestRun = autopilotData?.latestRun;
  const latestDecisions: any[] = latestRun?.decisions ? JSON.parse(latestRun.decisions) : [];
  const recentEvents = autopilotData?.recentEvents || [];

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Autopiloto Inteligente
            </h2>
            <Badge
              variant={isAutopilotActive ? "success" : "warning"}
              size="md"
              className="font-bold px-3 py-1"
            >
              {isAutopilotActive ? "● ROBÔ OPERANDO" : "○ PAUSADO"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Motor autônomo com inteligência de produtos, geração de links, anti-fabricação e publicação contínua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/autopilot/history">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <History className="w-3.5 h-3.5" />
              Histórico de Ciclos
            </Button>
          </Link>

          <Button
            variant="glow"
            size="sm"
            onClick={handleExecuteCycle}
            isLoading={isRunningCycle}
            className="text-xs gap-1.5 font-semibold px-4"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningCycle ? "animate-spin" : ""}`} />
            {isRunningCycle ? "Executando..." : "Executar Ciclo Agora"}
          </Button>

          <Button
            variant={isAutopilotActive ? "outline" : "emerald"}
            size="sm"
            onClick={handleToggleAutopilot}
            className="text-xs gap-1.5 font-semibold"
          >
            {isAutopilotActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutopilotActive ? "Pausar Robô" : "Iniciar Robô"}
          </Button>
        </div>
      </div>

      {/* Autonomous Operational Environment Status */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Operação 24h:</strong> Monitoramento contínuo de oportunidades, links afiliados e canais de distribuição com execução segura.
          </span>
        </div>
        <Badge variant="purple" size="sm">Piloto Ativo</Badge>
      </div>

      {/* Three Autonomous Modes Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            mode: "MANUAL",
            title: "Modo Manual",
            desc: "Você controla cada etapa individualmente (descoberta, links, cópias e envios).",
            color: "slate",
            icon: SlidersHorizontal,
          },
          {
            mode: "ASSISTED",
            title: "Modo Assistido",
            desc: "O robô encontra oportunidades e prepara as ofertas para sua aprovação prévia.",
            color: "indigo",
            icon: Sparkles,
          },
          {
            mode: "AUTOPILOT",
            title: "Modo Autopiloto Total",
            desc: "O robô encontra, prepara, valida e distribui ofertas automaticamente conforme suas regras.",
            color: "emerald",
            icon: Cpu,
          },
        ].map((m) => {
          const isSelected = config?.automationMode === m.mode;
          const Icon = m.icon;
          return (
            <button
              key={m.mode}
              type="button"
              onClick={() => handleModeChange(m.mode as any)}
              disabled={savingConfig}
              className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden ${
                isSelected
                  ? "bg-gradient-to-b from-slate-900 to-slate-950 border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/40"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Ativo
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Selecionar</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{m.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Live Cycle Stepper (Visible during manual cycle run) */}
      {isRunningCycle && (
        <div className="rounded-3xl border border-primary/50 bg-gradient-to-r from-primary/20 via-slate-900/90 to-indigo-950/40 p-6 backdrop-blur-xl shadow-2xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-primary animate-spin" />
              <h3 className="text-sm font-bold text-white">Executando Ciclo Autônomo do Autopiloto...</h3>
            </div>
            <span className="text-xs font-mono text-primary-300">Etapa {cycleStep} de 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${cycleStep >= 1 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>1. Discovery & Snapshots</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${cycleStep >= 2 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>2. Score & Filtro</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${cycleStep >= 3 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>3. Links & Cópias IA</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${cycleStep >= 4 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>4. Safety Gate & Queue</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${cycleStep >= 5 ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>5. Dispatcher & Notificações</span>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Próxima Execução</span>
          <span className="text-sm font-bold text-white flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {config?.nextRunAt ? formatDate(config.nextRunAt).split(" ")[1] : "A cada 30m"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Último Scan</span>
          <span className="text-sm font-bold text-white mt-1">
            {config?.lastRunAt ? formatDate(config.lastRunAt).split(" ")[1] : "Ainda não rodou"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Ciclos Executados</span>
          <span className="text-xl font-bold text-white mt-1">{stats.totalRuns}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Analisados</span>
          <span className="text-xl font-bold text-indigo-400 mt-1">{formatNumber(stats.productsAnalyzed)}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Oportunidades</span>
          <span className="text-xl font-bold text-emerald-400 mt-1">{stats.opportunitiesQualified}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Ofertas Geradas</span>
          <span className="text-xl font-bold text-primary-300 mt-1">{stats.offersGenerated}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Publicações</span>
          <span className="text-xl font-bold text-cyan-400 mt-1">{stats.publicationsPublished}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Taxa de Sucesso</span>
          <span className="text-xl font-bold text-emerald-400 mt-1">{stats.successRate}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Visão Geral & Decisões
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 transition-colors ${
            activeTab === "config"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Configurações do Robô
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-3 transition-colors ${
            activeTab === "activity"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Feed de Atividade do Robô
        </button>
      </div>

      {/* Tab 1: Overview & Recent Decisions */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Decisões do Último Ciclo</h3>
              <p className="text-xs text-slate-400">
                Auditoria transparente de cada produto avaliado pelo robô com critérios explicáveis.
              </p>
            </div>
            {latestDecisions.length > 0 && (
              <span className="text-xs text-slate-400">{latestDecisions.length} itens avaliados</span>
            )}
          </div>

          {latestDecisions.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Nenhum ciclo executado recentemente. Clique em "Executar Ciclo Agora" para iniciar o primeiro processamento.
              </p>
              <Button variant="glow" size="sm" onClick={handleExecuteCycle}>
                Executar Primeiro Ciclo
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Produto</th>
                      <th className="px-4 py-3.5">Plataforma</th>
                      <th className="px-4 py-3.5 text-center">Score</th>
                      <th className="px-4 py-3.5">Sinal de Preço</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {latestDecisions.map((dec, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-white max-w-xs truncate">
                          {dec.productTitle}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="purple">{dec.platform}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full border ${
                              dec.score >= 80
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {dec.score}/100
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {dec.priceSignal?.signal === "PRICE_DROP" ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Queda ({dec.priceSignal.percentChange}%)
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Estável</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={dec.isQualified ? "success" : "danger"}>
                            {dec.isQualified ? "Qualificado" : "Rejeitado"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDecisionModal(dec)}
                            className="text-xs h-7 px-2.5 gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver Decisão
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Visual Configuration Form */}
      {activeTab === "config" && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Marketplace Platforms & Categories */}
            <div className="space-y-6">
              {/* Platforms */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <h4 className="text-sm font-bold text-white">Plataformas Monitoradas</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "SHOPEE", label: "Shopee" },
                    { id: "MERCADO_LIVRE", label: "Mercado Livre" },
                    { id: "AMAZON", label: "Amazon" },
                  ].map((plat) => {
                    const isChecked = (config?.preferredPlatforms || []).includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{plat.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <h4 className="text-sm font-bold text-white">Categorias Preferenciais</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Eletrônicos",
                    "Casa e Cozinha",
                    "Beleza",
                    "Moda",
                    "Informática",
                    "Games",
                  ].map((cat) => {
                    const isChecked = (config?.preferredCategories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-indigo-500/20 border-indigo-500 text-white"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{cat}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Thresholds, Strategy & Pacing */}
            <div className="space-y-6">
              {/* Quality & Score Thresholds */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <h4 className="text-sm font-bold text-white">Qualidade & Filtros Determinísticos</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Score Mínimo (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={config?.minOpportunityScore ?? 80}
                      onChange={(e) => setConfig({ ...config, minOpportunityScore: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Comissão Mínima (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={config?.minCommission ?? 5}
                      onChange={(e) => setConfig({ ...config, minCommission: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Desconto Mínimo (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={config?.minDiscount ?? 10}
                      onChange={(e) => setConfig({ ...config, minDiscount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Preço Máximo (R$)</label>
                    <input
                      type="number"
                      min={0}
                      value={config?.maxPrice ?? 500}
                      onChange={(e) => setConfig({ ...config, maxPrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Execution Pacing & Cooldown */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <h4 className="text-sm font-bold text-white">Pacing & Balanceamento</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Limite Diário de Ofertas</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config?.maxOffersPerDay ?? 20}
                      onChange={(e) => setConfig({ ...config, maxOffersPerDay: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Max Oportunidades por Ciclo</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={config?.maxOpportunitiesPerCycle ?? 10}
                      onChange={(e) => setConfig({ ...config, maxOpportunitiesPerCycle: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Intervalo Mínimo (Minutos)</label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={config?.minPublicationInterval ?? 15}
                      onChange={(e) => setConfig({ ...config, minPublicationInterval: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Cooldown de Produto (Horas)</label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={config?.duplicateCooldownHours ?? 24}
                      onChange={(e) => setConfig({ ...config, duplicateCooldownHours: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs">
                  <label className="block text-slate-400 mb-1 font-medium">Estratégia de Balanceamento de Canais</label>
                  <select
                    value={config?.channelBalancingStrategy ?? "ALL"}
                    onChange={(e) => setConfig({ ...config, channelBalancingStrategy: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ALL">Publicar em Todos os Canais Ativos (ALL)</option>
                    <option value="ROUND_ROBIN">Alternância Circular (ROUND ROBIN)</option>
                    <option value="PRIORITY">Prioridade Determinística (TELEGRAM &gt; WHATSAPP &gt; DISCORD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="submit"
              variant="glow"
              size="md"
              isLoading={savingConfig}
              className="px-6 font-semibold text-xs"
            >
              Salvar Preferências do Autopiloto
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Robot Activity Log */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Registro de Atividades Recentes</h3>
          <p className="text-xs text-slate-400">
            Linha do tempo de todas as decisões e operações executadas pelo operador autônomo.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum evento do autopiloto registrado ainda.
              </div>
            ) : (
              recentEvents.map((ev: any) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] shrink-0">
                    {formatDate(ev.createdAt).split(" ")[1] || ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{ev.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{ev.description}</p>
                  </div>
                  <Badge variant={ev.status === "SUCCESS" ? "success" : ev.status === "WARNING" ? "warning" : "default"}>
                    {ev.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* "Por que o robô fez isso?" Decision Audit Modal */}
      {decisionModal && (
        <Modal
          isOpen={!!decisionModal}
          onClose={() => setDecisionModal(null)}
          title="Por que o robô tomou esta decisão?"
          description={`Auditoria determinística para: ${decisionModal.productTitle}`}
        >
          <div className="space-y-4 text-xs">
            {/* Score & Verdict Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-slate-900 to-indigo-950/50 border border-primary/30 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Pontuação Calculada</span>
                <span className="text-xl font-extrabold text-emerald-400">{decisionModal.score} / 100</span>
              </div>
              <Badge variant={decisionModal.isQualified ? "success" : "danger"} size="md">
                {decisionModal.isQualified ? "✓ Oportunidade Qualificada" : "✕ Rejeitada pelos Filtros"}
              </Badge>
            </div>

            {/* Price Signal Info */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-semibold text-white block mb-1">Sinal de Preço & Snapshots</span>
              <p className="text-slate-400">
                Preço Atual: <strong>{formatCurrency(decisionModal.currentPrice)}</strong>.{" "}
                {decisionModal.priceSignal?.previousPrice && (
                  <span>
                    Snapshot anterior: {formatCurrency(decisionModal.priceSignal.previousPrice)} (
                    {decisionModal.priceSignal.percentChange > 0 ? "+" : ""}
                    {decisionModal.priceSignal.percentChange}%)
                  </span>
                )}
              </p>
            </div>

            {/* Criteria Passed */}
            {decisionModal.qualificationReasons?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-emerald-400 block">Critérios Atendidos:</span>
                <ul className="space-y-1 text-slate-300">
                  {decisionModal.qualificationReasons.map((r: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Criteria Failed */}
            {decisionModal.rejectionReasons?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-rose-400 block">Motivos de Rejeição:</span>
                <ul className="space-y-1 text-slate-300">
                  {decisionModal.rejectionReasons.map((r: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safety Gate Verification */}
            {decisionModal.offerGenerated && (
              <div className="pt-2 border-t border-slate-800">
                <span className="font-semibold text-white block mb-1">Portão de Segurança (Safety Gate):</span>
                <p className="text-slate-400">
                  Validação Anti-Fabricação:{" "}
                  <strong className="text-emerald-400">{decisionModal.offerValidationStatus || "VALID"}</strong>.
                  {decisionModal.approved ? " Oferta auto-aprovada." : " Aguardando aprovação manual."}
                </p>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDecisionModal(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cycle Execution Summary Modal */}
      {cycleResultModal && (
        <Modal
          isOpen={!!cycleResultModal}
          onClose={() => setCycleResultModal(null)}
          title="Resumo da Execução do Ciclo"
          description="O robô finalizou o ciclo autônomo com sucesso."
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Produtos Analisados</span>
                <span className="text-base font-bold text-white">{cycleResultModal.productsAnalyzed}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Oportunidades Qualificadas</span>
                <span className="text-base font-bold text-emerald-400">{cycleResultModal.opportunitiesQualified}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ofertas Geradas</span>
                <span className="text-base font-bold text-primary-300">{cycleResultModal.offersGenerated}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Publicações Disparadas</span>
                <span className="text-base font-bold text-cyan-400">{cycleResultModal.publicationsPublished}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setCycleResultModal(null)}>
                Fechar
              </Button>
              <Link href="/radar" onClick={() => setCycleResultModal(null)}>
                <Button variant="glow" size="sm" className="gap-1 font-semibold">
                  <span>Ver Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
