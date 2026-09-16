"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Preciso ter conhecimento técnico em programação para usar?",
      a: "Não! A plataforma foi criada para ser 100% intuitiva e visual. Basta conectar suas contas através de nosso passo a passo e o robô iniciará as buscas e criações automaticamente.",
    },
    {
      q: "Como o Opportunity Score funciona?",
      a: "Nosso algoritmo pondera 5 fatores cruciais: percentual de desconto, valor líquido da comissão, volume recente de buscas, histórico de avaliação do produto e reputação da loja parceira. Apenas notas altas recebem recomendação de postagem.",
    },
    {
      q: "Quais marketplaces são suportados?",
      a: "A plataforma possui contratos e suporte arquitetural para Shopee, Mercado Livre, Amazon, Magazine Luiza e AliExpress.",
    },
    {
      q: "Posso aprovar as ofertas antes de serem publicadas?",
      a: "Sim. Você tem controle total: pode deixar o robô no modo 'Autônomo' para publicar diretamente ou no modo 'Revisão', onde você confere cada oferta com 1 clique.",
    },
    {
      q: "Existe risco de bloqueio nos canais de Telegram ou WhatsApp?",
      a: "Nossa infraestrutura respeita rigorosamente os limites e intervalos seguros de postagem recomendados pelas plataformas para garantir a integridade e longevidade dos seus grupos.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-950/50 border-t border-slate-800/80">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            Dúvidas Frequentes
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Perguntas & Respostas
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-primary-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
