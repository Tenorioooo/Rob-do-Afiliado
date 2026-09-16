import React from "react";
import Link from "next/link";
import { MOCK_PLANS } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export function PricingSection() {
  return (
    <section id="planos" className="py-24 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            Planos Transparentes
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Investimento que se Paga no Primeiro Mês
          </p>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Escolha o plano ideal para o tamanho da sua operação e comece a automatizar hoje mesmo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {MOCK_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                plan.popular
                  ? "bg-slate-900/90 border-2 border-primary/80 shadow-2xl shadow-primary/20 -translate-y-2"
                  : "bg-slate-900/40 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-indigo-500 text-white text-xs font-bold shadow-md shadow-primary/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  MAIS POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {plan.badge && !plan.popular && (
                    <Badge variant="purple">{plan.badge}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-xs text-slate-400">R$</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400">/{plan.period}</span>
                </div>

                <div className="space-y-3 pb-8 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    O que está incluído:
                  </span>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link href="/register">
                  <Button
                    variant={plan.popular ? "glow" : "outline"}
                    className="w-full justify-center text-sm py-3"
                  >
                    Começar teste grátis
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Cancele quando quiser • Sem fidelidade
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
