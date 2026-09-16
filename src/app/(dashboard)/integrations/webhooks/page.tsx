"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Filter,
  Eye,
  Layers,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  eventId: string | null;
  idempotencyKey: string | null;
  status: "PENDING" | "PROCESSED" | "FAILED" | "IGNORED";
  payload: string;
  headers: string | null;
  source: string;
  processingError: string | null;
  receivedAt: string;
  processedAt: string | null;
  connection?: {
    id: string;
    name: string;
  } | null;
}

export default function WebhookCenterPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [providerFilter, statusFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (providerFilter !== "all") params.append("provider", providerFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/integrations/webhooks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (eventId: string) => {
    setReplayingId(eventId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/integrations/events/${eventId}/replay`, {
        method: "POST",
      });
      const data = await res.json();
      setFeedback({
        success: res.ok,
        message: data.message || (res.ok ? "Evento reenviado com sucesso!" : data.error || "Falha no replay"),
      });
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || "Erro de rede" });
    } finally {
      setReplayingId(null);
    }
  };

  const copyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Central de Conexões
          </Link>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
            Central de Ingestão de Webhooks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento em tempo real de eventos recebidos dos canais e marketplaces com verificação de assinatura e idempotência.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Atualizar Eventos
        </button>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-xs ${
            feedback.success
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/40 border-red-500/30 text-red-200"
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </div>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Provedores</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="PROCESSED">Processados (PROCESSED)</option>
            <option value="PENDING">Pendentes (PENDING)</option>
            <option value="FAILED">Falhas (FAILED)</option>
            <option value="IGNORED">Ignorados / Duplicados (IGNORED)</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Total: <strong>{events.length}</strong> eventos registrados
        </div>
      </div>

      {/* Events Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        {events.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
            <div className="text-sm font-semibold text-slate-300">Nenhum evento de webhook recebido</div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Quando você conectar os endpoints de Webhook dos provedores externos, os payloads aparecerão aqui em tempo real.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Provedor</th>
                  <th className="py-3 px-4">Tipo do Evento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Recebido Em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      {evt.provider}
                    </td>
                    <td className="py-3.5 px-4 text-indigo-300 font-semibold">{evt.eventType}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.status === "PROCESSED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : evt.status === "FAILED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : evt.status === "IGNORED"
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {evt.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(evt.receivedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Inspecionar
                      </button>
                      <button
                        onClick={() => handleReplay(evt.id)}
                        disabled={replayingId === evt.id}
                        className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-sans border border-indigo-500/30 transition-colors inline-flex items-center gap-1"
                        title="Reexecutar pipeline com este evento"
                      >
                        <Play className={`w-3 h-3 ${replayingId === evt.id ? "animate-spin" : ""}`} />
                        Replay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  Inspetor de Evento: {selectedEvent.eventType}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {selectedEvent.id} • Provedor: {selectedEvent.provider}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500">Status</span>
                  <div className="font-bold text-emerald-400 mt-0.5">{selectedEvent.status}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500">Origem</span>
                  <div className="font-bold text-slate-300 mt-0.5 uppercase">{selectedEvent.source}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500">Recebido Em</span>
                  <div className="font-bold text-slate-300 mt-0.5">
                    {new Date(selectedEvent.receivedAt).toLocaleTimeString("pt-BR")}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500">Idempotency Key</span>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">
                    {selectedEvent.idempotencyKey || "-"}
                  </div>
                </div>
              </div>

              {selectedEvent.processingError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                  <strong>Erro de Processamento:</strong> {selectedEvent.processingError}
                </div>
              )}

              {/* Raw Payload Block */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">Payload JSON:</span>
                  <button
                    onClick={() => copyPayload(selectedEvent.payload)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPayload ? "Copiado!" : "Copiar JSON"}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 select-all">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedEvent.payload), null, 2);
                    } catch {
                      return selectedEvent.payload;
                    }
                  })()}
                </pre>
              </div>

              {/* Raw Headers Block */}
              {selectedEvent.headers && (
                <div>
                  <span className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Headers da Requisição:
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-36">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedEvent.headers), null, 2);
                      } catch {
                        return selectedEvent.headers;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Fechar
              </button>
              <button
                onClick={() => handleReplay(selectedEvent.id)}
                disabled={replayingId === selectedEvent.id}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {replayingId === selectedEvent.id ? "Executando Replay..." : "Reexecutar Evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
