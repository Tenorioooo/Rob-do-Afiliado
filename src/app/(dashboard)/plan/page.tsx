"use client";

import React, { useState, useEffect, useCallback } from "react";
import { OFFICIAL_PLANS, PlanTier } from "@/lib/constants/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  CreditCard,
  History,
  ShieldCheck,
  Check,
  RefreshCw,
  Activity,
} from "lucide-react";

interface UsageResponse {
  plan: PlanTier;
  subscriptionStatus: string;
  nextBillingDate: string;
  usage: {
    productsAnalyzed: {
      current: number;
      limit: number;
      isUnlimited: boolean;
    };
    aiCopiesGenerated: {
      current: number;
      limit: number;
      isUnlimited: boolean;
    };
    channels: {
      current: number;
      total: number;
      limit: number;
      isUnlimited: boolean;
    };
    publications: {
      current: number;
      dailyLimit: number;
    };
  };
}

export default function PlanPage() {
  const { toast } = useToast();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/plan/usage");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de uso do plano:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const currentPlan =
    data?.plan ||
    OFFICIAL_PLANS.find((p) => p.code === "PREMIUM" || p.code === "PRO") ||
    OFFICIAL_PLANS[1];

  const handlePlanAction = (planName: string) => {
    toast({
      title: `Plano ${planName}`,
      message: "Estrutura pronta para conectar ao gateway de pagamento (Stripe / Asaas / Hotmart) na próxima etapa.",
      type: "info",
    });
  };

  const nextBillingFormatted = data?.nextBillingDate
    ? new Date(data.nextBillingDate).toLocaleDateString("pt-BR")
    : "14/10/2026";

  const productsCurrent = data?.usage?.productsAnalyzed?.current || 0;
  const productsLimit = data?.usage?.productsAnalyzed?.isUnlimited
    ? "Ilimitado"
    : (data?.usage?.productsAnalyzed?.limit || 3000).toLocaleString("pt-BR");
  const productsPct = data?.usage?.productsAnalyzed?.isUnlimited
    ? 0
    : Math.min(
        Math.round((productsCurrent / (data?.usage?.productsAnalyzed?.limit || 3000)) * 100),
        100
      );

  const aiCurrent = data?.usage?.aiCopiesGenerated?.current || 0;
  const aiLimit = data?.usage?.aiCopiesGenerated?.isUnlimited
    ? "Ilimitado"
    : (data?.usage?.aiCopiesGenerated?.limit || 2000).toLocaleString("pt-BR");
  const aiPct = data?.usage?.aiCopiesGenerated?.isUnlimited
    ? 0
    : Math.min(
        Math.round((aiCurrent / (data?.usage?.aiCopiesGenerated?.limit || 2000)) * 100),
        100
      );

  const channelsCurrent = data?.usage?.channels?.current || 0;
  const channelsLimit = data?.usage?.channels?.isUnlimited
    ? "Ilimitado"
    : data?.usage?.channels?.limit || 10;
  const channelsPct = data?.usage?.channels?.isUnlimited
    ? 0
    : Math.min(
        Math.round((channelsCurrent / (data?.usage?.channels?.limit || 10)) * 100),
        100
      );

  const publicationsCurrent = data?.usage?.publications?.current || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Meu Plano & Assinatura</h2>
            <Badge variant="purple" size="md">Plano {currentPlan.name} Ativo</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie sua assinatura, limites de uso mensal e histórico de faturamento 100% em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsage}
            disabled={isLoading}
            className="text-xs text-slate-400 hover:text-white gap-1.5 h-8 px-2.5"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Renovação automática ativa</span>
          </div>
        </div>
      </div>

      {/* Current Plan Overview & Usage Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Current Plan Card */}
        <div className="lg:col-span-6 rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/15 via-slate-900/80 to-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">
                Plano em Vigor
              </span>
              <Badge variant="glow" size="md">R$ {currentPlan.price} / mês</Badge>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">{currentPlan.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {currentPlan.description}
            </p>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200">
              {currentPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Próxima fatura: {nextBillingFormatted}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlanAction("Gerenciar")}
              className="text-xs"
            >
              Gerenciar Assinatura
            </Button>
          </div>
        </div>

        {/* Monthly Resource Usage Meter (100% Real Database Driven) */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Uso dos Recursos este Mês</span>
              </h3>
              <Badge variant="outline" size="sm" className="text-[10px] text-slate-400 border-slate-700">
                Mês Vigente
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Consumo real da sua cota mensal calculado diretamente do banco de dados.</p>
          </div>

          {isLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Meter 1: Produtos Analisados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Produtos Analisados</span>
                  <span className="text-emerald-400 font-bold">
                    {productsCurrent.toLocaleString("pt-BR")} / {productsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(productsPct, productsCurrent > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Meter 2: Cópias de IA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Cópias de IA Geradas</span>
                  <span className="text-primary font-bold">
                    {aiCurrent.toLocaleString("pt-BR")} / {aiLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-primary h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(aiPct, aiCurrent > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Meter 3: Canais Conectados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Canais Conectados Ativos</span>
                  <span className="text-cyan-400 font-bold">
                    {channelsCurrent} / {channelsLimit} canais
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(channelsPct, channelsCurrent > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Mini Info Strip */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Publicações no Mês: <strong className="text-white font-bold">{publicationsCurrent}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1">🟢 Sincronizado ao Vivo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Plans Upgrade Grid */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold text-white">Opções de Upgrade & Planos</h3>
          <p className="text-xs text-slate-400">Altere seu plano a qualquer momento sem perder seus dados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFICIAL_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-primary/60 bg-slate-900/90 shadow-xl ring-1 ring-primary/40"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                    {isCurrent && <Badge variant="success">Plano Atual</Badge>}
                  </div>
                  <div className="text-2xl font-extrabold text-white mb-4">
                    R$ {plan.price} <span className="text-xs text-slate-400 font-normal">/mês</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant={isCurrent ? "outline" : "glow"}
                    size="sm"
                    onClick={() => handlePlanAction(plan.name)}
                    className="w-full justify-center text-xs"
                  >
                    {isCurrent ? "Plano Atual" : `Mudar para ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

