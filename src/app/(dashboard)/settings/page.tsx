"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Shield,
  Sliders,
  Bell,
  Network,
  Save,
  Key,
  LogOut,
  CheckCircle2,
  Lock,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences" | "notifications" | "integrations"
  >("profile");

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setPhone(data.user.phone || "");
        }
        if (data.connections) {
          setConnections(data.connections);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Perfil Atualizado!",
          message: "Suas informações foram salvas com sucesso no banco de dados.",
          type: "success",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          message: data.error || "Não foi possível atualizar o perfil.",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Erro de rede",
        message: "Falha na comunicação com o servidor.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        message: "A nova senha deve ter no mínimo 6 caracteres.",
        type: "error",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Senha atualizada!",
          message: "Sua nova senha foi gravada com sucesso.",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast({
          title: "Erro ao alterar senha",
          message: data.error || "Senha atual incorreta.",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Erro de conexão",
        message: "Não foi possível conectar ao servidor.",
        type: "error",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Configurações</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Gerencie seu perfil, segurança de acesso, preferências e integrações da plataforma.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "profile", label: "Perfil", icon: User },
          { id: "security", label: "Segurança", icon: Shield },
          { id: "preferences", label: "Preferências", icon: Sliders },
          { id: "notifications", label: "Notificações", icon: Bell },
          { id: "integrations", label: "Integrações", icon: Network },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-2xl">
          <h3 className="text-base font-bold text-white mb-1">Informações do Perfil</h3>
          <p className="text-xs text-slate-400 mb-6">Atualize seus dados pessoais de exibição.</p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome completo
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail principal
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <p className="text-[11px] text-slate-500 mt-1">O e-mail é utilizado para login e notificações.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="glow" size="sm" isLoading={isSaving} className="gap-1.5 text-xs font-semibold">
                <Save className="w-3.5 h-3.5" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === "security" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-2xl space-y-8">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Alterar Senha</h3>
            <p className="text-xs text-slate-400 mb-6">Mantenha sua conta segura utilizando uma senha forte.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha atual
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nova senha
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Key className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="glow" size="sm" className="text-xs font-semibold">
                  Atualizar Senha
                </Button>
              </div>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">Sessões Ativas</h4>
            <p className="text-xs text-slate-400 mb-4">Dispositivos conectados à sua conta.</p>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Navegador Atual (Windows 11)</p>
                <p className="text-[10px] text-emerald-400">Sessão ativa agora • IP 189.45.xx.xx</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Sessões encerradas",
                    message: "Você desconectou todos os outros dispositivos.",
                    type: "info",
                  })
                }
                className="text-xs"
              >
                Desconectar Outros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-2xl space-y-6">
          <h3 className="text-base font-bold text-white mb-1">Preferências da Plataforma</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tema Visual</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200">
                <option value="dark">Modo Escuro Premium (Padrão)</option>
                <option value="system">Seguir Sistema Operacional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Idioma</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200">
                <option value="pt-BR">Português do Brasil (pt-BR)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fuso Horário</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200">
                <option value="America/Sao_Paulo">Horário de Brasília (GMT-3)</option>
                <option value="UTC">UTC / GMT</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-white mb-1">Alertas e Notificações</h3>
          <p className="text-xs text-slate-400 mb-4">Escolha os gatilhos que devem enviar alertas para você.</p>

          <div className="space-y-3 text-xs text-slate-300">
            {[
              { title: "Novas Oportunidades com Score 90+", desc: "Notificar quando um produto viral for detectado" },
              { title: "Ofertas Publicadas", desc: "Avisar quando o robô realizar disparos em Telegram ou WhatsApp" },
              { title: "Relatório Semanal de Comissões", desc: "Resumo com métricas de cliques e conversões estimadas" },
              { title: "Alertas de Desconexão de Canais", desc: "Notificar se algum canal perder permissão de envio" },
            ].map((item, idx) => (
              <label
                key={idx}
                className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary/40"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INTEGRATIONS */}
      {activeTab === "integrations" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Canais & Marketplaces Conectados</h3>
              <p className="text-xs text-slate-400">Status das conexões reais cadastradas no banco de dados.</p>
            </div>
            <Link href="/integrations">
              <Button variant="glow" size="sm" className="gap-1 text-xs font-semibold">
                Central de Integrações
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {connections.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-3">Nenhum canal ou marketplace conectado ainda.</p>
                <Link href="/integrations">
                  <Button variant="outline" size="sm" className="text-xs">
                    Conectar Novo Canal ou Marketplace
                  </Button>
                </Link>
              </div>
            ) : (
              connections.map((conn, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{conn.provider.replace("_", " ")}</span>
                      <Badge variant={conn.status === "CONNECTED" ? "success" : "outline"}>
                        {conn.status === "CONNECTED" ? "Conectado" : conn.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {conn.externalAccountName ? `Conta: ${conn.externalAccountName}` : `Tipo: ${conn.type}`}
                      {conn.lastValidatedAt && ` • Verificado em: ${new Date(conn.lastValidatedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Link href="/integrations">
                    <Button variant="outline" size="sm" className="text-xs">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
