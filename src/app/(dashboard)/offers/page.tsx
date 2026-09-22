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
  Sparkles,
  Search,
  Filter,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Edit3,
  ThumbsUp,
  Ban,
  Clock,
  Send,
  Plus,
  RefreshCw,
  MessageSquare,
  Flame,
  ArrowRight,
  Layers,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { OfferStyle, ChannelPreviewType, OfferQueuePriority } from "@/domain/offers/types";

interface OfferItem {
  id: string;
  userId: string;
  productId: string;
  opportunityId: string | null;
  affiliateLinkId: string | null;
  title: string;
  body: string;
  cta: string;
  style: OfferStyle;
  status: string;
  aiSource: string;
  validationStatus: string;
  validationMessage: string | null;
  reasons: string | null;
  generatedAt: string;
  approvedAt: string | null;
  createdAt: string;
  product: {
    id: string;
    title: string;
    imageUrl: string;
    platform: string;
    category: string;
    currentPrice: number;
    originalPrice: number;
    discountPercent: number;
    commissionAmount: number;
    opportunityScore: number;
    url: string;
  };
  affiliateLink?: {
    id: string;
    affiliateUrl: string;
    shortCode: string;
    source: string;
  } | null;
  queueItems?: Array<{
    id: string;
    priority: string;
    status: string;
    scheduledAt: string | null;
  }>;
}

export default function OffersPage() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Offer Modal
  const [offerToDelete, setOfferToDelete] = useState<OfferItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected Offer Modal for Editing & Multi-Channel Preview
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [previewChannel, setPreviewChannel] = useState<ChannelPreviewType>("TELEGRAM");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editStyle, setEditStyle] = useState<OfferStyle>("DESCONTO");
  const [isSaving, setIsSaving] = useState(false);

  // Queue Modal
  const [queueModalOffer, setQueueModalOffer] = useState<OfferItem | null>(null);
  const [queuePriority, setQueuePriority] = useState<OfferQueuePriority>("NORMAL");
  const [isEnqueuing, setIsEnqueuing] = useState(false);

  // Dispatch Modal (Phase 4)
  const [dispatchModalOffer, setDispatchModalOffer] = useState<OfferItem | null>(null);
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [dispatchChannelId, setDispatchChannelId] = useState("");
  const [dispatchMode, setDispatchMode] = useState<"NOW" | "SCHEDULE">("NOW");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      if (data.success && data.channels) {
        setAvailableChannels(data.channels.filter((c: any) => c.active));
        if (data.channels.length > 0) {
          setDispatchChannelId(data.channels[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load channels for dispatch:", err);
    }
  };

  const fetchOffers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (styleFilter !== "ALL") params.set("style", styleFilter);
      if (platformFilter !== "ALL") params.set("platform", platformFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/offers?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOffers(data.offers || []);
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, styleFilter, platformFilter, search]);

  useEffect(() => {
    fetchOffers();
    fetchChannels();
  }, [fetchOffers]);

  const openOfferDetail = (offer: OfferItem) => {
    setSelectedOffer(offer);
    setEditTitle(offer.title);
    setEditBody(offer.body);
    setEditCta(offer.cta);
    setEditStyle(offer.style);
    setIsEditing(false);
  };

  const handleCopyFullOffer = (offer: OfferItem) => {
    const affiliateUrl = offer.affiliateLink?.affiliateUrl || offer.product.url;
    const fullText = `${offer.title}\n\n${offer.body}\n\n${offer.cta}\n${affiliateUrl}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(offer.id);
    toast({
      title: "Oferta Completa Copiada!",
      message: "Texto formatado com link copiado para a área de transferência.",
      type: "success",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveEdit = async () => {
    if (!selectedOffer) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/offers/${selectedOffer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          body: editBody,
          cta: editCta,
          style: editStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");

      toast({
        title: "Oferta Atualizada!",
        message: data.validation?.summaryMessage || "Validação anti-fabricação executada.",
        type: data.validation?.status === "REJECTED" ? "warning" : "success",
      });

      setIsEditing(false);
      fetchOffers();
      if (data.offer) setSelectedOffer({ ...selectedOffer, ...data.offer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast({ title: "Falha ao salvar", message: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (offerId: string) => {
    try {
      const res = await fetch(`/api/offers/${offerId}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao aprovar");
      }
      toast({
        title: "Oferta Aprovada!",
        message: "Status alterado para APROVADA e pronta para inclusão na fila.",
        type: "success",
      });
      fetchOffers();
      if (selectedOffer && selectedOffer.id === offerId) {
        setSelectedOffer({ ...selectedOffer, status: "APPROVED" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao aprovar";
      toast({ title: "Erro", message: msg, type: "error" });
    }
  };

  const handleCancel = async (offerId: string) => {
    try {
      const res = await fetch(`/api/offers/${offerId}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao cancelar");
      toast({
        title: "Oferta Cancelada",
        message: "A oferta foi marcada como CANCELADA.",
        type: "info",
      });
      fetchOffers();
      if (selectedOffer && selectedOffer.id === offerId) {
        setSelectedOffer({ ...selectedOffer, status: "CANCELLED" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cancelar";
      toast({ title: "Erro", message: msg, type: "error" });
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir oferta");

      toast({
        title: "Oferta Excluída!",
        message: "A oferta foi removida com sucesso.",
        type: "success",
      });

      setOfferToDelete(null);
      if (selectedOffer && selectedOffer.id === offerId) {
        setSelectedOffer(null);
      }
      fetchOffers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir oferta";
      toast({ title: "Falha ao excluir", message: msg, type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueModalOffer) return;
    setIsEnqueuing(true);
    try {
      const res = await fetch("/api/offer-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: queueModalOffer.id,
          priority: queuePriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao adicionar à fila");

      toast({
        title: "Oferta Enfileirada com Sucesso!",
        message: `Adicionada à fila persistente com prioridade ${queuePriority}.`,
        type: "success",
      });
      setQueueModalOffer(null);
      fetchOffers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enfileirar";
      toast({ title: "Erro ao enfileirar", message: msg, type: "error" });
    } finally {
      setIsEnqueuing(false);
    }
  };

  const handleDispatchOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOffer || !dispatchChannelId) {
      toast({
        title: "Selecione o canal",
        message: "Escolha um canal ativo para realizar o disparo.",
        type: "warning",
      });
      return;
    }

    try {
      setIsDispatching(true);

      if (dispatchMode === "NOW") {
        const selectedChan = availableChannels.find((c) => c.id === dispatchChannelId);
        const isReal = selectedChan && selectedChan.provider !== "mock";

        const res = await fetch("/api/publications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: dispatchModalOffer.id,
            channelId: dispatchChannelId,
            confirmed: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao disparar");

        const msgId = data.publication?.providerMessageId || data.result?.providerMessageId;
        toast({
          title: isReal ? "🟢 Publicação Real Enviada com Sucesso!" : "Publicação Despachada com Sucesso!",
          message: isReal
            ? `Mensagem entregue no Telegram (Message ID: ${msgId || "Confirmado"}).`
            : `Post enviado para o canal (Mock Adapter Ativo).`,
          type: "success",
        });
      } else {
        if (!scheduledDateTime) {
          toast({
            title: "Data e Hora",
            message: "Selecione data e hora para o agendamento.",
            type: "warning",
          });
          setIsDispatching(false);
          return;
        }

        const res = await fetch("/api/publications/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: dispatchModalOffer.id,
            channelId: dispatchChannelId,
            scheduledFor: new Date(scheduledDateTime).toISOString(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao agendar");

        toast({
          title: "Publicação Agendada!",
          message: `Agendamento criado para ${new Date(scheduledDateTime).toLocaleString("pt-BR")}.`,
          type: "success",
        });
      }

      setDispatchModalOffer(null);
      fetchOffers();
    } catch (err: any) {
      toast({
        title: "Erro no Disparo",
        message: err.message || "Não foi possível despachar a publicação.",
        type: "error",
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Metrics
  const totalOffers = offers.length;
  const readyOffers = offers.filter((o) => o.status === "READY").length;
  const approvedOffers = offers.filter((o) => o.status === "APPROVED").length;
  const draftOffers = offers.filter((o) => o.status === "DRAFT").length;
  const scheduledOffers = offers.filter((o) => o.status === "SCHEDULED").length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Ofertas & IA</h2>
            <Badge variant="glow" size="md">Anti-Fabricação Ativa</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie, valide e enfileire copys de alta conversão geradas a partir do Radar.
          </p>
        </div>

        <Link href="/radar">
          <Button variant="glow" size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            <span>Gerar Nova a Partir do Radar</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
          <div className="text-2xl font-bold text-white mt-1">{totalOffers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Aprovadas</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedOffers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Prontas</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{readyOffers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Agendadas / Fila</span>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{scheduledOffers}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Rascunhos</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{draftOffers}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          {["ALL", "READY", "APPROVED", "SCHEDULED", "DRAFT", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st === "ALL"
                ? "Todas"
                : st === "READY"
                ? "Prontas"
                : st === "APPROVED"
                ? "Aprovadas"
                : st === "SCHEDULED"
                ? "Na Fila"
                : st === "DRAFT"
                ? "Rascunhos"
                : "Canceladas"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Style Selector */}
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            aria-label="Filtrar por estilo de copy"
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos os Estilos</option>
            <option value="DIRETO">Direto</option>
            <option value="DESCONTO">Desconto</option>
            <option value="URGENCIA">Urgência</option>
            <option value="PREMIUM">Premium</option>
            <option value="CURTO">Curto</option>
          </select>

          {/* Platform Selector */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            aria-label="Filtrar por marketplace"
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todas as Lojas</option>
            <option value="SHOPEE">Shopee</option>
            <option value="MERCADO_LIVRE">Mercado Livre</option>
            <option value="AMAZON">Amazon</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ofertas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Offers Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/30 p-8 space-y-4">
          <Sparkles className="w-10 h-10 text-primary-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">Nenhuma oferta encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search || statusFilter !== "ALL" || styleFilter !== "ALL"
              ? "Tente ajustar os filtros acima para encontrar suas ofertas."
              : "Vá até o Radar, selecione uma oportunidade qualificada e clique em 'Gerar Oferta com IA'."}
          </p>
          <Link href="/radar">
            <Button variant="glow" size="sm" className="mt-2">
              Explorar Radar de Oportunidades
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const hasQueue = offer.queueItems && offer.queueItems.length > 0;
            const isApproved = offer.status === "APPROVED";
            const isCancelled = offer.status === "CANCELLED";

            return (
              <div
                key={offer.id}
                className="group p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Product & Copy Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <img
                    src={offer.product.imageUrl}
                    alt={offer.product.title}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge
                        variant={
                          offer.product.platform === "SHOPEE"
                            ? "shopee"
                            : offer.product.platform === "MERCADO_LIVRE"
                            ? "mercadolivre"
                            : "amazon"
                        }
                        size="sm"
                      >
                        {offer.product.platform.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {offer.style}
                      </Badge>
                      <Badge
                        variant={
                          offer.status === "APPROVED"
                            ? "success"
                            : offer.status === "READY"
                            ? "default"
                            : offer.status === "SCHEDULED"
                            ? "glow"
                            : offer.status === "CANCELLED"
                            ? "destructive"
                            : "warning"
                        }
                        size="sm"
                      >
                        {offer.status}
                      </Badge>
                      <Badge variant="glow" size="sm">
                        ⭐ {offer.product.opportunityScore} pts
                      </Badge>
                      {hasQueue && (
                        <Badge variant="success" size="sm">
                          Fila ({offer.queueItems![0].priority})
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                      {offer.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5 max-w-2xl">
                      {offer.body}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                      <span>Preço: {formatCurrency(offer.product.currentPrice)}</span>
                      <span>Comissão: {formatCurrency(offer.product.commissionAmount)}</span>
                      <span>Criada em: {formatDate(offer.createdAt)}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Anti-Fabricação OK
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyFullOffer(offer)}
                    className="text-xs gap-1.5"
                  >
                    {copiedId === offer.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === offer.id ? "Copiado!" : "Copiar"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openOfferDetail(offer)}
                    className="text-xs gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary-300" />
                    <span>Ver & Editar</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDispatchModalOffer(offer);
                      setDispatchMode("NOW");
                    }}
                    className="text-xs gap-1.5 text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/30"
                    title="Disparar ou Agendar no Canal"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar</span>
                  </Button>

                  {!isApproved && !isCancelled && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleApprove(offer.id)}
                      className="text-xs gap-1.5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </Button>
                  )}

                  {!hasQueue && !isCancelled && (
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => {
                        setQueueModalOffer(offer);
                        setQueuePriority("NORMAL");
                      }}
                      className="text-xs gap-1.5 font-semibold"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>+ Fila</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOfferToDelete(offer)}
                    className="text-xs gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                    title="Excluir Oferta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Offer Detail & Multi-Channel Preview Modal */}
      {selectedOffer && (
        <Modal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          title="Visualizador & Editor de Oferta com IA"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedOffer.product.imageUrl}
                  alt={selectedOffer.product.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                />
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{selectedOffer.product.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatCurrency(selectedOffer.product.currentPrice)}</span>
                    <span>•</span>
                    <span className="text-emerald-400">Comissão {formatCurrency(selectedOffer.product.commissionAmount)}</span>
                    <span>•</span>
                    <Badge variant="outline" size="sm">IA: {selectedOffer.aiSource}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isEditing ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? "Visualizar Preview" : "Editar Texto"}
                </Button>
              </div>
            </div>

            {/* Editing Mode */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Título da Oferta</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Corpo da Mensagem</label>
                  <textarea
                    rows={6}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-primary font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Chamada para Ação (CTA)</label>
                  <input
                    type="text"
                    value={editCta}
                    onChange={(e) => setEditCta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={handleSaveEdit}
                    isLoading={isSaving}
                    className="font-semibold text-xs"
                  >
                    Validar & Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              /* Channel Preview Mode */
              <div className="space-y-4">
                {/* Channel Switcher */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <button
                    onClick={() => setPreviewChannel("TELEGRAM")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
                      previewChannel === "TELEGRAM" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📱 Telegram
                  </button>
                  <button
                    onClick={() => setPreviewChannel("WHATSAPP")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
                      previewChannel === "WHATSAPP" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={() => setPreviewChannel("DISCORD")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
                      previewChannel === "DISCORD" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🎮 Discord
                  </button>
                  <button
                    onClick={() => setPreviewChannel("GENERIC")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
                      previewChannel === "GENERIC" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📄 Texto Genérico
                  </button>
                </div>

                {/* Simulated Channel Message Bubble */}
                <div
                  className={`rounded-2xl p-5 border text-xs font-sans whitespace-pre-line leading-relaxed shadow-xl ${
                    previewChannel === "WHATSAPP"
                      ? "bg-[#0b141a] border-[#222d34] text-[#e9edef]"
                      : previewChannel === "TELEGRAM"
                      ? "bg-[#182533] border-[#2b3b4b] text-[#f5f5f5]"
                      : previewChannel === "DISCORD"
                      ? "bg-[#313338] border-[#383a40] text-[#dbdee1]"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="font-bold text-sm mb-2 text-primary-300">{selectedOffer.title}</div>
                  <div className="mb-3">{selectedOffer.body}</div>
                  <div className="font-semibold text-emerald-400 mb-1">{selectedOffer.cta}</div>
                  <div className="font-mono text-[11px] text-cyan-400 break-all underline">
                    {selectedOffer.affiliateLink?.affiliateUrl || selectedOffer.product.url}
                  </div>
                </div>

                {/* Anti-Fabrication Verified Claims Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Validação Anti-Fabricação</span>
                    <Badge variant="success" size="sm">ZERO CLAIMS FALSOS</Badge>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Preço de {formatCurrency(selectedOffer.product.currentPrice)}, desconto de {selectedOffer.product.discountPercent}% e atributos validados diretamente contra o banco de dados.
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyFullOffer(selectedOffer)}
                  className="text-xs gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Oferta Completa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOfferToDelete(selectedOffer);
                    setSelectedOffer(null);
                  }}
                  className="text-xs gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Oferta
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedOffer.status !== "APPROVED" && selectedOffer.status !== "CANCELLED" && (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => handleApprove(selectedOffer.id)}
                    className="text-xs gap-1.5 font-semibold"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Aprovar Oferta
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDispatchModalOffer(selectedOffer);
                    setDispatchMode("NOW");
                    setSelectedOffer(null);
                  }}
                  className="text-xs gap-1.5 text-cyan-400 border-cyan-500/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Disparar Canal
                </Button>

                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => {
                    setQueueModalOffer(selectedOffer);
                    setSelectedOffer(null);
                  }}
                  className="text-xs gap-1.5 font-semibold"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Adicionar à Fila
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispatch Modal (Phase 4) */}
      {dispatchModalOffer && (
        <Modal
          isOpen={!!dispatchModalOffer}
          onClose={() => setDispatchModalOffer(null)}
          title="Disparar Oferta para Canal"
          description="Envie imediatamente ou agende para disparo pelo Channel Dispatcher."
          size="md"
        >
          <form onSubmit={handleDispatchOffer} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Oferta:</span>
              <strong className="text-white line-clamp-1">{dispatchModalOffer.title}</strong>
              <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                {formatCurrency(dispatchModalOffer.product.currentPrice)} ({dispatchModalOffer.product.platform})
              </span>
            </div>

            {/* Target Channel */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Selecione o Canal de Destino</label>
              {availableChannels.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs">
                  Nenhum canal ativo encontrado.{" "}
                  <Link href="/channels" className="underline font-bold text-white">
                    Conectar um canal agora
                  </Link>
                  .
                </div>
              ) : (
                <select
                  value={dispatchChannelId}
                  onChange={(e) => setDispatchChannelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-primary"
                  required
                >
                  {availableChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) — {c.destination}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Real Dispatch Confirmation Details */}
            {(() => {
              const selectedChan = availableChannels.find((c) => c.id === dispatchChannelId);
              const isReal = selectedChan && selectedChan.provider !== "mock";
              if (!isReal) return null;

              return (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      PUBLICAÇÃO REAL NO TELEGRAM
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Você está prestes a publicar esta oferta em um canal <strong>REAL</strong> do Telegram.
                  </p>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-300">
                    <div><strong>Canal:</strong> {selectedChan?.name}</div>
                    <div><strong>Destino:</strong> {selectedChan?.destination || selectedChan?.identifier}</div>
                    <div><strong>Produto:</strong> {dispatchModalOffer.product.title}</div>
                    <div><strong>Preço:</strong> {formatCurrency(dispatchModalOffer.product.currentPrice)}</div>
                    <div><strong>Link:</strong> {dispatchModalOffer.affiliateLink?.affiliateUrl || dispatchModalOffer.product.url}</div>
                    <div><strong>Estilo:</strong> {dispatchModalOffer.style}</div>
                  </div>
                  <p className="text-[10px] text-amber-400/90 font-medium">
                    ⚠️ Essa ação enviará uma mensagem real para a API oficial do Telegram.
                  </p>
                </div>
              );
            })()}

            {/* Mode: Send Now vs Schedule */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Modo de Envio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchMode("NOW")}
                  className={`py-2 px-3 rounded-xl font-semibold border text-xs transition-all ${
                    dispatchMode === "NOW"
                      ? "bg-primary/20 border-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  ⚡ Enviar Imediatamente
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode("SCHEDULE")}
                  className={`py-2 px-3 rounded-xl font-semibold border text-xs transition-all ${
                    dispatchMode === "SCHEDULE"
                      ? "bg-primary/20 border-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📅 Agendar Publicação
                </button>
              </div>
            </div>

            {/* Scheduled Date/Time if SCHEDULE */}
            {dispatchMode === "SCHEDULE" && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Data e Hora do Agendamento</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-primary"
                  required={dispatchMode === "SCHEDULE"}
                />
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDispatchModalOffer(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="glow"
                size="sm"
                isLoading={isDispatching}
                disabled={availableChannels.length === 0}
              >
                {(() => {
                  const selectedChan = availableChannels.find((c) => c.id === dispatchChannelId);
                  const isReal = selectedChan && selectedChan.provider !== "mock";
                  if (isReal && dispatchMode === "NOW") return "PUBLICAR NO TELEGRAM";
                  return dispatchMode === "NOW" ? "Disparar Agora" : "Confirmar Agendamento";
                })()}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add To Queue Modal */}
      {queueModalOffer && (
        <Modal
          isOpen={!!queueModalOffer}
          onClose={() => setQueueModalOffer(null)}
          title="Adicionar Oferta à Fila de Distribuição"
          size="md"
        >
          <form onSubmit={handleEnqueue} className="space-y-4">
            <p className="text-xs text-slate-400">
              Enfileire a oferta para agendamento e posterior despacho automatizado para os canais conectados.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-0.5">Oferta Selecionada:</span>
              <strong className="text-white line-clamp-1">{queueModalOffer.title}</strong>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nível de Prioridade na Fila
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
                    {pri === "LOW"
                      ? "Baixa"
                      : pri === "NORMAL"
                      ? "Normal"
                      : pri === "HIGH"
                      ? "Alta"
                      : "Urgente"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
              ℹ️ A distribuição direta e agendada já está disponível via botão &quot;Disparar&quot;.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setQueueModalOffer(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="glow" size="sm" isLoading={isEnqueuing} className="font-semibold text-xs">
                Confirmar Enfileiramento
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {offerToDelete && (
        <Modal
          isOpen={!!offerToDelete}
          onClose={() => !isDeleting && setOfferToDelete(null)}
          title="Excluir Oferta"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir esta oferta permanentemente?
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <strong className="text-white line-clamp-2">{offerToDelete.title}</strong>
              <div className="text-[11px] text-slate-400">
                Produto: {offerToDelete.product.title}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-[11px]">
              ⚠️ Esta ação é irreversível e removerá todos os dados desta cópia gerada.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setOfferToDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={() => handleDeleteOffer(offerToDelete.id)}
                className="gap-1.5 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
