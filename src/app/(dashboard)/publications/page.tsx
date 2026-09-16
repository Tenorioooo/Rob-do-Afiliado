"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Send,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Ban,
  Eye,
  ExternalLink,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";

interface PublicationData {
  id: string;
  userId: string;
  offerId: string;
  channelId: string;
  status: "DRAFT" | "QUEUED" | "SCHEDULED" | "SENDING" | "PUBLISHED" | "FAILED" | "RETRYING" | "CANCELLED";
  scheduledFor: string | null;
  publishedAt: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  externalPostId: string | null;
  idempotencyKey: string;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    type: string;
    provider: string;
    destination: string;
    active: boolean;
  };
  offer: {
    id: string;
    productTitle: string;
    productPrice: number;
    productImage: string | null;
    marketplace: string;
    affiliateUrl: string;
    copyText: string;
  };
}

export default function PublicationsPage() {
  const { toast } = useToast();
  const [publications, setPublications] = useState<PublicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingWorker, setProcessingWorker] = useState(false);

  // Details Modal
  const [selectedPublication, setSelectedPublication] = useState<PublicationData | null>(null);

  // Action states
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      let url = `/api/publications?status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPublications(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load publications", err);
      toast({
        title: "Erro",
        message: "Não foi possível carregar o histórico de publicações.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublications();
  };

  const handleRetry = async (pub: PublicationData) => {
    try {
      setRetryingId(pub.id);
      const res = await fetch(`/api/publications/${pub.id}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao reenviar");

      toast({
        title: "Reenvio Concluído!",
        message: `Publicação reenviada para o canal ${pub.channel.name}.`,
        type: "success",
      });
      fetchPublications();
    } catch (err: any) {
      toast({
        title: "Falha no Reenvio",
        message: err.message || "Não foi possível reenviar a publicação.",
        type: "error",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (pub: PublicationData) => {
    try {
      setCancellingId(pub.id);
      const res = await fetch(`/api/publications/${pub.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar");

      toast({
        title: "Publicação Cancelada",
        message: "O disparo agendado foi cancelado.",
        type: "info",
      });
      fetchPublications();
    } catch (err: any) {
      toast({
        title: "Erro ao cancelar",
        message: err.message || "Erro ao cancelar publicação.",
        type: "error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleRunWorker = async () => {
    try {
      setProcessingWorker(true);
      const res = await fetch("/api/worker/process-publications", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Worker Executado",
        message: `${data.processed} publicações processadas no ciclo de fundo.`,
        type: "success",
      });
      fetchPublications();
    } catch (err: any) {
      toast({
        title: "Erro no Worker",
        message: err.message || "Erro ao rodar ciclo do worker.",
        type: "error",
      });
    } finally {
      setProcessingWorker(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="success" size="sm">Publicado</Badge>;
      case "SCHEDULED":
        return <Badge variant="cyan" size="sm">Agendado</Badge>;
      case "QUEUED":
        return <Badge variant="purple" size="sm">Na Fila</Badge>;
      case "RETRYING":
        return <Badge variant="warning" size="sm">Tentando Novamente</Badge>;
      case "FAILED":
        return <Badge variant="danger" size="sm">Falhou</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" size="sm">Cancelado</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Histórico de Publicações</h2>
            <Badge variant="purple" size="md">Dispatcher 2.0</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe o status de cada postagem enviada, agendada ou com tentativa de reenvio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunWorker}
            isLoading={processingWorker}
            className="gap-2 text-xs"
            title="Executa ciclo de verificação para disparos agendados e retries"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Processar Fila</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPublications}
            isLoading={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "ALL", label: "Todas" },
            { id: "PUBLISHED", label: "Publicadas" },
            { id: "SCHEDULED", label: "Agendadas" },
            { id: "FAILED", label: "Falhas" },
            { id: "CANCELLED", label: "Canceladas" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === pill.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por produto ou canal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs">
            Buscar
          </Button>
        </form>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Carregando histórico de publicações...
        </div>
      ) : publications.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma publicação encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Envie ofertas a partir da aba <strong>Ofertas & IA</strong> ou configure regras de <strong>Automação</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Oferta / Produto</th>
                  <th className="py-3.5 px-4">Canal Destino</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Horário / Data</th>
                  <th className="py-3.5 px-4">Post ID / Idempotência</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Offer */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        {pub.offer?.productImage ? (
                          <img
                            src={pub.offer.productImage}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-slate-800 bg-slate-950 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[200px]" title={pub.offer?.productTitle}>
                            {pub.offer?.productTitle || "Oferta Personalizada"}
                          </p>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            R$ {(pub.offer?.productPrice || 0).toFixed(2)} ({pub.offer?.marketplace})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-white">{pub.channel?.name}</p>
                            {((pub as any).source === "real" || pub.channel?.provider === "real") ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                🟢 REAL
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                🔵 MOCK
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">{pub.channel?.type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {getStatusBadge(pub.status)}
                        {pub.retryCount > 0 && (
                          <span className="text-[10px] text-amber-400 block font-mono">
                            Tentativa {pub.retryCount}/{pub.maxRetries}
                          </span>
                        )}
                        {(pub as any).lastErrorMessage && (
                          <span className="text-[10px] text-rose-400 block truncate max-w-[150px]" title={(pub as any).lastErrorMessage}>
                            {(pub as any).lastErrorMessage}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {pub.publishedAt ? (
                        <div>
                          <span className="text-white font-medium block">
                            {new Date(pub.publishedAt).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-slate-500">
                            {new Date(pub.publishedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ) : pub.scheduledFor ? (
                        <div>
                          <span className="text-cyan-400 font-medium block">
                            {new Date(pub.scheduledFor).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-slate-500">
                            {new Date(pub.scheduledFor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ) : (
                        <span>{new Date(pub.createdAt).toLocaleDateString("pt-BR")}</span>
                      )}
                    </td>

                    {/* Post ID / Telegram Message ID */}
                    <td className="py-3.5 px-4">
                      {(pub.externalPostId || (pub as any).providerMessageId) ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] bg-slate-950 px-2 py-1 rounded border border-emerald-500/30 text-emerald-300 block truncate max-w-[140px]">
                            ID: {pub.externalPostId || (pub as any).providerMessageId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] block">
                          {pub.idempotencyKey.slice(0, 16)}...
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPublication(pub)}
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {(pub.status === "FAILED" || pub.status === "RETRYING") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(pub)}
                            isLoading={retryingId === pub.id}
                            className="p-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            title="Reenviar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(pub.status === "SCHEDULED" || pub.status === "QUEUED") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(pub)}
                            isLoading={cancellingId === pub.id}
                            className="p-1.5 text-xs text-rose-400 hover:bg-rose-950/30"
                            title="Cancelar Agendamento"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPublication && (
        <Modal
          isOpen={!!selectedPublication}
          onClose={() => setSelectedPublication(null)}
          title="Detalhes da Publicação"
          description={`ID: ${selectedPublication.id}`}
        >
          <div className="space-y-4 text-xs">
            {/* Status overview */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Status da Transmissão</span>
                <div className="mt-0.5">{getStatusBadge(selectedPublication.status)}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">Canal</span>
                <span className="font-bold text-white">
                  {selectedPublication.channel.name} ({selectedPublication.channel.type})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">Retries</span>
                <span className="font-mono text-slate-300">
                  {selectedPublication.retryCount} de {selectedPublication.maxRetries}
                </span>
              </div>
            </div>

            {/* Error box if failed */}
            {selectedPublication.lastError && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Diagnóstico do Erro
                </p>
                <p className="font-mono text-[11px]">{selectedPublication.lastError}</p>
              </div>
            )}

            {/* Message Copy preview */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Conteúdo Publicado</label>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap font-sans text-xs max-h-48 overflow-y-auto">
                {selectedPublication.offer?.copyText}
              </div>
            </div>

            {/* Idempotency & Metadata */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-400">
              <p>Idempotency Key: <span className="text-indigo-300">{selectedPublication.idempotencyKey}</span></p>
              {selectedPublication.externalPostId && (
                <p>External Post ID: <span className="text-emerald-300">{selectedPublication.externalPostId}</span></p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPublication(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
