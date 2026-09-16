"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Lock,
  KeyRound,
  Activity,
  Copy,
  Check,
  Radio,
  FileText,
  Clock,
  Trash2,
  Play,
  FileCheck2,
  Send,
  Sparkles,
  Zap,
  Info,
  ExternalLink,
  MessageSquare,
  Hash,
  Shield,
  CheckCheck,
} from "lucide-react";

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

interface VerificationRecord {
  id: string;
  capability: string;
  step: string;
  status: string;
  requestId: string | null;
  externalReference: string | null;
  responseSummary: string | null;
  errorCode: string | null;
  performedBy: string;
  source: string;
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
  verificationsCount?: number;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = params.id as string;

  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [progress, setProgress] = useState<ActivationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateForm, setRotateForm] = useState<Record<string, string>>({});
  const [isSubmittingRotation, setIsSubmittingRotation] = useState(false);

  // Preflight state
  const [preflightData, setPreflightData] = useState<any | null>(null);
  const [isPreflightRunning, setIsPreflightRunning] = useState(false);

  // Destination configuration state
  const [destinationInput, setDestinationInput] = useState("");
  const [isSavingDestination, setIsSavingDestination] = useState(false);
  const [destinationResult, setDestinationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test send state
  const [testSendDestination, setTestSendDestination] = useState("");
  const [testSendConfirmed, setTestSendConfirmed] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Webhook state
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  // Promoting state
  const [isPromoting, setIsPromoting] = useState(false);

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
        setVerifications(progData.verifications || []);
        if (progData.progress?.targetDestination && !destinationInput) {
          setDestinationInput(progData.progress.targetDestination);
          setTestSendDestination(progData.progress.targetDestination);
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
        message: data.message || (data.success ? "Health check oficial validado com sucesso!" : data.error || "Falha na validação."),
      });
      fetchConnectionData();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Erro de rede" });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePreflight = async () => {
    setIsPreflightRunning(true);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "PREFLIGHT" }),
      });
      const data = await res.json();
      setPreflightData(data.preflight || null);
      fetchConnectionData();
    } catch (err: any) {
      console.error("Erro ao rodar preflight:", err);
    } finally {
      setIsPreflightRunning(false);
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
        setDestinationResult({ success: true, message: `Canal/Chat de destino configurado: ${data.destination}` });
        setTestSendDestination(data.destination);
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

  const handleExecuteTestSend = async () => {
    if (!testSendConfirmed) return;
    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: testSendDestination || undefined,
          confirmed: true,
        }),
      });
      const data = await res.json();
      setTestSendResult({
        success: data.success,
        message: data.message || data.error || "Erro no envio de teste.",
      });
      fetchConnectionData();
    } catch (err: any) {
      setTestSendResult({ success: false, message: err.message || "Erro de rede." });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleConfigureWebhook = async () => {
    setIsRegisteringWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "WEBHOOK",
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookResult({ success: true, message: data.message || "Webhook registrado com sucesso no Telegram!" });
        fetchConnectionData();
      } else {
        setWebhookResult({ success: false, message: data.error || "Falha ao registrar webhook." });
      }
    } catch (err: any) {
      setWebhookResult({ success: false, message: err.message || "Erro de rede." });
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const handlePromoteVerified = async () => {
    setIsPromoting(true);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "PROMOTE_TO_VERIFIED_REAL",
          enabledForAutopilot: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível homologar.");
      } else {
        fetchConnectionData();
      }
    } catch (err: any) {
      alert(err.message || "Erro de rede.");
    } finally {
      setIsPromoting(false);
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

  const handleRotateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRotation(true);
    try {
      const res = await fetch(`/api/integrations/${connectionId}/activation-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "CONFIGURE",
          credentials: rotateForm,
        }),
      });
      if (res.ok) {
        setIsRotating(false);
        setRotateForm({});
        fetchConnectionData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar credenciais.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de rede");
    } finally {
      setIsSubmittingRotation(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar esta integração? As credenciais locais serão removidas.")) {
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

  const isVerifiedReal = connection.status === "VERIFIED_REAL";
  const completedSteps = progress?.stepsCompleted || [];
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/${connection.provider.toLowerCase()}/${connection.id}`
      : `/api/webhooks/${connection.provider.toLowerCase()}/${connection.id}`;

  const isTelegram = connection.provider.toUpperCase() === "TELEGRAM";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED_REAL":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">🟢 VERIFIED_REAL (Homologado)</span>;
      case "CONNECTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">🔵 Conectado</span>;
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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Back link & Header */}
      <div>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Central de Conexões
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
              <KeyRound className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white capitalize">{connection.provider}</h1>
                {getStatusBadge(connection.status)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tipo: <strong className="text-slate-300 capitalize">{connection.type.toLowerCase()}</strong> • Auth:{" "}
                <strong className="text-slate-300">{connection.authType}</strong>
                {connection.externalAccountName && (
                  <> • Conta/Bot: <strong className="text-indigo-400">{connection.externalAccountName}</strong></>
                )}
                {progress?.targetDestination && (
                  <> • Destino: <strong className="text-purple-400">{progress.targetDestination}</strong></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePreflight}
              disabled={isPreflightRunning}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all"
            >
              {isPreflightRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Executar Preflight
            </button>

            <button
              onClick={handleHealthCheck}
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
              Health Check Oficial
            </button>

            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
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
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-xs opacity-70 hover:opacity-100">✕ Fechar</button>
        </div>
      )}

      {/* Telegram Guided Assistant Banner (If Telegram) */}
      {isTelegram && (
        <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-sky-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Assistente de Homologação Telegram Bot API (Fase 7.3)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Siga os passos guiados abaixo para validar seu bot oficial no Telegram. O processo conecta diretamente à API oficial <code className="bg-slate-950 px-1.5 py-0.5 rounded text-sky-300">https://api.telegram.org</code> com armazenamento imutável de evidências de verificação.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">1</span>
                  <span>Crie o bot no <strong>@BotFather</strong> e obtenha o Token</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">2</span>
                  <span>Adicione o bot como <strong>Administrador</strong> no Canal</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">3</span>
                  <span>Defina o Chat ID ou <strong>@canal</strong> e valide o envio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Pipeline Stepper (Phase 7.3) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Esteira de Ativação Real & Homologação
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Etapas obrigatórias para promover esta conexão a <strong className="text-emerald-400">VERIFIED_REAL</strong> com evidências físicas no banco de dados.
            </p>
          </div>
          {isVerifiedReal ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ✓ 100% Homologado Real
            </span>
          ) : (
            <button
              onClick={handlePromoteVerified}
              disabled={isPromoting || !completedSteps.includes("HEALTH_CHECK") || !completedSteps.includes("TEST_SEND")}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 rounded-xl shadow-md transition-all"
            >
              {isPromoting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Homologar para VERIFIED_REAL
            </button>
          )}
        </div>

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { id: "CONFIGURE", title: "1. Credenciais", desc: "AES-256-GCM" },
            { id: "PREFLIGHT", title: "2. Preflight", desc: "SSRF & Sintaxe" },
            { id: "HEALTH_CHECK", title: "3. Health Check", desc: "getMe oficial" },
            { id: "DESTINATION", title: "4. Destino", desc: "Chat ID / @canal" },
            { id: "TEST_SEND", title: "5. Teste de Envio", desc: "Mensagem confirmada" },
            { id: "WEBHOOK", title: "6. Webhook", desc: "Secret Token" },
          ].map((st) => {
            const isDone = completedSteps.includes(st.id);
            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isDone
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{st.title}</span>
                  {isDone ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{st.desc}</span>
              </div>
            );
          })}
        </div>

        {/* Autopilot & Real Dispatch Operational Control (Phase 8) */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" /> Disparo Real (Real Dispatch)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Habilita chamadas de saída à API oficial do Telegram para mensagens reais de ofertas.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isVerifiedReal ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
            }`}>
              {isVerifiedReal ? "🟢 ATIVADO" : "⚪ DESATIVADO"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Permissão para Publicação Automática do Autopiloto
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quando ativado, permite que ciclos autônomos do Autopiloto enviem ofertas para esta conexão quando VERIFIED_REAL.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={progress?.enabledForAutopilot ?? false}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (confirm("ATIVAR AUTOPILOT NO TELEGRAM\n\nO robô poderá publicar automaticamente ofertas aprovadas neste canal de acordo com os limites configurados.\n\nDeseja confirmar a ativação?")) {
                      handleToggleAutopilot(true);
                    }
                  } else {
                    handleToggleAutopilot(false);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Destination Configuration Card */}
      {(connection.type === "CHANNEL" || isTelegram) && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-400" /> Canal ou Grupo de Destino
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina o Chat ID numérico ou @username do canal público onde as mensagens serão postadas.
              </p>
            </div>
            {completedSteps.includes("DESTINATION") && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ✓ Destino Configurado
              </span>
            )}
          </div>

          <form onSubmit={handleSaveDestination} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  required
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Ex: -100123456789 ou @canal_ofertas_vip"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingDestination || !destinationInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl shadow-md transition-all"
              >
                {isSavingDestination ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Salvar Destino
              </button>
            </div>
          </form>

          {destinationResult && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                destinationResult.success
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/30 border-red-500/30 text-red-300"
              }`}
            >
              {destinationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              <span>{destinationResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Test Send Section (Interactive live testing with explicit confirmation) */}
      {(connection.type === "CHANNEL" || isTelegram) && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <Send className="w-5 h-5 text-indigo-400" /> Teste de Envio Controlado
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Dispare uma mensagem oficial de verificação. O sistema nunca envia mensagens reais silenciosamente ou automaticamente sem confirmação.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destino do Teste (Chat ID ou @canal):
              </label>
              <input
                type="text"
                value={testSendDestination}
                onChange={(e) => setTestSendDestination(e.target.value)}
                placeholder={isTelegram ? "Ex: @meu_canal_vip ou -100123456789" : "Ex: +5511999999999"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
                <input
                  type="checkbox"
                  checked={testSendConfirmed}
                  onChange={(e) => setTestSendConfirmed(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-[11px]">Confirmar envio real</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Mensagem padrão: <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300">🤖 Affiliate AI — teste de conexão realizado com sucesso.</code>
            </div>
            <button
              onClick={handleExecuteTestSend}
              disabled={!testSendConfirmed || isSendingTest}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-xl shadow-md transition-all"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Mensagem de Teste
            </button>
          </div>

          {testSendResult && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testSendResult.success
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/30 border-red-500/30 text-red-300"
              }`}
            >
              {testSendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              <span>{testSendResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Credentials & Webhook Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Encrypted Credentials Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" /> Credenciais Criptografadas
            </h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              AES-256-GCM
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            As chaves de API desta conexão estão criptografadas em repouso. Por segurança, tokens completos nunca são transmitidos ao navegador.
          </p>

          <div className="space-y-3 mb-6">
            {Object.entries(connection.credentials || {}).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300 font-mono capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-xs text-slate-500 font-mono">{String(val)}</span>
              </div>
            ))}
          </div>

          {isRotating ? (
            <form onSubmit={handleRotateCredentials} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Atualizar / Rotacionar Credenciais</h3>
              {Object.keys(connection.credentials || {}).map((key) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">{key}:</label>
                  <input
                    type="password"
                    required
                    value={rotateForm[key] || ""}
                    onChange={(e) => setRotateForm({ ...rotateForm, [key]: e.target.value })}
                    placeholder="Insira novo valor"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRotation}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  {isSubmittingRotation ? "Salvando..." : "Salvar Novas Credenciais"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRotating(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsRotating(true)}
              className="w-full py-2.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> Rotacionar Credenciais
            </button>
          )}
        </div>

        {/* Right: Webhook Configuration Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" /> Endpoint de Webhook
            </h2>
            <span className="text-[11px] text-slate-400">X-Telegram-Bot-Api-Secret-Token</span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Configure este endpoint no Telegram para receber atualizações instantâneas de mensagens e interações de canal.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 mb-4">
            <code className="text-xs text-indigo-300 font-mono truncate select-all">{webhookUrl}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopiedWebhook(true);
                setTimeout(() => setCopiedWebhook(false), 2000);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Copiar URL"
            >
              {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {isTelegram && (
            <div className="mb-4">
              <button
                onClick={handleConfigureWebhook}
                disabled={isRegisteringWebhook}
                className="w-full py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isRegisteringWebhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                Registrar Webhook Oficial (setWebhook)
              </button>

              {webhookResult && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    webhookResult.success
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                      : "bg-red-950/30 border-red-500/30 text-red-300"
                  }`}
                >
                  {webhookResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <span>{webhookResult.message}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Assinaturas HMAC / Secret Tokens verificados
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Deduplicação por chave única nas últimas 24h
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Resposta imediata HTTP 200 com fila assíncrona
            </div>
          </div>
        </div>
      </div>

      {/* Verification Evidence Log (Phase 7.3 IntegrationVerification) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Evidências Imutáveis de Homologação ({verifications.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registros físicos gravados no banco de dados comprovando cada etapa de validação executada.
            </p>
          </div>
          <button
            onClick={fetchConnectionData}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>

        {verifications.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Nenhuma evidência registrada ainda. Execute o Preflight ou Health Check.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Etapa</th>
                  <th className="py-2.5 px-3">Capacidade</th>
                  <th className="py-2.5 px-3">Referência / Resposta</th>
                  <th className="py-2.5 px-3">Origem</th>
                  <th className="py-2.5 px-3 text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {v.status === "PASSED" ? "✓ PASSED" : "✕ FAILED"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">{v.step}</td>
                    <td className="py-2.5 px-3 text-slate-400">{v.capability}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] max-w-xs truncate">
                      {v.externalReference || v.responseSummary || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {v.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(v.createdAt).toLocaleTimeString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" /> Histórico de Auditoria da Conexão
        </h2>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhum evento registrado ainda.</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] bg-slate-800 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-slate-400 ml-3">{log.details || "Sem detalhes adicionais"}</span>
                </div>
                <div className="text-right text-slate-500 text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
