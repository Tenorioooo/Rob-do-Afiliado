"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderLogo } from "@/components/ui/provider-logo";
import {
  Link2,
  Copy,
  ExternalLink,
  Plus,
  BarChart2,
  Check,
  Search,
  Sparkles,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Tag,
  Globe,
} from "lucide-react";

interface AffiliateLinkRecord {
  id: string;
  userId: string;
  productId: string | null;
  platform: string;
  shortCode: string;
  originalUrl: string;
  affiliateUrl: string;
  status: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  clicks: number;
  conversions: number;
  estimatedEarnings: number;
  active: boolean;
  generatedAt: string;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    imageUrl: string;
    currentPrice: number;
    platform: string;
  } | null;
}

export default function LinksPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<AffiliateLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Link Modal State
  const [newLinkModal, setNewLinkModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [platformInput, setPlatformInput] = useState("SHOPEE");
  const [campaignInput, setCampaignInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "ALL") params.set("platform", platformFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/affiliate-links?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error("Error fetching affiliate links:", err);
    } finally {
      setIsLoading(false);
    }
  }, [platformFilter, search]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "Link copiado!",
      message: "Link de afiliado copiado para a área de transferência.",
      type: "success",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast({
        title: "Atenção",
        message: "Por favor, insira a URL do produto.",
        type: "warning",
      });
      return;
    }
    setIsCreating(true);

    try {
      const res = await fetch("/api/affiliate-links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "custom-url",
          platform: platformInput,
          originalUrl: urlInput.trim(),
          customCampaign: campaignInput.trim() || "manual_link",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Erro ao gerar link",
          message: data.error || "Não foi possível gerar o link de afiliado.",
          type: "error",
        });
      } else {
        toast({
          title: "Link Gerado com Sucesso!",
          message: `Código ${data.link?.shortCode || ""} criado com rastreamento ativo.`,
          type: "success",
        });
        setNewLinkModal(false);
        setUrlInput("");
        setCampaignInput("");
        fetchLinks();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar link";
      toast({ title: "Erro", message: msg, type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  // Metrics
  const totalLinks = links.length;
  const totalClicks = links.reduce((acc, l) => acc + l.clicks, 0);
  const totalEarnings = links.reduce((acc, l) => acc + l.estimatedEarnings, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Meus Links</h2>
            <Badge variant="glow" size="md">Rastreamento UTM Ativo</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie e acompanhe todos os links de afiliados gerados pelo robô e pelo radar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setNewLinkModal(true)}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Link</span>
          </Button>

          <Link href="/radar">
            <Button variant="glow" size="sm" className="gap-2 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Radar de Ofertas</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Links Criados</span>
            <div className="text-2xl font-black text-white">{totalLinks}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Cliques Registrados</span>
            <div className="text-2xl font-black text-white">{totalClicks}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Comissão Estimada</span>
            <div className="text-2xl font-black text-emerald-400">{formatCurrency(totalEarnings)}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: "ALL", label: "Todas as Lojas" },
            { id: "SHOPEE", label: "Shopee" },
            { id: "MERCADO_LIVRE", label: "Mercado Livre" },
            { id: "AMAZON", label: "Amazon" },
          ].map((plat) => (
            <button
              key={plat.id}
              onClick={() => setPlatformFilter(plat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                platformFilter === plat.id
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              {plat.id !== "ALL" && <ProviderLogo provider={plat.id} size="xs" />}
              <span>{plat.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código ou campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Links List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/30 p-8 space-y-4">
          <Link2 className="w-10 h-10 text-primary-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">Nenhum link de afiliado gerado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Crie um link personalizado colando a URL do produto ou acesse o Radar de Ofertas para garimpar oportunidades.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setNewLinkModal(true)}>
              Criar Link Personalizado
            </Button>
            <Link href="/radar">
              <Button variant="glow" size="sm">
                Ir para o Radar de Ofertas
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {link.product?.imageUrl ? (
                  <img
                    src={link.product.imageUrl}
                    alt={link.product.title}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    <ProviderLogo provider={link.platform} size="md" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                      <ProviderLogo provider={link.platform} size="xs" />
                      <span className="text-[11px] font-bold text-slate-200">
                        {link.platform === "MERCADO_LIVRE"
                          ? "Mercado Livre"
                          : link.platform === "SHOPEE"
                          ? "Shopee"
                          : link.platform === "AMAZON"
                          ? "Amazon"
                          : link.platform}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {link.shortCode}
                    </span>

                    <Badge variant={link.active ? "success" : "outline"} size="sm">
                      {link.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-xl">
                    {link.product?.title || "Link Personalizado"}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span className="text-cyan-400 truncate max-w-xs">{link.affiliateUrl}</span>
                    {link.utmCampaign && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {link.utmCampaign}
                      </span>
                    )}
                    <span>Criado em: {formatDate(link.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(link.id, link.affiliateUrl)}
                  className="text-xs gap-1.5 font-semibold"
                >
                  {copiedId === link.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedId === link.id ? "Copiado!" : "Copiar"}
                </Button>

                <a
                  href={link.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Original</span>
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar Link Personalizado */}
      <Modal
        isOpen={newLinkModal}
        onClose={() => setNewLinkModal(false)}
        title="Gerar Link de Afiliado"
      >
        <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Plataforma / Marketplace</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "SHOPEE", label: "Shopee" },
                { id: "MERCADO_LIVRE", label: "Mercado Livre" },
                { id: "AMAZON", label: "Amazon" },
              ].map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setPlatformInput(plat.id)}
                  className={`p-2.5 rounded-xl border text-center font-semibold transition-all flex items-center justify-center gap-2 ${
                    platformInput === plat.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <ProviderLogo provider={plat.id} size="xs" />
                  <span>{plat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              URL Original do Produto <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              placeholder="Cole o link do produto (ex: https://shopee.com.br/... ou https://produto.mercadolivre.com.br/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nome da Campanha (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: grupo_vip, stories_instagram, black_friday"
              value={campaignInput}
              onChange={(e) => setCampaignInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Sua tag ou credencial oficial configurada na Central de Integrações será anexada automaticamente.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNewLinkModal(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="glow"
              size="sm"
              isLoading={isCreating}
              className="gap-2"
            >
              <Link2 className="w-4 h-4" />
              <span>Gerar Link</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
