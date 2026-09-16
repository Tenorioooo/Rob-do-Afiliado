"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Cpu,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";

export default function AutopilotHistoryPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/autopilot/history?limit=30");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error("Error fetching autopilot runs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/autopilot">
              <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Histórico do Autopiloto
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registro de auditoria e métricas de cada ciclo autônomo executado.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          isLoading={isLoading}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar Histórico
        </Button>
      </div>

      {/* History Table */}
      <div className="space-y-4">
        {runs.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
            <Cpu className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              Nenhum ciclo do autopiloto registrado ainda.
            </p>
            <Link href="/autopilot">
              <Button variant="glow" size="sm" className="text-xs">
                Ir para o Autopiloto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Data & Hora</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Gatilho</th>
                    <th className="px-4 py-3.5 text-center">Analisados</th>
                    <th className="px-4 py-3.5 text-center">Qualificadas</th>
                    <th className="px-4 py-3.5 text-center">Ofertas</th>
                    <th className="px-4 py-3.5 text-center">Publicações</th>
                    <th className="px-4 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">
                        {formatDate(r.startedAt)}
                      </td>
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
                          {r.status === "COMPLETED"
                            ? "Concluído"
                            : r.status === "PARTIAL"
                            ? "Parcial"
                            : r.status === "FAILED"
                            ? "Falhou"
                            : "Executando"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {r.triggerType === "MANUAL" ? "Manual" : "Agendado"}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRun(r)}
                          className="text-xs h-7 px-2.5 gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <Modal
          isOpen={!!selectedRun}
          onClose={() => setSelectedRun(null)}
          title={`Detalhes do Ciclo (${selectedRun.status})`}
          description={`Iniciado em ${formatDate(selectedRun.startedAt)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Produtos Analisados</span>
                <span className="text-base font-bold text-white">{selectedRun.productsAnalyzed}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Oportunidades Qualificadas</span>
                <span className="text-base font-bold text-emerald-400">{selectedRun.opportunitiesQualified}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ofertas Geradas</span>
                <span className="text-base font-bold text-primary-300">{selectedRun.offersGenerated}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Publicações Disparadas</span>
                <span className="text-base font-bold text-cyan-400">{selectedRun.publicationsPublished}</span>
              </div>
            </div>

            {selectedRun.errors && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 space-y-1">
                <span className="font-bold block">Erros Registrados:</span>
                <pre className="text-[10px] whitespace-pre-wrap overflow-x-auto font-mono">
                  {selectedRun.errors}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
