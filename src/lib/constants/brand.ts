/**
 * Centralized Brand Configuration
 * Change branding details here without altering application logic.
 */
export const BRAND = {
  name: "Affiliate AI",
  commercialName: "Robô do Afiliado",
  shortName: "AffiliateAI",
  tagline: "Seu afiliado virtual trabalhando 24 horas por dia.",
  description:
    "Encontre produtos com potencial, transforme oportunidades em ofertas e automatize sua operação de afiliado em um único lugar.",
  url: "https://affiliateai.app",
  author: "Affiliate AI Inc.",
  supportEmail: "suporte@affiliateai.app",
  currency: "BRL",
  defaultLocale: "pt-BR",
  version: "1.0.0-beta",
  links: {
    github: "https://github.com",
    terms: "/terms",
    privacy: "/privacy",
    login: "/login",
    register: "/register",
    dashboard: "/dashboard",
  },
  stats: {
    scannedDaily: "150.000+",
    conversionBoost: "+320%",
    uptime: "99.98%",
    activeUsers: "2.400+",
  },
} as const;

export const NAVIGATION_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    badge: null,
  },
  {
    title: "Autopiloto",
    href: "/autopilot",
    icon: "Cpu",
    badge: "Fase 5",
  },
  {
    title: "Meu Robô",
    href: "/robot",
    icon: "Bot",
    badge: "24h",
  },
  {
    title: "Radar",
    href: "/radar",
    icon: "Radar",
    badge: "Novo",
  },
  {
    title: "Ofertas & IA",
    href: "/offers",
    icon: "Sparkles",
    badge: "IA",
  },
  {
    title: "Canais",
    href: "/channels",
    icon: "Radio",
    badge: null,
  },
  {
    title: "Integrações",
    href: "/integrations",
    icon: "Layers",
    badge: "Fase 7",
  },
  {
    title: "Automação",
    href: "/automation",
    icon: "Zap",
    badge: "Auto",
  },
  {
    title: "Publicações",
    href: "/publications",
    icon: "Send",
    badge: null,
  },
  {
    title: "Links",
    href: "/links",
    icon: "Link2",
    badge: null,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    badge: null,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: "Settings",
    badge: null,
  },
  {
    title: "Plano",
    href: "/plan",
    icon: "Sparkles",
    badge: "PRO",
  },
] as const;
