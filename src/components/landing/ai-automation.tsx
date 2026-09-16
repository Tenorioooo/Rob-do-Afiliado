"use client";

import React, { useState } from "react";
import { Sparkles, Bot, Check, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIAutomationSection() {
  const [copied, setCopied] = useState(false);

  const sampleCopy = `🚨 *ACHADINHO RELÂMPAGO DO DIA!* 🚨

🔥 *Fone Bluetooth TWS Pro Max com Cancelamento de Ruído*

De: ~R$ 199,90~
💥 *Por apenas:* *R$ 89,90* (55% OFF)
⭐ Avaliação 4.9/5 com mais de 4.300 vendidos!

🚚 *Frete Grátis disponível + Cupom ativo na loja*

🛒 *LINK PROMOCIONAL EXCLUSIVO:*
https://affiliateai.app/l/shp-tws-pro

_Corre que esse preço é por tempo limitado!_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 bg-slate-950/60 border-t border-slate-800/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerador Neural de Ofertas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              A IA que transforma links frios em cópias irresistíveis de compra.
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Chega de postar apenas links sem contexto. Nosso modelo analisa os principais benefícios do produto, estrutura os gatilhos mentais de escassez e formata a mensagem com formatação ideal para Telegram e WhatsApp.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Gatilhos de Urgência Personalizados</h4>
                  <p className="text-xs text-slate-400">Destaca cupons, estoque limitado e frete grátis automaticamente.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Links com UTMs Rastreadas</h4>
                  <p className="text-xs text-slate-400">Identifique com precisão de qual grupo e canal veio cada conversão.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Publicação com 1 Clique ou 100% Automática</h4>
                  <p className="text-xs text-slate-400">Você escolhe se deseja aprovar antes ou deixar o robô postar sozinho.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Code/Copy Box Preview */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">gerador-oferta-ia.ts</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {sampleCopy}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <span className="text-emerald-400 font-medium">Pronto para disparo</span></span>
              <span className="flex items-center gap-1 text-primary-300">
                <Send className="w-3.5 h-3.5" /> Enviado para Telegram & WhatsApp
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
