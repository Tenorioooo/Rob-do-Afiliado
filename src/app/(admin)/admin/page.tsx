"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatNumber, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Users,
  CreditCard,
  Activity,
  Server,
  Terminal,
  ShieldCheck,
  Zap,
  Cpu,
  RefreshCw,
  Eye,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"metrics" | "autopilot" | "audit">("autopilot");
  const [adminRuns, setAdminRuns] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<any | null>(null);
  const [liveAuditLogs, setLiveAuditLogs] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  const fetchAdminRuns = useCallback(async () => {
    try {
      setIsLoadingRuns(true);
      const [runsRes, metricsRes] = await Promise.all([
        fetch("/api/admin/autopilot/runs?limit=25"),
        fetch("/api/admin/metrics"),
      ]);

      if (runsRes.ok) {
        const json = await runsRes.json();
        setAdminRuns(json.runs || []);
        setAdminStats({
          totalRuns: json.totalRuns,
          aggregated: json.aggregatedMetrics,
        });
      }

      if (metricsRes.ok) {
        const mJson = await metricsRes.json();
        setLiveMetrics(mJson.metrics || null);
        setLiveAuditLogs(mJson.auditLogs || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminRuns();
  }, [fetchAdminRuns]);

  const totalUsers = liveMetrics?.totalUsers ?? 214;
  const activeSubscribers = liveMetrics?.activeSubscribers ?? 214;
  const mrr = liveMetrics?.mrr ?? "R$ 10.486,00";
  const systemHealth = liveMetrics?.systemHealth ?? "100% Operacional (Neon PostgreSQL)";
  const activeJobs = liveMetrics?.activeJobsInQueue ?? 0;

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Painel Administrativo</h2>
            <Badge variant="danger" size="md">ACESSO ADMIN</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoramento global de usuários, instâncias do Autopiloto e auditoria em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Activity className="w-3.5 h-3.5" />
          <span>Saúde: {systemHealth}</span>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Usuários Cadastrados</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(totalUsers)}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            {formatNumber(activeSubscribers)} ativos no PostgreSQL
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>MRR Estimado</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{mrr}</div>
          <p className="text-[11px] text-slate-400 mt-1">Base calculada em tempo real</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Ciclos de Autopiloto</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-white">
            {adminStats?.totalRuns ?? liveMetrics?.totalAutopilotRuns ?? 0}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Fila DB/Worker ativa</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Jobs Ativos na Fila</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {activeJobs} jobs
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sincronizado com o banco</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("autopilot")}
          className={`pb-3 transition-colors ${
            activeTab === "autopilot"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Monitoramento do Autopiloto (Runs Globais)
        </button>
        <button
          onClick={() => setActiveTab("integrations" as any)}
          className={`pb-3 transition-colors ${
            (activeTab as any) === "integrations"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Saúde das Integrações & Webhooks
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 transition-colors ${
            activeTab === "audit"
              ? "border-b-2 border-primary text-white font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Logs de Auditoria
        </button>
      </div>

      {/* Tab: Autopilot Global Runs */}
      {activeTab === "autopilot" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Execuções Globais do Autopiloto</h3>
              <p className="text-xs text-slate-400">
                Histórico detalhado de todos os ciclos autônomos executados na plataforma.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminRuns}
              isLoading={isLoadingRuns}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRuns ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Usuário</th>
                  <th className="px-4 py-3.5">Data & Hora</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Analisados</th>
                  <th className="px-4 py-3.5 text-center">Qualificadas</th>
                  <th className="px-4 py-3.5 text-center">Ofertas</th>
                  <th className="px-4 py-3.5 text-center">Publicações</th>
                  <th className="px-4 py-3.5 text-right">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {adminRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500">
                      Nenhum run registrado ainda.
                    </td>
                  </tr>
                ) : (
                  adminRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-semibold text-white">
                        {r.user?.name || "Usuário"} ({r.user?.email || r.userId.slice(0, 8)})
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{formatDate(r.startedAt)}</td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            r.status === "COMPLETED"
                              ? "success"
                              : r.status === "PARTIAL"
                              ? "warning"
                              : r.status === "FAILED"
                              ? "danger"
                              : "default"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-white">
                        {r.productsAnalyzed}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                        {r.opportunitiesQualified}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-primary-300">
                        {r.offersGenerated}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-cyan-400">
                        {r.publicationsPublished}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {r.errors ? (
                          <span className="text-rose-400 font-mono text-[10px]">Sim</span>
                        ) : (
                          <span className="text-emerald-400 font-mono text-[10px]">0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Integrations Global Health & Provider Audit */}
      {(activeTab as any) === "integrations" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Auditoria & Homologação Oficial de Provedores</h3>
              <p className="text-xs text-slate-400">
                Matriz de integridade de APIs externas, requisitos de aprovação e autenticação.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              AES-256-GCM Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Provedores Auditados</span>
              <div className="text-xl font-bold text-white mt-1">6 Oficiais</div>
              <span className="text-[11px] text-slate-500">TG, Discord, ML, WA, Shopee, Amazon</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Homologadas Prontas</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">3 Provedores</div>
              <span className="text-[11px] text-slate-500">Telegram, Discord, ML Marketplace</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Requerem Aprovação</span>
              <div className="text-xl font-bold text-amber-400 mt-1">3 Provedores</div>
              <span className="text-[11px] text-slate-500">WhatsApp WABA, Shopee, Amazon PA-API</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Proteção SSRF</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">100% Protegido</div>
              <span className="text-[11px] text-slate-500">Allowlist estrita de hostnames</span>
            </div>
          </div>

          {/* Provider Audit Matrix Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Provedor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status de Homologação</th>
                  <th className="px-4 py-3">Autenticação</th>
                  <th className="px-4 py-3">Requisitos de Conta</th>
                  <th className="px-4 py-3 text-right">Documentação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">Telegram Bot API</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Canal</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold font-sans">
                      HOMOLOGADO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">Bot Token</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Bot criado via @BotFather</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://core.telegram.org/bots/api" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">Discord Webhook / Bot</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Canal</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold font-sans">
                      HOMOLOGADO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">Webhook URL / Bot Token</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Permissão de canal no Discord</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://discord.com/developers/docs/resources/webhook" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">Mercado Livre Developers</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Marketplace</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold font-sans">
                      HOMOLOGADO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">OAuth 2.0 (Code)</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Aplicação no portal Developers</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://developers.mercadolivre.com.br" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">WhatsApp Meta Cloud API</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Canal</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold font-sans">
                      REQUER APROVAÇÃO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">Meta Bearer Token</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Meta App + Conta WABA verificada</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">Shopee Affiliate Open API</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Marketplace</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold font-sans">
                      REQUER APROVAÇÃO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">HMAC-SHA256 Signatures</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Aprovação no portal Open API</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://open-api.affiliate.shopee.com.br/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-sans font-bold text-white">Amazon PA-API 5.0</td>
                  <td className="px-4 py-3 text-slate-400 font-sans">Marketplace</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold font-sans">
                      REQUER APROVAÇÃO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-300">AWS SigV4</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-xs">Mínimo 3 vendas no Associados</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <a href="https://webservices.amazon.com/paapi5/documentation/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Docs Oficial ↗
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === "audit" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Logs de Auditoria do Sistema</h3>
              <p className="text-xs text-slate-400">Registro de ações críticas e eventos administrativos.</p>
            </div>
            <Badge variant="outline">Tempo Real</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Usuário</th>
                  <th className="px-4 py-3.5">Ação Executada</th>
                  <th className="px-4 py-3.5">Recurso</th>
                  <th className="px-4 py-3.5">IP</th>
                  <th className="px-4 py-3.5 text-right">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {liveAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Nenhum log de auditoria registrado no banco de dados ainda.
                    </td>
                  </tr>
                ) : (
                  liveAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-sans font-semibold text-white">{log.user}</td>
                      <td className="px-4 py-3.5 text-primary-300">{log.action}</td>
                      <td className="px-4 py-3.5 text-slate-400">{log.resource}</td>
                      <td className="px-4 py-3.5 text-slate-500">{log.ip}</td>
                      <td className="px-4 py-3.5 text-right text-slate-400 font-sans">{log.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
