import React from "react";
import {
  Brain,
  Gauge,
  Layers,
  Network,
  Lock,
  LineChart,
  Bot,
  Zap,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Gauge,
      title: "Opportunity Score 0-100",
      description: "Algoritmo exclusivo que calcula desconto, margem, tendência e sentimento de avaliação para você postar apenas o que converte.",
    },
    {
      icon: Brain,
      title: "Copywriting com IA Persuasiva",
      description: "Modelos ajustados para gerar urgência, escassez e gatilhos de compra específicos para grupos de ofertas.",
    },
    {
      icon: Network,
      title: "Multi-Marketplace Integrado",
      description: "Conecte Shopee, Mercado Livre, Amazon e amplie seu catálogo em um único painel centralizado.",
    },
    {
      icon: Layers,
      title: "Canais Telegram & WhatsApp",
      description: "Envios programados ou instantâneos em grupos e canais com formatação nativa e botões interativos.",
    },
    {
      icon: LineChart,
      title: "Analytics e Mapas de Calor",
      description: "Descubra com precisão quais horários e nichos geram mais cliques e conversões para a sua audiência.",
    },
    {
      icon: Lock,
      title: "Segurança & Alta Disponibilidade",
      description: "Criptografia de credenciais, links protegidos e infraestrutura escalável preparada para milhares de disparos diários.",
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-slate-950/40 border-t border-slate-800/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            Recursos Poderosos
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Tudo o que Você Precisa para Escalar
          </p>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Uma suíte completa de automação desenvolvida especificamente para afiliados de alta performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="p-7 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-primary/40 hover:bg-slate-900/90 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-400 mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
