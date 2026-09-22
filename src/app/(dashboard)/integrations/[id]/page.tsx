"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  Activity,
  Copy,
  Check,
  Radio,
  Trash2,
  Send,
  Zap,
  Hash,
  Settings,
  Clock,
  ExternalLink,
} from "lucide-react";
import { ProviderRegistry } from "@/integrations/provider-registry";

interface ConnectionDetails {
  id: string;
  provider: string;
  type: string;
  status: string;
  authType: string;
  credentials: Record<string, any>;
  externalAccountId: string | null;
  externalAccountName: string | null;
  capabilities: string[];
  metadata?: string | null;
  lastValidatedAt: string | null;
  lastSyncAt: string | null;
  lastWebhookAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface ActivationProgress {
  connectionId: string;
  provider: string;
  currentStatus: string;
  isVerifiedReal: boolean;
  enabledForAutopilot: boolean;
  stepsCompleted: string[];
  stepResults: Record<string, any>;
  lastHealthCheckAt: string | null;
  lastTestSendAt: string | null;
  botUsername?: string | null;
  accountName?: string | null;
  targetDestination?: string | null;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = params.id as string;

  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [progress, setProgress] = useState<ActivationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Edit / Rotate Credentials
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [credentialForm, setCredentialForm] = useState<Record<string, string>>({});
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  // Destination configuration state (for messaging channels)
  const [destinationInput, setDestinationInput] = useState("");
  const [isSavingDestination, setIsSavingDestination] = useState(false);
  const [destinationResult, setDestinationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Test send state
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchConnectionData();
  }, [connectionId]);

  const fetchConnectionData = async () => {
    setLoading(true);
    try {
      const [connRes, logsRes, progRes] = await Promise.all([
        fetch(`/api/integrations/${connectionId}`),
        fetch(`/api/integrations/${connectionId}/logs`),
        fetch(`/api/integrations/${connectionId}/activation-step`),
      ]);

      if (connRes.ok) {
        const data = await connRes.json();
        setConnection(data.connection);
      } else {
        router.push("/integrations");
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (progRes.ok) {
        const progData = await progRes.json();
        setProgress(progData.progress || null);
        if (progData.progress?.targetDestination && !destinationInput) {
          setDestinationInput(progData.progress.targetDestination);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar conexão:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "HEALTH_CHECK" }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Conexão verificada e ativa em tempo real!" : data.error || "Falha na validação."),
      });
      fetchConnectionData();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Erro de rede" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) return;
    setIsSavingDestination(true);
    setDestinationResult(null);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "DESTINATION",
          destination: destinationInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDestinationResult({ success: true, message: `Destino configurado: ${data.destination}` });
        fetchConnectionData();
      } else {
        setDestinationResult({ success: false, message: data.error || "Erro ao salvar destino." });
      }
    } catch (err: any) {
      setDestinationResult({ success: false, message: err.message || "Erro de rede." });
    } finally {
      setIsSavingDestination(false);
    }
  };

  const handleExecuteQuickTestSend = async () => {
    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destinationInput || undefined,
          confirmed: true,
        }),
      });
      const data = await res.json();
      setTestSendResult({
        success: data.success,
        message: data.message || data.error || (data.success ? "Mensagem de teste enviada com sucesso!" : "Erro no envio de teste."),
      });
      fetchConnectionData();
    } catch (err: any) {
      setTestSendResult({ success: false, message: err.message || "Erro de rede." });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleToggleAutopilot = async (enabled: boolean) => {
    try {
      await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "TOGGLE_AUTOPILOT",
          enabledForAutopilot: enabled,
        }),
      });
      fetchConnectionData();
    } catch (err) {
      console.error("Erro ao alterar permissão do Autopiloto:", err);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCredentials(true);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "CONFIGURE",
          credentials: credentialForm,
        }),
      });
      if (res.ok) {
        setIsEditingCredentials(false);
        setCredentialForm({});
        fetchConnectionData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar credenciais.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de rede");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar esta integração? As credenciais serão removidas.")) {
      return;
    }
    try {
      const res = await fetch(`/api/integrations/${connectionId}/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        router.push("/integrations");
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!connection) return null;

  const providerDef = ProviderRegistry.getById(connection.provider);
  const isChannel = connection.type === "CHANNEL" || ["TELEGRAM", "DISCORD", "WHATSAPP"].includes(connection.provider.toUpperCase());

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/${connection.provider.toLowerCase()}/${connection.id}`
      : `/api/webhooks/${connection.provider.toLowerCase()}/${connection.id}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED_REAL":
      case "CONNECTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">🟢 Conectado e Ativo</span>;
      case "CONNECTING":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">🟡 Conectando</span>;
      case "DISCONNECTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">⛔ Desconectado</span>;
      case "ERROR":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">🔴 Erro</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">⚪ {status}</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back link & Header */}
      <div>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Central de Integrações
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
              <KeyRound className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white capitalize">{providerDef?.name || connection.provider}</h1>
                {getStatusBadge(connection.status)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tipo: <strong className="text-slate-300 capitalize">{connection.type.toLowerCase() === "channel" ? "Canal de Mensagens" : "Marketplace"}</strong>
                {connection.externalAccountName && (
                  <> • Conta / Canal: <strong className="text-indigo-400">{connection.externalAccountName}</strong></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleHealthCheck}
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
              {isTesting ? "Testando..." : "Testar Conexão"}
            </button>

            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" /> Desconectar
            </button>
          </div>
        </div>
      </div>

      {/* Result feedback alert */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
            testResult.success
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-xs opacity-70 hover:opacity-100 ml-4">✕ Fechar</button>
        </div>
      )}

      {/* Main Status & Autopilot Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Autopilot Switch Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Publicação Automática (Autopilot)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permite que o robô envie ofertas garimpadas automaticamente para esta conexão sem necessidade de aprovação manual a cada postagem.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={progress?.enabledForAutopilot ?? true}
                onChange={(e) => handleToggleAutopilot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Status operacional:</span>
            <span className={`font-semibold ${progress?.enabledForAutopilot ? "text-emerald-400" : "text-slate-400"}`}>
              {progress?.enabledForAutopilot ? "✓ Liberado para Autopilot" : "Pausado"}
            </span>
          </div>
        </div>

        {/* Webhook & Sync Details Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" /> Webhook & Sincronização
            </div>
            <p className="text-xs text-slate-400">
              Endpoint para recebimento de atualizações de status e eventos em tempo real.
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="bg-transparent text-xs text-slate-300 flex-1 outline-none font-mono truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Copiar URL do Webhook"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Última validação:</span>
            <span className="text-slate-300 font-mono">
              {connection.lastValidatedAt ? new Date(connection.lastValidatedAt).toLocaleString("pt-BR") : "Recentemente"}
            </span>
          </div>
        </div>
      </div>

      {/* Target Destination & Quick Send (For messaging channels) */}
      {isChannel && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-400" /> Canal ou Grupo de Destino
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina o Chat ID, @username do canal público ou número de telefone onde as ofertas serão publicadas.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDestination} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Ex: @meucanaldeofertas ou -100123456789"
              className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSavingDestination || !destinationInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all"
            >
              {isSavingDestination ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar Destino
            </button>
            <button
              type="button"
              onClick={handleExecuteQuickTestSend}
              disabled={isSendingTest || !destinationInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-50 rounded-xl transition-all"
            >
              <Send className={`w-4 h-4 ${isSendingTest ? "animate-spin" : ""}`} />
              {isSendingTest ? "Enviando..." : "Disparar Teste"}
            </button>
          </form>

          {destinationResult && (
            <div className={`p-3 rounded-xl text-xs ${destinationResult.success ? "bg-emerald-950/30 text-emerald-300 border border-emerald-500/30" : "bg-red-950/30 text-red-300 border border-red-500/30"}`}>
              {destinationResult.message}
            </div>
          )}

          {testSendResult && (
            <div className={`p-3 rounded-xl text-xs ${testSendResult.success ? "bg-emerald-950/30 text-emerald-300 border border-emerald-500/30" : "bg-red-950/30 text-red-300 border border-red-500/30"}`}>
              {testSendResult.message}
            </div>
          )}
        </div>
      )}

      {/* Edit / Update Credentials Collapsible */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Credenciais da Integração
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Suas chaves estão protegidas por criptografia AES-256-GCM.
            </p>
          </div>
          <button
            onClick={() => setIsEditingCredentials(!isEditingCredentials)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isEditingCredentials ? "Cancelar Edição" : "Editar Credenciais"}
          </button>
        </div>

        {isEditingCredentials && (
          <form onSubmit={handleSaveCredentials} className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            {providerDef?.requiredFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentialForm[field.key] ?? ""}
                  onChange={(e) => setCredentialForm({ ...credentialForm, [field.key]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {field.helperText && <p className="text-[11px] text-slate-500">{field.helperText}</p>}
              </div>
            ))}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditingCredentials(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingCredentials}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all disabled:opacity-50"
              >
                {isSavingCredentials ? "Salvando..." : "Salvar Novas Credenciais"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Activity / Audit Logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-400" /> Registro de Atividades
        </h2>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Nenhum registro de atividade recente.</p>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-300">{log.action}</span>
                  {log.details && <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
