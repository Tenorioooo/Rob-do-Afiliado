"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Zap,
  Plus,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Sliders,
  Clock,
  ShieldCheck,
  Radio,
  Tag,
  Percent,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface AutomationRuleData {
  id: string;
  name: string;
  active: boolean;
  minOpportunityScore?: number;
  minCommission?: number;
  minDiscount?: number;
  maxOffersPerDay?: number;
  minIntervalMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
  duplicateCooldownHours?: number;
  offerStyle?: string;
  createdAt: string;
  channel?: {
    id: string;
    name: string;
    type: string;
    provider: string;
    destination: string;
    active: boolean;
  };
}

interface ChannelOption {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export default function AutomationPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRuleData[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State
  const [ruleName, setRuleName] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [minScore, setMinScore] = useState(80);
  const [minCommission, setMinCommission] = useState(8);
  const [minDiscount, setMinDiscount] = useState(20);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([
    "SHOPEE",
    "MERCADO_LIVRE",
    "AMAZON",
  ]);
  const [copyStyle, setCopyStyle] = useState<"DIRETO" | "DESCONTO" | "URGENCIA" | "PREMIUM" | "CURTO">("DESCONTO");
  const [operatingStart, setOperatingStart] = useState("08:00");
  const [operatingEnd, setOperatingEnd] = useState("22:00");
  const [maxDaily, setMaxDaily] = useState(15);
  const [minInterval, setMinInterval] = useState(30);
  const [duplicateCooldown, setDuplicateCooldown] = useState(24);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, channelsRes] = await Promise.all([
        fetch("/api/automation/rules"),
        fetch("/api/channels"),
      ]);

      const [rulesData, channelsData] = await Promise.all([
        rulesRes.json(),
        channelsRes.json(),
      ]);

      if (rulesData.success) setRules(rulesData.rules || []);
      if (channelsData.success) setChannels(channelsData.channels || []);
    } catch (err) {
      console.error("Failed to load automation rules", err);
      toast({
        title: "Erro",
        message: "Não foi possível carregar as regras de automação.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRuleId(null);
    setRuleName("Automação Ofertas Quentes 🔥");
    setSelectedChannelId(channels.length > 0 ? channels[0].id : "");
    setMinScore(80);
    setMinCommission(8);
    setMinDiscount(20);
    setSelectedMarketplaces(["SHOPEE", "MERCADO_LIVRE", "AMAZON"]);
    setCopyStyle("DESCONTO");
    setOperatingStart("08:00");
    setOperatingEnd("22:00");
    setMaxDaily(15);
    setMinInterval(30);
    setDuplicateCooldown(24);
    setIsModalOpen(true);
  };

  const toggleMarketplace = (mp: string) => {
    if (selectedMarketplaces.includes(mp)) {
      if (selectedMarketplaces.length === 1) return; // Keep at least one
      setSelectedMarketplaces(selectedMarketplaces.filter((m) => m !== mp));
    } else {
      setSelectedMarketplaces([...selectedMarketplaces, mp]);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleName.trim() || !selectedChannelId) {
      toast({
        title: "Campos obrigatórios",
        message: "Selecione o canal de destino e dê um nome para a regra.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const configPayload = {
        minOpportunityScore: Number(minScore),
        minCommissionRate: Number(minCommission),
        minDiscountPercentage: Number(minDiscount),
        allowedMarketplaces: selectedMarketplaces,
        copyStyle,
        autoPublish: true,
        operatingHours: {
          start: operatingStart,
          end: operatingEnd,
        },
        maxDailyPublications: Number(maxDaily),
        minIntervalMinutes: Number(minInterval),
        duplicateCooldownHours: Number(duplicateCooldown),
      };

      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          channelId: selectedChannelId,
          config: configPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar regra");

      toast({
        title: "Regra Criada!",
        message: `Regra '${ruleName}' ativada com sucesso.`,
        type: "success",
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erro",
        message: err.message || "Erro ao salvar regra.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: AutomationRuleData) => {
    try {
      const endpoint = rule.active ? "deactivate" : "activate";
      const res = await fetch(`/api/automation/rules/${rule.id}/${endpoint}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: rule.active ? "Regra Pausada" : "Regra Ativada",
        message: `A regra '${rule.name}' está agora ${rule.active ? "pausada" : "ativa e operando"}.`,
        type: "info",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erro",
        message: err.message || "Não foi possível alterar status da regra.",
        type: "error",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${name}"?`)) return;

    try {
      const res = await fetch(`/api/automation/rules/${ruleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Regra Excluída",
        message: `A regra '${name}' foi removida.`,
        type: "success",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erro",
        message: err.message || "Erro ao excluir regra.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Regras de Automação</h2>
            <Badge variant="purple" size="md">Automation Engine</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure critérios inteligentes para que o Robô publique automaticamente oportunidades qualificadas nos canais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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
            disabled={channels.length === 0}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Regra</span>
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">Como Funciona a Automação Inteligente</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Toda oportunidade que passa pelo Radar e atinge seus filtros mínimos (Score, Comissão, Desconto) é formatada com IA e despachada respeitando limites diários e intervalos anti-spam.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Carregando regras de automação...
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma regra de automação ativa</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {channels.length === 0
                ? "Conecte primeiro um canal de distribuição para poder criar regras automáticas."
                : "Crie sua primeira regra para disparar automaticamente ofertas aprovadas com IA."}
            </p>
          </div>
          {channels.length > 0 && (
            <Button variant="glow" size="sm" onClick={openCreateModal} className="text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Criar Primeira Regra
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl transition-all ${
                  rule.active
                    ? "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    : "border-slate-800/50 bg-slate-950/40 opacity-70"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-purple-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                          <Badge variant={rule.active ? "success" : "outline"} size="sm">
                            {rule.active ? "Ativa" : "Pausada"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-slate-500" />
                          Canal: <strong className="text-slate-200">{rule.channel?.name}</strong> ({rule.channel?.type})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(rule)}
                      title={rule.active ? "Pausar Regra" : "Ativar Regra"}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        rule.active
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {rule.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Filter Criteria Grid */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Score Mínimo</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {rule.minOpportunityScore ?? 80}+
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Comissão Mín.</span>
                      <span className="font-bold text-indigo-400 text-sm">
                        {rule.minCommission ?? 5}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Desconto Mín.</span>
                      <span className="font-bold text-amber-400 text-sm">
                        {rule.minDiscount ?? 15}%
                      </span>
                    </div>
                  </div>

                  {/* Operational Settings Details */}
                  <div className="space-y-1.5 text-[11px] text-slate-400 px-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Janela Operacional:
                      </span>
                      <span className="font-mono text-slate-200">
                        {rule.allowedStartTime || "08:00"} às {rule.allowedEndTime || "22:00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> Limite Diário & Intervalo:
                      </span>
                      <span className="text-slate-200">
                        Máx. <strong>{rule.maxOffersPerDay ?? 20} posts/dia</strong> ({rule.minIntervalMinutes ?? 15}min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-500" /> Anti-Duplicação:
                      </span>
                      <span className="text-slate-200">
                        {rule.duplicateCooldownHours ?? 24}h cooldown
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">
                    Estilo de Copy: <strong className="text-indigo-300">{rule.offerStyle || "DESCONTO"}</strong>
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs"
                    title="Excluir Regra"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Rule Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nova Regra de Automação"
          description="Defina os gatilhos e restrições para publicações automáticas."
        >
          <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
            {/* Rule Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nome da Regra</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Ex: Ofertas VIP Telegram"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Target Channel */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Canal de Destino</label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-primary"
                required
              >
                {channels.map((chan) => (
                  <option key={chan.id} value={chan.id}>
                    {chan.name} ({chan.type}) {chan.active ? "• Ativo" : "• Inativo"}
                  </option>
                ))}
              </select>
            </div>

            {/* Criteria: Score, Commission, Discount */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Score Mín. (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comissão Mín. (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minCommission}
                  onChange={(e) => setMinCommission(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Desconto Mín. (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minDiscount}
                  onChange={(e) => setMinDiscount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs text-center font-bold"
                />
              </div>
            </div>

            {/* Marketplaces */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Marketplaces Permitidos</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "SHOPEE", name: "Shopee" },
                  { id: "MERCADO_LIVRE", name: "Mercado Livre" },
                  { id: "AMAZON", name: "Amazon" },
                ].map((mp) => {
                  const isChecked = selectedMarketplaces.includes(mp.id);
                  return (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => toggleMarketplace(mp.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isChecked
                          ? "bg-primary/20 border-primary text-primary-300"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {isChecked ? "✓ " : ""}{mp.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Copy Style & Operating Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estilo de Copy</label>
                <select
                  value={copyStyle}
                  onChange={(e: any) => setCopyStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs"
                >
                  <option value="DESCONTO">Foco em Desconto</option>
                  <option value="URGENCIA">Gatilho de Urgência</option>
                  <option value="DIRETO">Direto e Objetivo</option>
                  <option value="PREMIUM">Tom Premium</option>
                  <option value="CURTO">Microcopy Curto</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Horário Operacional</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={operatingStart}
                    onChange={(e) => setOperatingStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-200 text-xs text-center"
                  />
                  <span className="text-slate-500">às</span>
                  <input
                    type="time"
                    value={operatingEnd}
                    onChange={(e) => setOperatingEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-200 text-xs text-center"
                  />
                </div>
              </div>
            </div>

            {/* Daily Cap & Interval */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Máx. Diário (Posts)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxDaily}
                  onChange={(e) => setMaxDaily(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Intervalo Mínimo (min)</label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={minInterval}
                  onChange={(e) => setMinInterval(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs text-center font-bold"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="glow" size="sm" isLoading={saving}>
                Criar Regra de Automação
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
