export interface PlanTier {
  id: string;
  code: "STARTER" | "PREMIUM" | "PRO_AUTOPILOT" | "PRO" | "ENTERPRISE";
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  badge?: string;
  limits: {
    channels: number;
    offersPerDay: number;
    aiGenerationsPerMonth: number;
    scanIntervalMinutes: number;
  };
  features: string[];
}

export const OFFICIAL_PLANS: PlanTier[] = [
  {
    id: "plan-starter",
    code: "STARTER",
    name: "Starter",
    price: 47,
    period: "mês",
    description: "Ideal para afiliados iniciantes começarem a automatizar ofertas com eficiência.",
    popular: false,
    limits: {
      channels: 2,
      offersPerDay: 15,
      aiGenerationsPerMonth: 300,
      scanIntervalMinutes: 60,
    },
    features: [
      "Até 2 canais conectados (Telegram/Discord)",
      "15 publicações automáticas por dia",
      "Monitoramento Mercado Livre & Shopee",
      "Geração de copy com IA básica",
      "Suporte via comunidade",
    ],
  },
  {
    id: "plan-premium",
    code: "PREMIUM",
    name: "Premium",
    price: 97,
    period: "mês",
    description: "A solução completa para afiliados escalarem publicações e comissões com IA avançada.",
    popular: true,
    badge: "MAIS ESCOLHIDO",
    limits: {
      channels: 10,
      offersPerDay: 100,
      aiGenerationsPerMonth: 2000,
      scanIntervalMinutes: 15,
    },
    features: [
      "Até 10 canais conectados (Telegram, Discord, WhatsApp)",
      "Autopiloto com aprovação e disparo inteligente",
      "Varredura prioritária Mercado Livre, Shopee e Amazon",
      "Geração neural avançada de copies persuasivas",
      "Score de Oportunidade com inteligência preditiva",
      "Métricas e analytics de conversão em tempo real",
      "Suporte prioritário via WhatsApp",
    ],
  },
  {
    id: "plan-pro-autopilot",
    code: "PRO_AUTOPILOT",
    name: "Pro Autopilot",
    price: 197,
    period: "mês",
    description: "Autonomia 24h sem limites para grandes canais, agências e afiliados de alta escala.",
    popular: false,
    badge: "AUTONOMIA TOTAL",
    limits: {
      channels: 999,
      offersPerDay: 9999,
      aiGenerationsPerMonth: 99999,
      scanIntervalMinutes: 5,
    },
    features: [
      "Canais e grupos ilimitados",
      "Autopiloto 24h 100% autônomo sem restrições",
      "Varredura ultra rápida a cada 5 minutos",
      "Multi-usuários e permissões de equipe",
      "Acesso completo a Webhooks e API personalizada",
      "Gerente de conta dedicado",
    ],
  },
];
