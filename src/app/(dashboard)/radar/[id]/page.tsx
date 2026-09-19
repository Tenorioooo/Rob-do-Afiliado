"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Flame,
  Star,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Copy,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  Info,
  Clock,
  Activity,
  Layers,
  Link2,
  ThumbsUp,
  RefreshCw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { OfferStyle, ChannelPreviewType, OfferQueuePriority } from "@/domain/offers/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Link Generation State
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // AI Offer Generation Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<OfferStyle>("DESCONTO");
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [activeVariant, setActiveVariant] = useState<any | null>(null);
  const [previewChannel, setPreviewChannel] = useState<ChannelPreviewType>("TELEGRAM");
  const [savedOffer, setSavedOffer] = useState<any | null>(null);
  const [copiedOfferText, setCopiedOfferText] = useState(false);

  // Queue Modal State
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queuePriority, setQueuePriority] = useState<OfferQueuePriority>("NORMAL");
  const [isEnqueuing, setIsEnqueuing] = useState(false);

  useEffect(() => {
    async function loadOpportunity() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/radar/${params.id}`);
        const json = await res.json();
        if (res.ok) {
          setData(json.opportunity);
          if (json.affiliateLink) {
            setAffiliateLink(json.affiliateLink);
          }
        }
      } catch (err) {
        console.error("Error loading opportunity details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOpportunity();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-5 aspect-square rounded-3xl" />
          <Skeleton className="lg:col-span-7 h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">Oportunidade não encontrada.</p>
        <Link href="/radar">
          <Button variant="outline">Voltar ao Radar</Button>
        </Link>
      </div>
    );
  }

  const p = data.product;
  const breakdown = data.scoreBreakdown || {};

  // 1. Generate Affiliate Link Action
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await fetch("/api/affiliate-links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: p.id,
          opportunityId: data.id.startsWith("preview-") ? undefined : data.id,
          platform: p.platform,
          originalUrl: p.url,
          customCampaign: "radar_single_deal",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao gerar link");

      setAffiliateLink(json.link);
      toast({
        title: "Link de Afiliado Gerado!",
        message: `Link encurtado e tagueado com UTMs gerado com sucesso!`,
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na geração do link";
      toast({ title: "Erro", message: msg, type: "error" });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyAffiliateLink = () => {
    const targetUrl = affiliateLink?.affiliateUrl || p.url;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    toast({
      title: "Link de Afiliado Copiado!",
      message: "URL copiada para a área de transferência.",
      type: "success",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 2. AI Offer Generation Action
  const handleOpenOfferGenerator = async () => {
    setIsOfferModalOpen(true);
    if (generatedVariants.length === 0) {
      await handleGenerateOffer(selectedStyle);
    }
  };

  const handleGenerateOffer = async (style: OfferStyle) => {
    setIsGeneratingOffer(true);
    try {
      const res = await fetch("/api/offers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: p.id,
          opportunityId: data.id.startsWith("preview-") ? undefined : data.id,
          affiliateLinkId: affiliateLink?.id,
          preferredStyle: style,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao gerar oferta");

      setGeneratedVariants(json.variants || []);
      setActiveVariant(json.selectedVariant || json.variants[0]);
      setSavedOffer(json.offer);
      setSelectedStyle(style);

      toast({
        title: "Oferta Gerada com Sucesso!",
        message: "Copy criada com IA e validada contra regras anti-fabricação.",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na geração da oferta";
      toast({ title: "Erro ao gerar oferta", message: msg, type: "error" });
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  const handleCopyOfferText = () => {
    if (!activeVariant) return;
    const linkUrl = affiliateLink?.affiliateUrl || p.url;
    const fullText = `${activeVariant.title}\n\n${activeVariant.body}\n\n${activeVariant.cta}\n${linkUrl}`;
    navigator.clipboard.writeText(fullText);
    setCopiedOfferText(true);
    toast({
      title: "Oferta Completa Copiada!",
      message: "Texto formatado com link copiado.",
      type: "success",
    });
    setTimeout(() => setCopiedOfferText(false), 2000);
  };

  // 3. Queue Action
  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savedOffer) {
      toast({
        title: "Gere a oferta primeiro",
        message: "É necessário gerar a oferta com IA antes de enfileirar.",
        type: "warning",
      });
      return;
    }

    setIsEnqueuing(true);
    try {
      const res = await fetch("/api/offer-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: savedOffer.id,
          priority: queuePriority,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao adicionar à fila");

      toast({
        title: "Oferta Adicionada à Fila!",
        message: `Enfileirada com prioridade ${queuePriority}.`,
        type: "success",
      });
      setIsQueueModalOpen(false);
      setIsOfferModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enfileirar";
      toast({ title: "Erro ao enfileirar", message: msg, type: "error" });
    } finally {
      setIsEnqueuing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/radar"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Radar de Oportunidades
        </Link>

        <div className="flex items-center gap-2">
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs gap-1.5 font-medium border-slate-800 hover:border-slate-700 text-slate-300">
                <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
                <span>Ver Link Original</span>
              </Button>
            </a>
          )}
          <Badge
            variant={
              p.platform === "SHOPEE"
                ? "shopee"
                : p.platform === "MERCADO_LIVRE"
                ? "mercadolivre"
                : "amazon"
            }
          >
            {p.platform === "MERCADO_LIVRE" ? "Mercado Livre" : p.platform.replace("_", " ")}
          </Badge>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Produto Real
          </span>
        </div>
      </div>

      {/* Main Showcase Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Product Image & Fast Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <Badge variant="glow" size="md">
                  ⭐ Score {data.score}
                </Badge>
                {p.discountPercent > 0 && (
                  <Badge variant="danger" size="md">
                    -{p.discountPercent}% OFF
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  variant={affiliateLink ? "emerald" : "glow"}
                  size="sm"
                  onClick={affiliateLink ? handleCopyAffiliateLink : handleGenerateLink}
                  isLoading={isGeneratingLink}
                  className="text-xs gap-1.5 font-semibold"
                >
                  {affiliateLink ? (
                    <>
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? "Link Copiado!" : "Copiar Link Afiliado"}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Gerar Link Afiliado
                    </>
                  )}
                </Button>

                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 font-semibold border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
                      Ver Link Original
                    </Button>
                  </a>
                )}
              </div>

              <Button
                variant="glow"
                size="sm"
                onClick={handleOpenOfferGenerator}
                className="w-full text-xs gap-1.5 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-200" />
                Gerar Oferta com IA & Validador
              </Button>
            </div>

            {/* If affiliateLink exists, show dedicated affiliate card */}
            {affiliateLink && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Link de Afiliado Ativo
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    disabled={isGeneratingLink}
                    className="text-[10px] text-slate-400 hover:text-emerald-300 underline transition-colors cursor-pointer"
                  >
                    Regerar Link
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={affiliateLink.affiliateUrl}
                    className="w-full bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2.5 py-1.5 font-mono select-all focus:outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAffiliateLink}
                    className="shrink-0 h-8 px-2.5 text-xs"
                    title="Copiar Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <a
                    href={affiliateLink.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-8 px-2 text-xs text-slate-400 hover:text-white"
                      title="Abrir Link de Afiliado"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Product Info & Analysis */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {p.category} {p.brand ? `• ${p.brand}` : ""}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">
                {p.title}
              </h1>
              {p.description && (
                <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-3">
                  {p.description}
                </p>
              )}
            </div>

            {/* Score Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-slate-900 to-indigo-950/30 border border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                    Opportunity Score Real
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {data.score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Nível de Confiança:</span>
                <span className="text-xs font-bold text-emerald-400">{data.confidence}</span>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Preço Promocional</span>
                <span className="text-base sm:text-lg font-bold text-white">
                  {formatCurrency(p.currentPrice)}
                </span>
                {p.discountPercent > 0 && (
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    -{p.discountPercent}% OFF
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Comissão Estimada</span>
                <span className="text-base sm:text-lg font-bold text-emerald-400">
                  {formatCurrency(p.commissionAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Taxa {(p.commissionRate * 100).toFixed(0)}%
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Índice de Demanda</span>
                <span className="text-base sm:text-lg font-bold text-indigo-400">
                  {p.trendScore !== null ? `${p.trendScore}/100` : "Indisponível"}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {p.trendScore !== null ? "Tendência alta" : "Não fornecido"}
                </span>
              </div>
            </div>

            {/* Why Recommended Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Por que o robô recomendou este produto?
              </h4>
              <div className="space-y-2">
                {data.reasons.map((reason: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-white">Breakdown do Opportunity Score</h3>
            <p className="text-xs text-slate-400">
              Pontuação transparente e proporcional com base nos critérios de análise.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { key: "trend", label: "Tendência & Demanda", maxWeight: 25 },
              { key: "discount", label: "Profundidade do Desconto", maxWeight: 20 },
              { key: "commission", label: "Rentabilidade da Comissão", maxWeight: 20 },
              { key: "ratingReviews", label: "Avaliações & Reputação", maxWeight: 15 },
              { key: "priceAttractiveness", label: "Atratividade do Preço", maxWeight: 10 },
              { key: "freshness", label: "Frescor da Oportunidade", maxWeight: 10 },
            ].map((item) => {
              const comp = breakdown[item.key];
              const scoreVal = comp ? comp.score : 0;
              const isAvailable = comp ? comp.dataAvailable : false;
              const points = comp ? comp.weightedScore : 0;

              return (
                <div key={item.key} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.label}</span>
                      {!isAvailable && (
                        <span className="text-[10px] text-amber-400 font-medium">(Dado não fornecido)</span>
                      )}
                    </div>
                    <span className="font-mono text-slate-300">
                      {isAvailable ? `${points} pts (Peso ${comp.effectiveWeight}%)` : "0 pts"}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAvailable ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-slate-800"
                      }`}
                      style={{ width: `${isAvailable ? scoreVal : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white">Ações de Automação</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Plataforma:</span>
                  <span className="text-white font-semibold">{p.platform.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Completude dos Dados:</span>
                  <span className="text-emerald-400 font-bold">
                    {(data.dataCompleteness * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 items-center">
                  <span>Link Original:</span>
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Abrir Loja <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Indisponível</span>
                  )}
                </div>
                <div className="flex justify-between text-slate-400 items-center">
                  <span>Status do Link:</span>
                  <span className={affiliateLink ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                    {affiliateLink ? "✅ Ativo (" + affiliateLink.shortCode + ")" : "Não gerado ainda"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant={affiliateLink ? "emerald" : "glow"}
                  size="md"
                  onClick={affiliateLink ? handleCopyAffiliateLink : handleGenerateLink}
                  isLoading={isGeneratingLink}
                  className="w-full justify-center gap-2 text-xs font-semibold"
                >
                  {affiliateLink ? (
                    <>
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? "Link de Afiliado Copiado!" : "Copiar Link de Afiliado"}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Gerar Link de Afiliado
                    </>
                  )}
                </Button>

                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" size="md" className="w-full justify-center gap-2 text-xs font-semibold border-slate-800 hover:border-slate-700">
                      <ExternalLink className="w-4 h-4 text-primary-400" />
                      Ver Link Original do Produto
                    </Button>
                  </a>
                )}

                <Button
                  variant="glow"
                  size="md"
                  onClick={handleOpenOfferGenerator}
                  className="w-full justify-center gap-2 text-xs font-semibold"
                >
                  <Sparkles className="w-4 h-4 text-primary-200" />
                  Gerar Oferta com IA & Validador
                </Button>

                <Link href="/offers" className="block w-full">
                  <Button variant="ghost" size="md" className="w-full justify-center gap-2 text-xs text-slate-400 hover:text-white">
                    Ver Todas as Minhas Ofertas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Offer Generator Modal */}
      {isOfferModalOpen && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          title="Gerador de Ofertas com IA & Validação Anti-Fabricação"
          size="lg"
        >
          <div className="space-y-6">
            {/* Style Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Escolha o Estilo de Copy da Oferta:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(["DESCONTO", "DIRETO", "URGENCIA", "PREMIUM", "CURTO"] as OfferStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(style);
                      const found = generatedVariants.find((v) => v.style === style);
                      if (found) setActiveVariant(found);
                      else handleGenerateOffer(style);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedStyle === style
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {isGeneratingOffer ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Analisando produto e gerando copy com IA...</p>
                <p className="text-[11px] text-slate-500">Executando regras anti-fabricação contra dados do banco.</p>
              </div>
            ) : activeVariant ? (
              <div className="space-y-4">
                {/* Channel Selector */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewChannel("TELEGRAM")}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                      previewChannel === "TELEGRAM" ? "bg-cyan-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Telegram
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewChannel("WHATSAPP")}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                      previewChannel === "WHATSAPP" ? "bg-emerald-600 text-white" : "text-slate-400"
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewChannel("DISCORD")}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                      previewChannel === "DISCORD" ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Discord
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewChannel("GENERIC")}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                      previewChannel === "GENERIC" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    Texto
                  </button>
                </div>

                {/* Simulated Copy Preview Box */}
                <div
                  className={`rounded-2xl p-4 border text-xs whitespace-pre-line leading-relaxed ${
                    previewChannel === "WHATSAPP"
                      ? "bg-[#0b141a] border-[#222d34] text-[#e9edef]"
                      : previewChannel === "TELEGRAM"
                      ? "bg-[#182533] border-[#2b3b4b] text-[#f5f5f5]"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="font-bold text-sm mb-2 text-primary-300">{activeVariant.title}</div>
                  <div className="mb-3">{activeVariant.body}</div>
                  <div className="font-semibold text-emerald-400 mb-1">{activeVariant.cta}</div>
                  <div className="font-mono text-[11px] text-cyan-400 break-all underline">
                    {affiliateLink?.affiliateUrl || p.url}
                  </div>
                </div>

                {/* Anti-Fabrication Checklist */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Validador Anti-Fabricação:</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {activeVariant.validationStatus === "VALID" ? "VALIDADO COM SUCESSO" : activeVariant.validationStatus}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {activeVariant.claimsVerified?.map((claim: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>{claim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOfferText}
                className="text-xs gap-1.5"
              >
                {copiedOfferText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedOfferText ? "Copiado!" : "Copiar Copy Formatada"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsQueueModalOpen(true)}
                  className="text-xs gap-1.5 font-semibold"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Adicionar à Fila de Ofertas
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add To Queue Modal */}
      {isQueueModalOpen && (
        <Modal
          isOpen={isQueueModalOpen}
          onClose={() => setIsQueueModalOpen(false)}
          title="Adicionar Oferta à Fila de Distribuição"
          size="md"
        >
          <form onSubmit={handleEnqueue} className="space-y-4">
            <p className="text-xs text-slate-400">
              Selecione o nível de prioridade para a oferta na fila persistente do banco de dados.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Prioridade na Fila:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "NORMAL", "HIGH", "URGENT"] as OfferQueuePriority[]).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setQueuePriority(pri)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      queuePriority === pri
                        ? "bg-primary/20 border-primary text-white shadow-md shadow-primary/20"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {pri === "LOW" ? "Baixa" : pri === "NORMAL" ? "Normal" : pri === "HIGH" ? "Alta" : "Urgente"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
              ℹ️ A oferta será enfileirada no banco com prioridade {queuePriority} e ficará pronta para o despacho autônomo.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsQueueModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="glow" size="sm" isLoading={isEnqueuing} className="font-semibold text-xs">
                Confirmar e Enfileirar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
