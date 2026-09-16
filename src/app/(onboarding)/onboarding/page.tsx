"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Sliders,
  Send,
  Zap,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Selected onboarding states
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "SHOPEE",
    "MERCADO_LIVRE",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Eletrônicos",
    "Casa e Cozinha",
  ]);
  const [minScore, setMinScore] = useState(80);
  const [minDiscount, setMinDiscount] = useState(20);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["TELEGRAM"]);
  const [isActivating, setIsActivating] = useState(false);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsActivating(true);
    toast({
      title: "Robô ativado com sucesso!",
      message: "Seu operador virtual está pronto e monitorando novas oportunidades.",
      type: "success",
    });

    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  const handleSkip = () => {
    toast({
      title: "Onboarding finalizado",
      message: "Você pode ajustar suas preferências a qualquer momento em Configurações.",
      type: "info",
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Top Bar with Logo & Progress */}
      <div className="container mx-auto max-w-3xl flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold text-white text-base">{BRAND.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Passo <strong className="text-white">{currentStep}</strong> de {totalSteps}
          </span>
          <button
            onClick={handleSkip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
          >
            Pular configuração
          </button>
        </div>
      </div>

      {/* Main Step Container */}
      <div className="container mx-auto max-w-2xl py-8">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-8">
          <div
            className="bg-gradient-to-r from-primary to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-primary/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Bem-vindo ao {BRAND.name}!
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  Vamos configurar seu operador virtual em menos de 2 minutos para que ele comece a rastrear e gerar ofertas de alta conversão para você.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-primary font-bold text-sm mb-1">1. Radar 24/7</div>
                  <p className="text-[11px] text-slate-400">Varredura automática contínua em marketplaces.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-emerald-400 font-bold text-sm mb-1">2. IA Neural</div>
                  <p className="text-[11px] text-slate-400">Copys persuasivas criadas instantaneamente.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-amber-400 font-bold text-sm mb-1">3. Distribuição</div>
                  <p className="text-[11px] text-slate-400">Postagem em seus canais de transmissão.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MARKETPLACES */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Escolha as Plataformas de Afiliado
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione onde o robô deve garimpar as melhores ofertas promocionais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { id: "SHOPEE", name: "Shopee", desc: "Comissões de até 14% e cupons diários" },
                  { id: "MERCADO_LIVRE", name: "Mercado Livre", desc: "Envio FULL e ofertas relâmpago" },
                  { id: "AMAZON", name: "Amazon", desc: "Líder em eletrônicos e livros com Prime" },
                  { id: "MAGALU", name: "Magazine Luiza", desc: "Grande catálogo nacional (Opcional)" },
                ].map((item) => {
                  const isSelected = selectedPlatforms.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => togglePlatform(item.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CATEGORIES */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Nichos & Categorias de Interesse
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Quais segmentos têm mais aderência com o seu público?
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {[
                  "Eletrônicos & Tech",
                  "Casa e Cozinha",
                  "Moda Masculina",
                  "Moda Feminina",
                  "Beleza & Cuidados",
                  "Smartphones & Acessórios",
                  "Gamer & Informática",
                  "Ferramentas & Construção",
                  "Bebês & Brinquedos",
                  "Livros & Papelaria",
                ].map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {cat} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PREFERENCES */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Filtros de Qualidade & Score
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Defina os critérios mínimos para uma oferta ser qualificada pelo robô.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">Opportunity Score Mínimo</span>
                    <span className="text-primary font-bold">{minScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-primary bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recomendado: 80+ para garantir apenas ofertas com altíssima tração.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">Desconto Mínimo no Produto</span>
                    <span className="text-emerald-400 font-bold">{minDiscount}% OFF</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CHANNELS */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Canais de Distribuição
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Onde você deseja que as ofertas formatadas sejam publicadas?
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: "TELEGRAM", name: "Telegram (Canais & Grupos)", desc: "Envio instantâneo via Bot sem risco de bloqueio" },
                  { id: "WHATSAPP", name: "WhatsApp (Grupos de Ofertas)", desc: "Alta taxa de abertura e engajamento imediato" },
                  { id: "DISCORD", name: "Discord Server", desc: "Comunidades de tecnologia e games" },
                ].map((ch) => {
                  const isSelected = selectedChannels.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{ch.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{ch.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary border-primary text-white" : "border-slate-700"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: READY */}
          {currentStep === 6 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-950/50 animate-bounce">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Seu operador virtual está pronto!
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  A configuração inicial foi concluída. Ao clicar abaixo, o robô iniciará a indexação dos marketplaces selecionados.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plataformas:</span>
                  <span className="text-white font-medium">{selectedPlatforms.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Score de corte:</span>
                  <span className="text-primary font-medium">{minScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Canais conectados:</span>
                  <span className="text-emerald-400 font-medium">{selectedChannels.join(", ")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            <Button
              variant={currentStep === totalSteps ? "emerald" : "glow"}
              size="md"
              onClick={handleNext}
              isLoading={isActivating}
              className="gap-2 text-xs sm:text-sm px-6 font-semibold"
            >
              {currentStep === totalSteps ? "Ativar Meu Robô e Ir ao Painel" : "Continuar"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} {BRAND.name} • Automação Inteligente de Afiliados
      </div>
    </div>
  );
}
