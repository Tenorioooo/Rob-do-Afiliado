"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  Play,
  Pause,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  ShieldCheck,
  History,
  Layers,
  Flame,
  ArrowRight,
} from "lucide-react";

interface ScanRecord {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  platforms: string;
  categories: string;
  minScore: number;
  totalDiscovered: number;
  totalAnalyzed: number;
  totalQualified: number;
  totalRejected: number;
  errorMessage: string | null;
}

interface RobotEventRecord {
  id: string;
  eventType: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function RobotPage() {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [events, setEvents] = useState<RobotEventRecord[]>([]);
  const [scanResultModal, setScanResultModal] = useState<any | null>(null);

  const fetchScanHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/robot/scans");
      const data = await res.json();
      if (res.ok) {
        setScans(data.scans || []);
        setEvents(data.recentEvents || []);
      }
    } catch (err) {
      console.error("Error fetching robot scan history:", err);
    }
  }, []);

  useEffect(() => {
    fetchScanHistory();
  }, [fetchScanHistory]);

  const handleExecuteScan = async () => {
    setIsScanning(true);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 500);
    const stepTimer2 = setTimeout(() => setScanStep(3), 1000);
    const stepTimer3 = setTimeout(() => setScanStep(4), 1500);

    try {
      const res = await fetch("/api/robot/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minOpportunityScore: 70,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao executar scan");
      }

      setScanStep(5);
      await fetchScanHistory();

      setTimeout(() => {
        setIsScanning(false);
        setScanStep(0);
        setScanResultModal(data.result);
        toast({
          title: "Varredura concluída com sucesso!",
          message: `${data.result?.totalAnalyzed || 0} produtos analisados. ${data.result?.totalQualified || 0} oportunidades qualificadas.`,
          type: "success",
        });
      }, 600);
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsScanning(false);
      setScanStep(0);
      const msg = err instanceof Error ? err.message : "Falha na execução";
      toast({
        title: "Erro na varredura",
        message: msg,
        type: "error",
      });
    }
  };

  const latestScan = scans.length > 0 ? scans[0] : null;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Meu Robô</h2>
            <Badge variant={isActive ? "success" : "warning"} size="md">
              {isActive ? "ATIVO & OPERACIONAL" : "PAUSADO"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Seu operador virtual de afiliados trabalhando de forma autônoma 24h.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glow"
            size="sm"
            onClick={handleExecuteScan}
            isLoading={isScanning}
            className="text-xs gap-1.5 font-semibold px-5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Analisando..." : "Executar Análise Agora"}
          </Button>

          <Button
            variant={isActive ? "outline" : "emerald"}
            size="sm"
            onClick={() => {
              setIsActive(!isActive);
              toast({
                title: !isActive ? "Robô ativado" : "Robô pausado",
                message: !isActive
                  ? "Varredura contínua retomada."
                  : "Buscas automáticas temporariamente pausadas.",
                type: !isActive ? "success" : "warning",
              });
            }}
            className="text-xs gap-1.5"
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isActive ? "Pausar" : "Ativar"}
          </Button>
        </div>
      </div>

      {/* Live Scan Execution Progress Stepper (visible during scanning) */}
      {isScanning && (
        <div className="rounded-3xl border border-primary/50 bg-gradient-to-r from-primary/20 via-slate-900/90 to-indigo-950/40 p-6 backdrop-blur-xl shadow-2xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-primary animate-bounce" />
              <h3 className="text-sm font-bold text-white">Executando Pipeline do Robô...</h3>
            </div>
            <span className="text-xs font-mono text-primary-300">Passo {scanStep} de 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${scanStep >= 1 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>1. Configuração</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${scanStep >= 2 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>2. Adapters</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${scanStep >= 3 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>3. Descoberta</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${scanStep >= 4 ? "bg-primary/20 border-primary text-white" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>4. Scoring IA</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${scanStep >= 5 ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "bg-slate-950/60 border-slate-800 text-slate-500"}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>5. Radar Atualizado</span>
            </div>
          </div>
        </div>
      )}

      {/* Operational Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 block mb-1">Última Varredura</span>
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {latestScan?.finishedAt ? formatDate(latestScan.finishedAt) : "Nenhum scan ainda"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 block mb-1">Total de Scans Realizados</span>
          <span className="text-lg font-bold text-white">{scans.length} execuções</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 block mb-1">Último Total Analisado</span>
          <span className="text-lg font-bold text-indigo-400">
            {latestScan?.totalAnalyzed || 0} produtos
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 block mb-1">Últimas Qualificadas</span>
          <span className="text-lg font-bold text-emerald-400">
            {latestScan?.totalQualified || 0} oportunidades
          </span>
        </div>
      </div>

      {/* Monitored Sources */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Fontes Monitoradas (Marketplaces Ativos)</h3>
          <p className="text-xs text-slate-400">
            Adaptadores em operação com consulta contínua aos marketplaces conectados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Shopee Afiliados", plat: "SHOPEE", desc: "Varredura no catálogo de eletrônicos, moda e beleza.", status: "Conectado" },
            { name: "Mercado Livre Full", plat: "MERCADO_LIVRE", desc: "Varredura em eletrodomésticos, casa e tecnologia.", status: "Conectado" },
            { name: "Amazon Associados", plat: "AMAZON", desc: "Varredura em eletrônicos, Kindles e smart devices.", status: "Conectado" },
          ].map((int, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{int.name}</span>
                  <Badge variant="success">Mock Ativo</Badge>
                </div>
                <p className="text-xs text-slate-400 mb-4">{int.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Adapter: MarketplaceAdapter</span>
                <span className="text-emerald-400 font-medium">100% Operacional</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scan History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Histórico de Varreduras (RobotScans)</h3>
            <p className="text-xs text-slate-400">Registro detalhado de cada execução do motor de IA.</p>
          </div>
          <span className="text-xs text-slate-400">Total: {scans.length}</span>
        </div>

        {scans.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            Nenhuma varredura registrada ainda. Clique em "Executar Análise Agora" para rodar o primeiro scan.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Data & Hora</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Plataformas</th>
                    <th className="px-4 py-3.5 text-center">Descobertos</th>
                    <th className="px-4 py-3.5 text-center">Analisados</th>
                    <th className="px-4 py-3.5 text-center">Qualificados</th>
                    <th className="px-4 py-3.5 text-right">Score Mín.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">
                        {formatDate(s.startedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={s.status === "COMPLETED" ? "success" : "danger"}>
                          {s.status === "COMPLETED" ? "Concluído" : "Falhou"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {JSON.parse(s.platforms || "[]").join(", ")}
                      </td>
                      <td className="px-4 py-3.5 text-center">{s.totalDiscovered}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-white">
                        {s.totalAnalyzed}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                        {s.totalQualified}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                        {s.minScore}+
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Events Log */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Eventos Recentes do Motor (RobotEvents)</h3>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          {events.slice(0, 6).map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <div className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] shrink-0">
                {formatDate(ev.createdAt).split(" ")[1] || ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{ev.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{ev.description}</p>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Scan Summary Modal */}
      {scanResultModal && (
        <Modal
          isOpen={!!scanResultModal}
          onClose={() => setScanResultModal(null)}
          title="Resultado da Análise do Robô"
          description="Resumo da execução do pipeline de descoberta e qualificação."
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Produtos Descobertos:</span>
                <span className="text-white font-bold">{scanResultModal.totalDiscovered} itens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Produtos Analisados:</span>
                <span className="text-white font-bold">{scanResultModal.totalAnalyzed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Oportunidades Qualificadas:</span>
                <span className="text-emerald-400 font-bold">{scanResultModal.totalQualified} no Radar</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setScanResultModal(null)}>
                Fechar
              </Button>
              <Link href="/radar" onClick={() => setScanResultModal(null)}>
                <Button variant="glow" size="sm" className="gap-1.5 font-semibold">
                  <span>Ver Oportunidades no Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
