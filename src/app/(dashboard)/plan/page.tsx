"use client";

import React from "react";
import { MOCK_PLANS, MOCK_USER } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  CreditCard,
  History,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function PlanPage() {
  const { toast } = useToast();

  const handlePlanAction = (planName: string) => {
    toast({
      title: `Plano ${planName}`,
      message: "Estrutura pronta para conectar ao gateway de pagamento (Stripe / Asaas / Hotmart) na próxima etapa.",
      type: "info",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Meu Plano & Assinatura</h2>
            <Badge variant="purple" size="md">Plano PRO Ativo</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie sua assinatura, limites de uso mensal e histórico de faturamento.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Renovação automática ativa</span>
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
              <Badge variant="default">R$ 197 / mês</Badge>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">Plano PRO</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Acesso total ao robô autônomo, geração neural de copy sem limites e canais ilimitados de distribuição.
            </p>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Varredura contínua 24h em Shopee, Mercado Livre e Amazon</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Canais ilimitados de Telegram e WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Opportunity Score e Inteligência de Horários</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Próxima fatura: 14/10/2026</span>
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

        {/* Monthly Resource Usage Meter */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Uso dos Recursos este Mês</h3>
            <p className="text-xs text-slate-400">Consumo da sua cota mensal de automação.</p>
          </div>

          <div className="space-y-5">
            {/* Meter 1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Produtos Analisados</span>
                <span className="text-emerald-400 font-bold">42.600 / Ilimitado</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full w-[45%]" />
              </div>
            </div>

            {/* Meter 2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Cópias de IA Geradas</span>
                <span className="text-primary font-bold">840 / Ilimitado</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-primary h-full w-[35%]" />
              </div>
            </div>

            {/* Meter 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Canais Conectados</span>
                <span className="text-cyan-400 font-bold">4 canais ativos</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-cyan-400 h-full w-[25%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans Upgrade Grid */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold text-white">Opções de Upgrade & Planos</h3>
          <p className="text-xs text-slate-400">Altere seu plano a qualquer momento sem perder seus dados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 border flex flex-col justify-between ${
                plan.code === "PRO"
                  ? "border-primary/60 bg-slate-900/90 shadow-xl"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white">{plan.name}</h4>
                  {plan.code === "PRO" && <Badge variant="success">Plano Atual</Badge>}
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
                  variant={plan.code === "PRO" ? "outline" : "glow"}
                  size="sm"
                  onClick={() => handlePlanAction(plan.name)}
                  className="w-full justify-center text-xs"
                >
                  {plan.code === "PRO" ? "Plano Atual" : `Mudar para ${plan.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
