import React from "react";
import { Link2, Radar, Sparkles, Send } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Link2,
      title: "Conecte suas Plataformas",
      description: "Vincule suas contas de afiliado (Shopee, Mercado Livre, Amazon) de forma rápida e segura.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      step: "02",
      icon: Radar,
      title: "Radar de Oportunidades",
      description: "O algoritmo rastreia centenas de milhares de produtos e classifica o Opportunity Score em tempo real.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "Criação de Ofertas com IA",
      description: "Nossa IA redige copys de alta conversão, formata preços, destaca cupons e embute seu link de afiliado.",
      color: "from-purple-500 to-pink-500",
    },
    {
      step: "04",
      icon: Send,
      title: "Distribuição e Escala 24/7",
      description: "As ofertas são publicadas automaticamente nos seus grupos do Telegram e WhatsApp nos horários de maior pico.",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            Passo a Passo
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Como o seu Afiliado Virtual Opera
          </p>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Uma esteira 100% automatizada que transforma produtos virais em comissões no seu bolso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} p-0.5 shadow-lg`}>
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-2xl font-black text-slate-800 group-hover:text-slate-700 transition-colors">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
