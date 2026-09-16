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
} from "lucide-react";

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
          message: succ === "mercadolivre" ? "Mercado Livre conectado e autenticado com sucesso!" : "Conexão estabelecida com sucesso!",
        });
      }
    }
  }, []);

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

  const handleOpenConnect = (provider: ProviderItem) => {
    if (provider.id.toUpperCase() === "MERCADO_LIVRE") {
      // Direct OAuth authorization initiation for Mercado Livre
      window.location.href = "/api/integrations/oauth/mercadolivre/authorize";
      return;
    }

    setSelectedProvider(provider);
    const initialForm: Record<string, string> = {};
    provider.requiredFields.forEach((f) => {
      initialForm[f.key] = "";
    });
    setCredentialsForm(initialForm);
    setSubmitError(null);
    setConnectModalOpen(true);
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
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        VERIFIED_REAL
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {conn.status}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                          provider.initialStatus.includes("PRONTO")
                            ? "bg-slate-800 text-slate-300 border-slate-700"
                            : provider.initialStatus.includes("OAUTH")
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {provider.initialStatus}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-2">
                    {provider.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Capacidades Oficiais:</span>
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
                      <span className="text-slate-400">Conta:</span>
                      <strong className="text-indigo-400 font-mono">{conn.externalAccountName}</strong>
                    </div>
                  )}
                </div>

                {/* Footer / Action Button */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {provider.authType}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-500/20">
                      REAL
                    </span>
                  </div>

                  {conn ? (
                    <Link
                      href={`/integrations/${conn.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
                    >
                      Gerenciar <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleOpenConnect(provider)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-md transition-all ${
                        provider.initialStatus.includes("PRONTO")
                          ? "text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                          : provider.initialStatus.includes("OAUTH")
                          ? "text-white bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                          : "text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
                      }`}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {getProviderIcon(selectedProvider.id)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conectar {selectedProvider.name}</h3>
                  <p className="text-xs text-slate-400">{selectedProvider.categoryLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Insira as credenciais do seu provedor. Todas as chaves e segredos são armazenados de forma criptografada via <strong className="text-emerald-400">AES-256-GCM</strong> em repouso.
            </p>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSaveConnection} className="space-y-4">
              {selectedProvider.requiredFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {field.label} {field.required && <span className="text-red-400">*</span>}:
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={credentialsForm[field.key] || ""}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder || ""}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {field.helperText && (
                    <span className="text-[11px] text-slate-500 mt-1 block">{field.helperText}</span>
                  )}
                </div>
              ))}

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Após salvar, você será direcionado para o assistente de homologação e diagnóstico.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  Salvar e Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Stop Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <OctagonAlert className="w-6 h-6" />
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
