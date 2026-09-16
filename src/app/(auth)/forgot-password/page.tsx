"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Bot, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setIsSubmitted(true);
      toast({
        title: "Instruções enviadas",
        message: data.message,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        message: "Verifique o e-mail digitado e tente novamente.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">{BRAND.name}</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Recuperação de Senha
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Informe seu e-mail para receber as instruções de redefinição.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">E-mail Enviado!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enviamos o link de recuperação para <strong className="text-white">{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="outline" className="w-full justify-center text-xs">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail cadastrado
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

              <Button
                type="submit"
                variant="glow"
                isLoading={isLoading}
                className="w-full justify-center text-sm py-3 mt-2 font-semibold"
              >
                Enviar link de recuperação
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
