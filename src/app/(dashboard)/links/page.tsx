"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
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
    if (!urlInput) return;
    setIsCreating(true);

    try {
      // Find a matching product or generate generic affiliate link
      const res = await fetch("/api/affiliate-links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "custom-url", // Service will handle or link
          platform: platformInput,
          originalUrl: urlInput,
          customCampaign: campaignInput || "manual_link",
        }),
      });

      // If custom-url fails because product doesn't exist, we fallback or show message
      const data = await res.json();
      if (!res.ok) {
        // Direct link creation
        toast({
          title: "Aviso",
          message: "Para links rastreáveis de produtos do catálogo, utilize o Radar de Oportunidades.",
          type: "info",
        });
      } else {
        toast({
          title: "Link Gerado com Sucesso!",
          message: `Código ${data.link.shortCode} criado.`,
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

        <Link href="/radar">
          <Button variant="glow" size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>Gerar Link do Radar</span>
          </Button>
        </Link>
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "SHOPEE", "MERCADO_LIVRE", "AMAZON"].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                platformFilter === plat
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {plat === "ALL" ? "Todas as Lojas" : plat.replace("_", " ")}
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
            Acesse o Radar de Oportunidades para gerar links de afiliados determinísticos com rastreamento UTM automático.
          </p>
          <Link href="/radar">
            <Button variant="glow" size="sm" className="mt-2">
              Ir para o Radar de Oportunidades
            </Button>
          </Link>
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
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge
                      variant={
                        link.platform === "SHOPEE"
                          ? "shopee"
                          : link.platform === "MERCADO_LIVRE"
                          ? "mercadolivre"
                          : "amazon"
                      }
                      size="sm"
                    >
                      {link.platform.replace("_", " ")}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-white">
                      {link.shortCode}
                    </span>
                    <Badge variant="outline" size="sm">
                      {link.source.toUpperCase()}
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
    </div>
  );
}
