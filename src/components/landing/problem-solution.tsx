import React from "react";
import { XCircle, CheckCircle2, Clock, Zap, Target, Repeat } from "lucide-react";

export function ProblemSolutionSection() {
  return (
    <section className="py-20 bg-slate-950/50 border-t border-b border-slate-800/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            Comparativo de Eficiência
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Afiliado Manual vs. Afiliado com IA 24/7
          </p>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Descubra por que quem opera manualmente perde mais de 80% das melhores ofertas relâmpago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* The Old / Manual Way */}
          <div className="p-8 rounded-3xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-900/40 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Operação Manual</h3>
                <p className="text-xs text-rose-400">Lenta, exaustiva e com baixa conversão</p>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Passa horas rolando feeds de marketplaces procurando promoções.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Gera links um por um manualmente em plataformas diferentes.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Textos de copy genéricos sem apelo persuasivo ou gatilhos mentais.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Perde cupons e descontos da madrugada quando está dormindo.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>Sem métricas reais de quais horários e produtos mais convertem.</span>
              </li>
            </ul>
          </div>

          {/* The Autonomous / AI Way */}
          <div className="p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-slate-900/60 to-slate-900/40 backdrop-blur-md shadow-xl shadow-emerald-950/20 relative">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 shadow-md">
              O FUTURO DO AFILIADO
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Com o Affiliate AI</h3>
                <p className="text-xs text-emerald-400">Autônomo, inteligente e escalável</p>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Varredura automática e contínua em Shopee, Mercado Livre e Amazon.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cálculo instantâneo de Opportunity Score baseado em margem e tendência.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Links de afiliados gerados e tagueados automaticamente em milissegundos.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cópias hipnóticas geradas por IA prontas para disparar em seus canais.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Seu operador virtual vende 24h por dia, inclusive enquanto você descansa.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
