"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings,
  Radio,
  Zap,
  Lock,
  ArrowRight,
  Activity,
  Layers,
  Send,
  ShoppingBag,
  KeyRound,
  Check,
  Info,
  ShieldAlert,
  Play,
  OctagonAlert,
  Table,
  MessageSquare,
  Sparkles,
  ChevronRight,
  CheckCheck,
  QrCode,
  Smartphone,
  Copy,
} from "lucide-react";

interface SetupStep {
  title: string;
  description: string;
  linkUrl?: string;
  linkLabel?: string;
}

interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "textarea" | "url";
  placeholder?: string;
  helperText?: string;
  required: boolean;
}

interface ProviderItem {
  id: string;
  name: string;
  type: "CHANNEL" | "MARKETPLACE";
  authType: string;
  description: string;
  initialStatus: string;
  categoryLabel: string;
  actionButtonLabel: string;
  capabilitiesDisplay: string[];
  documentationUrl: string;
  setupGuide?: SetupStep[];
  capabilities: string[];
  isOfficiallySupported: boolean;
  requiredFields: ProviderField[];
}

interface Connection {
  id: string;
  provider: string;
  type: string;
  status: string;
  authType: string;
  credentials: Record<string, any>;
  externalAccountId: string | null;
  externalAccountName: string | null;
  capabilities: string[];
  lastValidatedAt: string | null;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

interface MatrixItem {
  providerId: string;
  providerName: string;
  type: string;
  capability: string;
  label: string;
  officialEvidence: boolean;
  officialSourceTitle: string;
  officialSourceUrl: string;
  authType: string;
  credentialsRequired: string[];
  hasCredentials: boolean;
  requiresApproval: boolean;
  accountRequirements: string;
  healthCheckPassed: boolean;
  realTestPassed: boolean;
  webhookConfigured: boolean;
  isVerifiedReal: boolean;
  enabledForAutopilot: boolean;
  isKillSwitchActive: boolean;
  status: string;
  verifiedAt: string;
  limitationsAndNotes: string;
}

interface DispatchConfig {
  realDispatchEnabled: boolean;
  providerSwitches: Record<string, boolean>;
  emergencyStopTriggeredAt: string | null;
  emergencyStopReason: string | null;
}

export default function IntegrationsPage() {
  const router = useRouter();

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([]);
  const [dispatchConfig, setDispatchConfig] = useState<DispatchConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "marketplaces" | "channels" | "connected" | "matrix">("all");

  // Emergency Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyConfirmInput, setEmergencyConfirmInput] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);

  // Connect Modal state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [credentialsForm, setCredentialsForm] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [urlNotification, setUrlNotification] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // WhatsApp Connection Mode
  const [waConnectMode, setWaConnectMode] = useState<"FACEBOOK" | "QRCODE" | "MANUAL">("FACEBOOK");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrExpiresIn, setQrExpiresIn] = useState(60);
  const [isLiveInstance, setIsLiveInstance] = useState(false);
  const [waInstanceUrl, setWaInstanceUrl] = useState("");
  const [waApiKey, setWaApiKey] = useState("");
  const [isPairingConfirming, setIsPairingConfirming] = useState(false);
  const [waPhoneNickname, setWaPhoneNickname] = useState("WhatsApp Grupo de Ofertas");

  useEffect(() => {
    fetchInitialData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const succ = params.get("success");
      if (err) {
        setUrlNotification({ type: "error", message: decodeURIComponent(err) });
      } else if (succ) {
        setUrlNotification({
          type: "success",
          message:
            succ === "whatsapp"
              ? "WhatsApp oficial conectado com sucesso via Meta Cloud API!"
              : succ === "mercadolivre"
              ? "Mercado Livre conectado e autenticado com sucesso!"
              : "Conexão estabelecida com sucesso!",
        });
      }
    }
  }, []);

  // QR Code Timer Effect
  useEffect(() => {
    let interval: any;
    if (connectModalOpen && selectedProvider?.id === "WHATSAPP" && waConnectMode === "QRCODE" && qrCodeData && qrExpiresIn > 0) {
      interval = setInterval(() => {
        setQrExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectModalOpen, selectedProvider, waConnectMode, qrCodeData, qrExpiresIn]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [provRes, connRes, matrixRes] = await Promise.all([
        fetch("/api/integrations/providers"),
        fetch("/api/integrations"),
        fetch("/api/integrations/matrix"),
      ]);

      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.providers || []);
      }

      if (connRes.ok) {
        const connData = await connRes.json();
        setConnections(connData.connections || []);
      }

      if (matrixRes.ok) {
        const mData = await matrixRes.json();
        setMatrixData(mData.matrix || []);
        setDispatchConfig(mData.dispatchConfig || null);
      }
    } catch (err) {
      console.error("Erro ao carregar integrações:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/integrations/whatsapp/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceUrl: waInstanceUrl.trim() || undefined,
          apiKey: waApiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar QR Code");
      setQrCodeData(data.qrCodeUrl);
      setQrSessionId(data.sessionId);
      setIsLiveInstance(!!data.isLiveInstance);
      setQrExpiresIn(data.expiresInSeconds || 60);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao gerar QR Code");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleConfirmQrPairing = async () => {
    setIsPairingConfirming(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/integrations/whatsapp/qrcode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: qrSessionId,
          instanceUrl: waInstanceUrl.trim() || undefined,
          apiKey: waApiKey.trim() || undefined,
          phoneNickname: waPhoneNickname || "WhatsApp Grupo de Ofertas VIP",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao confirmar pareamento.");

      setConnectModalOpen(false);
      setUrlNotification({
        type: "success",
        message: "WhatsApp conectado com sucesso via Evolution API!",
      });
      fetchInitialData();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao confirmar conexão.");
    } finally {
      setIsPairingConfirming(false);
    }
  };

  const handleOpenConnect = (provider: ProviderItem) => {
    setSelectedProvider(provider);
    const initialForm: Record<string, string> = {};
    provider.requiredFields.forEach((f) => {
      initialForm[f.key] = "";
    });
    setCredentialsForm(initialForm);
    setSubmitError(null);
    setConnectModalOpen(true);

    if (provider.id.toUpperCase() === "WHATSAPP") {
      setWaConnectMode("FACEBOOK");
      setQrCodeData(null);
      setQrSessionId(null);
      setWaPhoneNickname("WhatsApp Grupo de Ofertas");
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.id,
          credentials: credentialsForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar conexão.");
      }

      setConnectModalOpen(false);
      // Immediately navigate to the guided activation page for this connection
      if (data.connection?.id) {
        router.push(`/integrations/${data.connection.id}`);
      } else {
        fetchInitialData();
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao conectar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerEmergencyStop = async () => {
    if (emergencyConfirmInput !== "PARAR") return;
    setIsSubmittingEmergency(true);
    try {
      const res = await fetch("/api/integrations/emergency-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: "PARAR",
          reason: emergencyReason || "Parada de emergência acionada pelo operador.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmergencyModalOpen(false);
        setEmergencyConfirmInput("");
        setEmergencyReason("");
        fetchInitialData();
      } else {
        alert(data.error || "Erro ao acionar Parada de Emergência.");
      }
    } catch (err) {
      console.error("Erro no Emergency Stop:", err);
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id.toUpperCase()) {
      case "TELEGRAM":
        return <Send className="w-6 h-6 text-sky-400" />;
      case "DISCORD":
        return <MessageSquare className="w-6 h-6 text-indigo-400" />;
      case "WHATSAPP":
        return <Radio className="w-6 h-6 text-emerald-400" />;
      case "MERCADO_LIVRE":
        return <ShoppingBag className="w-6 h-6 text-amber-400" />;
      case "SHOPEE":
        return <ShoppingBag className="w-6 h-6 text-orange-400" />;
      case "AMAZON":
        return <Layers className="w-6 h-6 text-amber-500" />;
      default:
        return <KeyRound className="w-6 h-6 text-indigo-400" />;
    }
  };

  // Filtered providers
  const filteredProviders = providers.filter((p) => {
    if (activeTab === "marketplaces") return p.type === "MARKETPLACE";
    if (activeTab === "channels") return p.type === "CHANNEL";
    if (activeTab === "connected") {
      return connections.some((c) => c.provider.toUpperCase() === p.id.toUpperCase());
    }
    return true;
  });

  const isGlobalLiveEnabled = dispatchConfig?.realDispatchEnabled ?? false;
  const connectedCount = connections.filter((c) => c.status === "VERIFIED_REAL" || c.status === "CONNECTED").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Kill Switch & Emergency Stop Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
          isGlobalLiveEnabled
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
            : "bg-amber-950/40 border-amber-500/40 text-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
              isGlobalLiveEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {isGlobalLiveEnabled ? <Zap className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {isGlobalLiveEnabled ? "🟢 ENVIO REAL ATIVADO (PRODUÇÃO)" : "🟡 ENVIO REAL GLOBAL DESATIVADO (MODO SEGURO)"}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
                Kill Switch
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isGlobalLiveEnabled
                ? "Publicações reais permitidas somente para canais VERIFIED_REAL com permissão do Autopiloto."
                : "Nenhum canal externo recebe publicações automáticas silenciosamente. Pings, diagnósticos e testes controlados continuam disponíveis."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-200 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-xl shadow-md transition-all"
          >
            <OctagonAlert className="w-4 h-4 text-red-400" /> Parada de Emergência
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-indigo-400" /> Central de Conexões & Integrações
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conecte marketplaces e canais para permitir que o Robô do Afiliado encontre oportunidades, gere ofertas e distribua seu conteúdo automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/integrations/webhooks"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-sm"
          >
            <Radio className="w-4 h-4 text-purple-400" /> Logs de Webhook
          </Link>
          <button
            onClick={fetchInitialData}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all"
            title="Recarregar integrações"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL Error / Success Feedback Banner */}
      {urlNotification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
            urlNotification.type === "error"
              ? "bg-red-950/40 border-red-500/40 text-red-200"
              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {urlNotification.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs">
                {urlNotification.type === "error" ? "Aviso de Configuração:" : "Sucesso:"}
              </span>{" "}
              <span className="text-xs">{urlNotification.message}</span>
            </div>
          </div>
          <button
            onClick={() => setUrlNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium">Provedores Disponíveis</span>
          <div className="text-2xl font-bold text-white mt-1">{providers.length || 6}</div>
          <span className="text-[11px] text-indigo-400 mt-0.5 block font-semibold">
            Marketplaces e Canais Oficiais
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium">Minhas Conexões Ativas</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{connectedCount}</div>
          <span className="text-[11px] text-emerald-400/80 mt-0.5 block font-semibold">
            {connectedCount > 0 ? "Pronto para disparo" : "Nenhuma conectada ainda"}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium">Segurança de Credenciais</span>
          <div className="text-2xl font-bold text-white mt-1">AES-256</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Criptografia em repouso</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium">Proteção SSRF & Sandbox</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">Ativo</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Zero Scraping / APIs Oficiais</span>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Todos ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab("marketplaces")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "marketplaces" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Marketplaces ({providers.filter((p) => p.type === "MARKETPLACE").length})
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "channels" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Canais ({providers.filter((p) => p.type === "CHANNEL").length})
        </button>
        <button
          onClick={() => setActiveTab("connected")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "connected" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Conectadas ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "matrix" ? "bg-purple-600 text-white shadow-sm" : "text-purple-400 hover:text-purple-200 hover:bg-purple-950/30"
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Matriz de Capacidades ({matrixData.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "matrix" ? (
        /* Matrix Table View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-purple-400" /> Matriz de Capacidades Técnicas
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreabilidade de cada capacidade oficial, suporte no Brasil e evidência técnica auditada.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{matrixData.length} capacidades</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Provedor</th>
                  <th className="py-3 px-4">Capacidade</th>
                  <th className="py-3 px-4 text-center">Evidência</th>
                  <th className="py-3 px-4">Auth</th>
                  <th className="py-3 px-4 text-center">Credenciais</th>
                  <th className="py-3 px-4 text-center">Health Check</th>
                  <th className="py-3 px-4 text-center">Teste Real</th>
                  <th className="py-3 px-4 text-center">Webhook</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Última Verificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrixData.map((item, idx) => (
                  <tr key={`${item.providerId}_${item.capability}_${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {item.providerName}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      <div>{item.label}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.capability}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.officialEvidence ? (
                        <span className="text-emerald-400 font-bold" title={item.officialSourceTitle}>✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {item.authType}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.hasCredentials ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-amber-400 font-mono text-[10px]">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.healthCheckPassed ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.realTestPassed ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.webhookConfigured ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "VERIFIED_REAL"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : item.status === "REQUIRES_APPROVAL"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : item.status === "REQUIRES_CREDENTIALS"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {item.verifiedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "connected" && filteredProviders.length === 0 ? (
        /* Empty State for Connected Tab */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Você ainda não possui integrações conectadas.</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Escolha uma das plataformas disponíveis abaixo (Telegram, Discord, WhatsApp, Mercado Livre, Shopee ou Amazon) para começar a automatizar suas publicações e buscas de ofertas.
          </p>
          <button
            onClick={() => setActiveTab("all")}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Ver Provedores Disponíveis
          </button>
        </div>
      ) : (
        /* Provider Cards Grid (3 on Desktop, 2 on Tablet, 1 on Mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => {
            const conn = connections.find((c) => c.provider.toUpperCase() === provider.id.toUpperCase());
            const isVerified = conn && conn.status === "VERIFIED_REAL";
            const isConnected = conn && (conn.status === "CONNECTED" || conn.status === "VERIFIED_REAL");

            return (
              <div
                key={provider.id}
                className={`flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 shadow-md ${
                  isVerified
                    ? "bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-950/20"
                    : isConnected
                    ? "bg-slate-900/90 border-indigo-500/30 hover:border-indigo-500/50"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                        {getProviderIcon(provider.id)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{provider.name}</h3>
                        <span className="text-[11px] text-slate-400 block">{provider.categoryLabel}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Conectado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        Não integrado
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed min-h-[36px]">
                    {provider.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recursos Disponíveis:</span>
                    {provider.capabilitiesDisplay.map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* Account Name if Connected */}
                  {conn?.externalAccountName && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-4 flex items-center justify-between">
                      <span className="text-slate-400">Conta / Canal:</span>
                      <strong className="text-indigo-400 font-mono">{conn.externalAccountName}</strong>
                    </div>
                  )}
                </div>

                {/* Footer / Action Button */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {isConnected ? "🟢 Ativo no Robô" : "⚪ Disponível"}
                    </span>
                  </div>

                  {conn ? (
                    <Link
                      href={`/integrations/${conn.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
                    >
                      Gerenciar <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleOpenConnect(provider)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 rounded-xl shadow-md transition-all"
                    >
                      {provider.actionButtonLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
       {/* Dynamic Connection Configuration Modal */}
      {connectModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-auto max-h-[92vh] flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  {getProviderIcon(selectedProvider.id)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conectar {selectedProvider.name}</h3>
                  <p className="text-xs text-slate-400">{selectedProvider.categoryLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="overflow-y-auto pr-1 space-y-5 flex-1">
              {/* WhatsApp Specific: Mode Selector (Facebook OAuth vs. QR Code vs. Manual API) */}
              {selectedProvider.id.toUpperCase() === "WHATSAPP" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWaConnectMode("FACEBOOK")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      waConnectMode === "FACEBOOK"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    🔵 Login Facebook (Grátis)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWaConnectMode("QRCODE");
                      if (!qrCodeData) handleGenerateQrCode();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      waConnectMode === "QRCODE"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    📱 Instância / QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaConnectMode("MANUAL")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      waConnectMode === "MANUAL"
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    ⚙️ API Manual
                  </button>
                </div>
              )}

              {/* WhatsApp Mode 1: Meta WhatsApp Cloud API via Facebook Login (1-Click Embedded Flow) */}
              {selectedProvider.id.toUpperCase() === "WHATSAPP" && waConnectMode === "FACEBOOK" ? (
                <div className="space-y-4">
                  {/* Meta Cloud API Highlight Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 border border-blue-500/30 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>Meta WhatsApp Cloud API Oficial</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        1.000 msgs/mês GRÁTIS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Conecte seu WhatsApp comercial em <strong>1 clique</strong> fazendo login com sua conta do Facebook. Sem precisar de servidor externo, sem QR Code expirando e 100% oficial pela Meta.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Zero Risco de Banimento</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Sem Celular Conectado</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>100% Gratuito (Até 1k msgs)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Envio em Grupos e Canais</span>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Summary */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      🚀 Como funciona a conexão em 1 clique:
                    </span>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/30 mt-0.5">
                          1
                        </span>
                        <div>
                          <strong className="text-white">Clique no botão azul abaixo:</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Você será redirecionado para a janela segura de autorização oficial do Facebook / Meta.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/30 mt-0.5">
                          2
                        </span>
                        <div>
                          <strong className="text-white">Selecione seu Perfil e Número:</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Escolha sua conta comercial existente ou crie uma conta WhatsApp Business instantaneamente.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/30 mt-0.5">
                          3
                        </span>
                        <div>
                          <strong className="text-white">Pronto para Enviar Ofertas:</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            O robô salva seu canal verificado e começa a disparar promoções automáticas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Big Action Button */}
                  <div className="pt-2">
                    <a
                      href="/api/integrations/oauth/whatsapp/authorize"
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Conectar com Facebook (WhatsApp Oficial)</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setConnectModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Fechar
                    </button>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Conexão direta com a API da Meta</span>
                    </div>
                  </div>
                </div>
              ) : selectedProvider.id.toUpperCase() === "WHATSAPP" && waConnectMode === "QRCODE" ? (
                <div className="space-y-4">
                  {/* Evolution API Requirement & Free Tier Notice */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>A Evolution API é 100% Gratuita & Open-Source</span>
                      </div>
                      <a
                        href="https://github.com/EvolutionAPI/evolution-api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1"
                      >
                        GitHub Oficial <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <strong>Você não precisa pagar nada:</strong> os planos pagos no site oficial são apenas hospedagem opcional. A Evolution API é um projeto de código aberto gratuito que você pode rodar <strong>100% de graça</strong> no seu próprio computador (Docker) ou em servidores gratuitos como <strong>Render, Koyeb, Railway ou Oracle Cloud</strong>.
                    </p>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      📋 Passo a Passo para Conectar:
                    </span>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-indigo-500/30 mt-0.5">
                          1
                        </span>
                        <div>
                          <strong className="text-white">Pegar a URL da Instância:</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Copie o endereço do seu servidor onde a Evolution API está instalada (ex: <code className="text-indigo-400 font-mono">https://api.meuzap.com</code> ou <code className="text-indigo-400 font-mono">https://evolution-app.up.railway.app</code>).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-indigo-500/30 mt-0.5">
                          2
                        </span>
                        <div>
                          <strong className="text-white">Pegar a Chave de API (ApiKey):</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            No painel ou arquivo de configuração da sua Evolution API, copie a sua chave de autenticação (<code className="text-indigo-400 font-mono">AUTHENTICATION_API_KEY</code> ou token da instância).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-indigo-500/30 mt-0.5">
                          3
                        </span>
                        <div>
                          <strong className="text-white">Buscar e Escanear o QR Code Real:</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Preencha os campos abaixo, clique no botão para buscar o QR Code oficial gerado pelo WhatsApp e aponte a câmera do seu celular (Menu do WhatsApp &gt; <strong>Aparelhos Conectados</strong>).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Container & Instance Inputs */}
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                    {/* Instance Inputs */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-400" />
                          Dados da sua Instância Evolution API:
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                            1. URL da Evolution API / Servidor:
                          </label>
                          <input
                            type="url"
                            value={waInstanceUrl}
                            onChange={(e) => setWaInstanceUrl(e.target.value)}
                            placeholder="Ex: https://api.meuzap.com ou https://evolution-app.up.railway.app"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                            2. Chave de API (ApiKey / Token Global):
                          </label>
                          <input
                            type="password"
                            value={waApiKey}
                            onChange={(e) => setWaApiKey(e.target.value)}
                            placeholder="Cole sua AUTHENTICATION_API_KEY"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {isGeneratingQr ? (
                      <div className="py-12 space-y-3">
                        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">Buscando QR Code ao vivo do WhatsApp na Evolution API...</p>
                      </div>
                    ) : qrCodeData ? (
                      <div className="space-y-3">
                        {isLiveInstance && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            QR Code Real da Instância WhatsApp Carregado com Sucesso!
                          </div>
                        )}
                        <div className="inline-block p-3 rounded-2xl bg-white shadow-2xl shadow-emerald-500/10 border-4 border-emerald-500/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrCodeData}
                            alt="QR Code de Conexão WhatsApp"
                            className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-lg"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          {qrExpiresIn > 0 ? (
                            <span className="text-emerald-400 font-mono flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              QR Code válido por {qrExpiresIn}s
                            </span>
                          ) : (
                            <span className="text-red-400 font-semibold">QR Code expirado</span>
                          )}
                          <button
                            type="button"
                            onClick={handleGenerateQrCode}
                            className="text-[11px] text-slate-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" /> Atualizar QR Code
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 space-y-3">
                        <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                        <button
                          type="button"
                          onClick={handleGenerateQrCode}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          ⚡ Buscar QR Code Oficial do WhatsApp
                        </button>
                      </div>
                    )}

                    {/* Nickname Field */}
                    <div className="text-left max-w-sm mx-auto space-y-1 pt-2">
                      <label className="text-[11px] font-semibold text-slate-400 block">
                        Nome / Identificador do WhatsApp (Opcional):
                      </label>
                      <input
                        type="text"
                        value={waPhoneNickname}
                        onChange={(e) => setWaPhoneNickname(e.target.value)}
                        placeholder="Ex: WhatsApp Grupo de Ofertas VIP"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Telegram Recommendation Alert */}
                  <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-1">
                      <strong className="text-blue-300 block font-semibold">Dica para Afiliados: Telegram sem complicações</strong>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        Para canais e grupos de ofertas sem necessidade de manter o celular ligado ou pagar servidores, o <strong>Telegram</strong> conecta em 30 segundos com 100% de estabilidade e sem risco de banimento.
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setConnectModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isPairingConfirming || !qrCodeData}
                      onClick={handleConfirmQrPairing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                    >
                      {isPairingConfirming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                      ✅ Já Escaneei / Confirmar Conexão
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard / Advanced Manual Form */
                <div className="space-y-4">
                  {/* Commission Notice */}
                  {selectedProvider.type === "MARKETPLACE" && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-400 block font-semibold mb-0.5">
                          Comissionamento 100% Direto na sua Conta
                        </strong>
                        Ao salvar sua Tag / Credenciais de Afiliado, o robô automaticamente anexará seu código em todos os links e ofertas geradas para que as comissões caiam diretamente no seu saldo do marketplace.
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Setup Guide */}
                  {selectedProvider.setupGuide && selectedProvider.setupGuide.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-primary-400" />
                          Passo a Passo para Obter suas Credenciais:
                        </span>
                        {selectedProvider.documentationUrl && (
                          <a
                            href={selectedProvider.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-primary-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            Portal Oficial <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {selectedProvider.setupGuide.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-primary/30 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-200 block">{step.title}</span>
                              <p className="text-slate-400 leading-relaxed text-[11px]">{step.description}</p>
                              {step.linkUrl && (
                                <a
                                  href={step.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-medium mt-0.5"
                                >
                                  <span>{step.linkLabel || "Abrir Portal"}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSaveConnection} className="space-y-4">
                    {selectedProvider.requiredFields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">
                            {field.label} {field.required ? <span className="text-red-400">*</span> : <span className="text-slate-500 font-normal">(Opcional)</span>}:
                          </label>
                        </div>
                        <input
                          type={field.type}
                          required={field.required}
                          value={credentialsForm[field.key] || ""}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                        />
                        {field.helperText && (
                          <span className="text-[11px] text-slate-400 block">{field.helperText}</span>
                        )}
                      </div>
                    ))}

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Credenciais criptografadas via AES-256-GCM em repouso no banco de dados.</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      {selectedProvider.id.toUpperCase() === "MERCADO_LIVRE" ? (
                        <a
                          href="/api/integrations/oauth/mercadolivre/authorize"
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Autenticar via OAuth Developers</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span />}

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setConnectModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                          Salvar Credenciais
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Stop Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-slate-900 border border-red-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-3 text-red-400">
              <OctagonAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Acionar Parada de Emergência</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta ação desativa imediatamente todos os envios reais globais e cancela todas as publicações pendentes na fila do robô.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Motivo do Bloqueio:</label>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="Ex: Auditoria de segurança ou manutenção"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Digite <strong className="text-red-400 font-mono">PARAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={emergencyConfirmInput}
                onChange={(e) => setEmergencyConfirmInput(e.target.value)}
                placeholder="PARAR"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={emergencyConfirmInput !== "PARAR" || isSubmittingEmergency}
                onClick={handleTriggerEmergencyStop}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl shadow-md transition-all"
              >
                {isSubmittingEmergency ? "Parando..." : "Confirmar Bloqueio Total"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
