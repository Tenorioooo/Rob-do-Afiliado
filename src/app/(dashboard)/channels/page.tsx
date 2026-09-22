"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Radio,
  Send,
  Plus,
  ShieldCheck,
  Zap,
  Trash2,
  RefreshCw,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  MessageSquare,
  Sparkles,
  Settings2,
} from "lucide-react";

interface ChannelData {
  id: string;
  name: string;
  type: "TELEGRAM" | "WHATSAPP" | "DISCORD";
  provider: string;
  destination: string;
  active: boolean;
  config: any;
  lastTestedAt: string | null;
  testResult: string | null;
  createdAt: string;
  _count?: {
    publications: number;
  };
}

export default function ChannelsPage() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelData | null>(null);

  // Form State
  const [channelType, setChannelType] = useState<"TELEGRAM" | "WHATSAPP" | "DISCORD">("TELEGRAM");
  const [channelName, setChannelName] = useState("");
  const [destination, setDestination] = useState("");
  const [botToken, setBotToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Testing State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testModalResult, setTestModalResult] = useState<any | null>(null);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/channels");
      const data = await res.json();
      if (data.success) {
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error("Failed to load channels", err);
      toast({
        title: "Erro",
        message: "Não foi possível carregar os canais.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const openCreateModal = () => {
    setEditingChannel(null);
    setChannelType("TELEGRAM");
    setChannelName("");
    setDestination("@canal_afiliado_vip");
    setBotToken("");
    setWebhookUrl("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (chan: ChannelData) => {
    setEditingChannel(chan);
    setChannelType(chan.type);
    setChannelName(chan.name);
    setDestination(chan.destination);
    setBotToken("");
    setWebhookUrl("");
    setIsCreateModalOpen(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !destination.trim()) {
      toast({
        title: "Campos obrigatórios",
        message: "Preencha o nome e o identificador de destino do canal.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const configPayload: any = {};
      if (channelType === "TELEGRAM" && botToken) configPayload.botToken = botToken;
      if (channelType === "WHATSAPP" && botToken) configPayload.apiKey = botToken;
      if (channelType === "DISCORD" && webhookUrl) configPayload.webhookUrl = webhookUrl;

      if (editingChannel) {
        // Update
        const res = await fetch(`/api/channels/${editingChannel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: channelName,
            destination,
            ...(Object.keys(configPayload).length > 0 ? { config: configPayload } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao atualizar canal");
        toast({
          title: "Canal Atualizado",
          message: `O canal ${channelName} foi salvo com sucesso.`,
          type: "success",
        });
      } else {
        // Create
        const res = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: channelName,
            type: channelType,
            destination,
            config: configPayload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao criar canal");
        toast({
          title: "Canal Conectado!",
          message: `Canal ${channelName} vinculado com sucesso e pronto para envios.`,
          type: "success",
        });
      }

      setIsCreateModalOpen(false);
      fetchChannels();
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        message: err.message || "Ocorreu um erro ao salvar o canal.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (channel: ChannelData) => {
    try {
      setTestingId(channel.id);
      const res = await fetch(`/api/channels/${channel.id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no teste de conexão");

      setTestModalResult({
        channelName: channel.name,
        result: data.testResult,
      });

      toast({
        title: data.testResult.success ? "Conexão Estabelecida!" : "Falha na Conexão",
        message: data.testResult.message,
        type: data.testResult.success ? "success" : "error",
      });
      fetchChannels();
    } catch (err: any) {
      toast({
        title: "Falha no Teste",
        message: err.message || "Não foi possível testar o canal.",
        type: "error",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (channel: ChannelData) => {
    try {
      const endpoint = channel.active ? "deactivate" : "activate";
      const res = await fetch(`/api/channels/${channel.id}/${endpoint}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: channel.active ? "Canal Desativado" : "Canal Ativado",
        message: `O canal ${channel.name} foi ${channel.active ? "desativado" : "ativado"}.`,
        type: "info",
      });
      fetchChannels();
    } catch (err: any) {
      toast({
        title: "Erro",
        message: err.message || "Não foi possível alterar o status do canal.",
        type: "error",
      });
    }
  };

  const handleDeleteChannel = async (channelId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o canal "${name}"?`)) return;

    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Canal Removido",
        message: `O canal ${name} foi excluído.`,
        type: "success",
      });
      fetchChannels();
    } catch (err: any) {
      toast({
        title: "Erro",
        message: err.message || "Erro ao excluir canal.",
        type: "error",
      });
    }
  };

  const getChannelBadge = (type: string) => {
    switch (type) {
      case "TELEGRAM":
        return <Badge variant="cyan" size="sm">Telegram</Badge>;
      case "WHATSAPP":
        return <Badge variant="success" size="sm">WhatsApp</Badge>;
      case "DISCORD":
        return <Badge variant="purple" size="sm">Discord</Badge>;
      default:
        return <Badge variant="outline" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Canais de Distribuição</h2>
            <Badge variant="purple" size="md">Disparo Ativo</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Conecte seus canais e grupos de envio (Telegram, WhatsApp e Discord) com validação e segurança criptografada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChannels}
            isLoading={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={openCreateModal}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Canal</span>
          </Button>
        </div>
      </div>

      {/* Information Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">Disparo Multi-Canal com Proteção de Envio</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Você pode cadastrar múltiplos canais e grupos de destino para receber as ofertas garimpadas e agendadas pelo robô.
            </p>
          </div>
        </div>
      </div>

      {/* Channels List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Carregando canais conectados...
        </div>
      ) : channels.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhum canal conectado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Conecte seu primeiro canal do Telegram, WhatsApp ou Discord para começar a disparar ofertas automaticamente.
            </p>
          </div>
          <Button variant="glow" size="sm" onClick={openCreateModal} className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" /> Conectar Primeiro Canal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((chan) => {
            const parsedTest = chan.testResult ? JSON.parse(chan.testResult) : null;

            return (
              <div
                key={chan.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl transition-all ${
                  chan.active
                    ? "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    : "border-slate-800/50 bg-slate-950/40 opacity-70"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-primary">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate max-w-[140px]">{chan.name}</h3>
                          {getChannelBadge(chan.type)}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">
                          {chan.destination}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(chan)}
                      title={chan.active ? "Desativar Canal" : "Ativar Canal"}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        chan.active
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {chan.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Channel Details Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Provedor</span>
                      <span className="font-mono text-slate-300">{chan.provider}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Publicações Enviadas</span>
                      <span className="font-bold text-indigo-400">{chan._count?.publications ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Status Teste</span>
                      {parsedTest ? (
                        <span className={`font-semibold flex items-center gap-1 ${parsedTest.success ? "text-emerald-400" : "text-rose-400"}`}>
                          {parsedTest.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {parsedTest.latencyMs}ms ({parsedTest.source})
                        </span>
                      ) : (
                        <span className="text-slate-500">Nunca testado</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(chan)}
                    isLoading={testingId === chan.id}
                    className="flex-1 text-xs gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Testar
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(chan)}
                    className="p-2"
                    title="Editar"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteChannel(chan.id, chan.name)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Channel */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingChannel ? "Editar Canal" : "Conectar Novo Canal"}
          description="Configure os dados de acesso e destino para disparo automatizado."
        >
          <form onSubmit={handleSaveChannel} className="space-y-4 text-xs">
            {/* Type Selector */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Tipo de Canal</label>
              <div className="grid grid-cols-3 gap-2">
                {(["TELEGRAM", "WHATSAPP", "DISCORD"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setChannelType(type);
                      if (type === "TELEGRAM") setDestination("@canal_afiliado_vip");
                      if (type === "WHATSAPP") setDestination("5511999998888-group@g.us");
                      if (type === "DISCORD") setDestination("discord-webhook-id");
                    }}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      channelType === type
                        ? "bg-primary/20 border-primary text-white shadow-md shadow-primary/20"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nome de Identificação</label>
              <input
                type="text"
                placeholder="Ex: Canal VIP de Promoções"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {channelType === "TELEGRAM"
                  ? "Chat ID ou @username do Canal"
                  : channelType === "WHATSAPP"
                  ? "ID do Grupo ou Número de Broadcast"
                  : "Webhook ID / Channel ID"}
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={
                  channelType === "TELEGRAM"
                    ? "@canal_promocoes_vip ou -100123456789"
                    : channelType === "WHATSAPP"
                    ? "5511999998888-group@g.us"
                    : "https://discord.com/api/webhooks/..."
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Credentials / Token */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {channelType === "TELEGRAM"
                  ? "Bot Token (opcional para Mock)"
                  : channelType === "WHATSAPP"
                  ? "API Key (opcional para Mock)"
                  : "Webhook URL completa"}
              </label>
              <input
                type="password"
                value={channelType === "DISCORD" ? webhookUrl : botToken}
                onChange={(e) =>
                  channelType === "DISCORD" ? setWebhookUrl(e.target.value) : setBotToken(e.target.value)
                }
                placeholder={editingChannel ? "•••••••••••• (deixe em branco para manter)" : "Chave de autenticação..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Credenciais são criptografadas e nunca exibidas de volta na interface.
              </p>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="glow" size="sm" isLoading={saving}>
                {editingChannel ? "Salvar Alterações" : "Conectar Canal"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Test Result Details */}
      {testModalResult && (
        <Modal
          isOpen={!!testModalResult}
          onClose={() => setTestModalResult(null)}
          title={`Resultado do Teste: ${testModalResult.channelName}`}
          description="Verificação do contrato do Dispatcher com o ChannelAdapter."
        >
          <div className="space-y-4 text-xs">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                testModalResult.result.success
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/30 border-rose-500/30 text-rose-300"
              }`}
            >
              {testModalResult.result.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-sm">{testModalResult.result.message}</p>
                <p className="text-[11px] opacity-80 mt-1">
                  Latência registrada: {testModalResult.result.latencyMs}ms | Fonte: {testModalResult.result.source}
                </p>
              </div>
            </div>

            {testModalResult.result.details && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-semibold text-slate-400 mb-1">Payload de Diagnóstico</p>
                <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto">
                  {JSON.stringify(testModalResult.result.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setTestModalResult(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
