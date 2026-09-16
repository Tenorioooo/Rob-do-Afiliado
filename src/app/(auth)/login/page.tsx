"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Bot, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao realizar login");
      }

      toast({
        title: "Login realizado com sucesso!",
        message: `Bem-vindo de volta, ${data.user.name}.`,
        type: "success",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocorreu um erro ao entrar.";
      setError(message);
      toast({
        title: "Erro no acesso",
        message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo accounts helper
  const fillDemoAccount = (type: "user" | "admin") => {
    if (type === "admin") {
      setEmail("admin@affiliateai.com");
      setPassword("admin123");
    } else {
      setEmail("user@affiliateai.com");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">{BRAND.name}</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Acesse seu Painel de Afiliado
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Seu operador virtual está pronto para trabalhar.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail de acesso
              </label>
              <Input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary-300 font-medium transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary/40 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300">Lembrar de mim</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="glow"
              isLoading={isLoading}
              className="w-full justify-center text-sm py-3 font-semibold"
            >
              Entrar na plataforma
            </Button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
              <span>Contas de demonstração:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("user")}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <span>Afiliado Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin")}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-indigo-300 transition-colors flex items-center justify-center gap-1"
              >
                <span>Admin Master</span>
              </button>
            </div>
          </div>
        </div>

        {/* CTA to Register */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Ainda não possui acesso?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary-300 transition-colors inline-flex items-center gap-1"
            >
              Começar agora
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
