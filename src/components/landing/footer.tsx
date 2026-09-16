import React from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { Bot, Shield, Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-white">{BRAND.name}</span>
            </div>
            <p className="max-w-sm text-slate-400 text-xs leading-relaxed">
              {BRAND.description}
            </p>
            <div className="flex items-center gap-2 pt-2 text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Plataforma 100% segura e em conformidade com as diretrizes de afiliados.</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Plataforma</h4>
            <ul className="space-y-2">
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#radar-demo" className="hover:text-white transition-colors">Radar de Ofertas</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Acesso & Suporte</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="hover:text-white transition-colors">Entrar na Conta</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Criar Conta</Link></li>
              <li><a href={`mailto:${BRAND.supportEmail}`} className="hover:text-white transition-colors">Suporte: {BRAND.supportEmail}</a></li>
              <li><span className="text-slate-600">Termos de Uso</span></li>
              <li><span className="text-slate-600">Privacidade</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito para afiliados que buscam escala e liberdade.
          </p>
        </div>
      </div>
    </footer>
  );
}
