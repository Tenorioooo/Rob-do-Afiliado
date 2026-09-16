import { IntegrationCapability, IntegrationType, AuthType } from "./capabilities";

export type AuditedProviderId =
  | "TELEGRAM"
  | "WHATSAPP"
  | "DISCORD"
  | "SHOPEE"
  | "MERCADOLIVRE"
  | "MERCADO_LIVRE"
  | "AMAZON"
  | string;

export type CapabilityAuditStatus =
  | "VERIFIED_REAL"
  | "VERIFIED_MOCK_ONLY"
  | "UNVERIFIED"
  | "UNAVAILABLE"
  | "REQUIRES_APPROVAL"
  | "REQUIRES_CREDENTIALS"
  | "PARTIAL";

export type ProviderHomologationStatus =
  | "HOMOLOGATED"
  | "REQUIRES_CREDENTIALS"
  | "REQUIRES_APPROVAL"
  | "UNHOMOLOGATED"
  | "UNAVAILABLE"
  | "MOCK_ONLY";

export interface CapabilityAuditEntry {
  capability: IntegrationCapability | "HEALTH_CHECK" | "OAUTH2" | "BOT_MESSAGES";
  label: string;
  status: CapabilityAuditStatus;
  isOfficialApiConfirmed: boolean;
  endpointConfirmed: string | null;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "OAUTH" | null;
  authentication: AuthType | string;
  isAvailableInBrazil: boolean;
  accountRequirements: string;
  credentialsRequired: string[];
  implementationStatus: "REAL_ADAPTER_READY" | "MOCK_ONLY" | "PENDING_OFFICIAL_API" | "REQUIRES_PARTNER_APPROVAL";
  officialSourceTitle: string;
  officialSourceUrl: string;
  verifiedAt: string;
  evidence: string;
  limitationsAndNotes: string;
}

export interface ProviderAuditRecord {
  providerId: string;
  providerName: string;
  type: IntegrationType;
  overallStatus: ProviderHomologationStatus;
  primaryAuthType: AuthType;
  officialPortalUrl: string;
  officialDocsUrl: string;
  lastAuditedAt: string;
  summary: string;
  capabilities: CapabilityAuditEntry[];
}

export class ProviderCapabilityAuditRegistry {
  private static readonly AUDIT_RECORDS: ProviderAuditRecord[] = [
    // --------------------------------------------------------------------------
    // 1. TELEGRAM
    // --------------------------------------------------------------------------
    {
      providerId: "TELEGRAM",
      providerName: "Telegram Bot API",
      type: "CHANNEL",
      overallStatus: "REQUIRES_CREDENTIALS",
      primaryAuthType: "BOT_TOKEN",
      officialPortalUrl: "https://t.me/BotFather",
      officialDocsUrl: "https://core.telegram.org/bots/api",
      lastAuditedAt: "2026-09-15",
      summary: "API oficial aberta e totalmente documentada pelo Telegram. Suporta envio de texto formatado, imagens e webhooks em tempo real sem necessidade de aprovação burocrática.",
      capabilities: [
        {
          capability: "SEND_MESSAGE",
          label: "Envio de Mensagens com HTML / Markdown",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.telegram.org/bot<token>/sendMessage",
          httpMethod: "POST",
          authentication: "BOT_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Telegram e bot criado via @BotFather",
          credentialsRequired: ["botToken", "chatId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Telegram Bot API — sendMessage",
          officialSourceUrl: "https://core.telegram.org/bots/api#sendmessage",
          verifiedAt: "2026-09-15",
          evidence: "Documentação oficial confirma método POST para /sendMessage com parâmetros chat_id, text, parse_mode e disable_web_page_preview.",
          limitationsAndNotes: "Limite de 4096 caracteres por mensagem e rate limit de aproximadamente 30 mensagens por segundo globalmente.",
        },
        {
          capability: "SEND_MEDIA",
          label: "Envio de Fotos e Mídia de Ofertas",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.telegram.org/bot<token>/sendPhoto",
          httpMethod: "POST",
          authentication: "BOT_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Telegram e bot criado via @BotFather",
          credentialsRequired: ["botToken", "chatId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Telegram Bot API — sendPhoto",
          officialSourceUrl: "https://core.telegram.org/bots/api#sendphoto",
          verifiedAt: "2026-09-15",
          evidence: "Endpoint oficial suporta URL pública da foto e legenda com formatação HTML até 1024 caracteres.",
          limitationsAndNotes: "Imagens devem ser URLs HTTPS públicas acessíveis ou multipart upload.",
        },
        {
          capability: "WEBHOOKS",
          label: "Notificações em Tempo Real (Webhooks)",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.telegram.org/bot<token>/setWebhook",
          httpMethod: "POST",
          authentication: "BOT_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Servidor HTTPS público com certificado SSL válido",
          credentialsRequired: ["botToken", "webhookSecret"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Telegram Bot API — setWebhook",
          officialSourceUrl: "https://core.telegram.org/bots/api#setwebhook",
          verifiedAt: "2026-09-15",
          evidence: "Header de verificação 'X-Telegram-Bot-Api-Secret-Token' confirmado oficialmente na especificação de segurança do Telegram.",
          limitationsAndNotes: "Portas suportadas pelo Telegram: 443, 80, 88 ou 8443.",
        },
        {
          capability: "HEALTH_CHECK",
          label: "Validação de Token e Identidade do Bot",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.telegram.org/bot<token>/getMe",
          httpMethod: "GET",
          authentication: "BOT_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Nenhum",
          credentialsRequired: ["botToken"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Telegram Bot API — getMe",
          officialSourceUrl: "https://core.telegram.org/bots/api#getme",
          verifiedAt: "2026-09-15",
          evidence: "Retorna objeto User com id, username, first_name e can_join_groups.",
          limitationsAndNotes: "Chamada leve e segura para preflight health check.",
        },
      ],
    },

    // --------------------------------------------------------------------------
    // 2. DISCORD
    // --------------------------------------------------------------------------
    {
      providerId: "DISCORD",
      providerName: "Discord Webhook / Bot API",
      type: "CHANNEL",
      overallStatus: "REQUIRES_CREDENTIALS",
      primaryAuthType: "WEBHOOK_URL",
      officialPortalUrl: "https://discord.com/developers/applications",
      officialDocsUrl: "https://discord.com/developers/docs/resources/webhook",
      lastAuditedAt: "2026-09-15",
      summary: "Suporte duplo: Incoming Webhooks (envio direto via URL única sem bot) e Bot REST API v10 para operações em servidores autorizados.",
      capabilities: [
        {
          capability: "SEND_MESSAGE",
          label: "Envio de Ofertas com Embeds Ricos via Webhook",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://discord.com/api/webhooks/{webhook.id}/{webhook.token}",
          httpMethod: "POST",
          authentication: "WEBHOOK_URL",
          isAvailableInBrazil: true,
          accountRequirements: "Permissão de Gerenciar Webhooks no canal do Discord",
          credentialsRequired: ["webhookUrl"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Discord Developer Docs — Execute Webhook",
          officialSourceUrl: "https://discord.com/developers/docs/resources/webhook#execute-webhook",
          verifiedAt: "2026-09-15",
          evidence: "Endpoint oficial suporta JSON com 'content', 'embeds' (title, description, url, color, image, fields) e query param ?wait=true.",
          limitationsAndNotes: "Webhooks apenas enviam mensagens para o canal configurado; não recebem eventos de chat do usuário.",
        },
        {
          capability: "BOT_MESSAGES",
          label: "Envio de Mensagens via Bot REST API v10",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://discord.com/api/v10/channels/{channel.id}/messages",
          httpMethod: "POST",
          authentication: "BOT_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Aplicação de Desenvolvedor Discord com Bot adicionado ao servidor com permissão 'Send Messages'",
          credentialsRequired: ["botToken", "channelId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Discord Developer Docs — Create Message",
          officialSourceUrl: "https://discord.com/developers/docs/resources/channel#create-message",
          verifiedAt: "2026-09-15",
          evidence: "Header 'Authorization: Bot <token>' oficial com payload JSON.",
          limitationsAndNotes: "Requer que o bot tenha entrado no servidor com permissões adequadas.",
        },
        {
          capability: "HEALTH_CHECK",
          label: "Verificação de Conectividade do Webhook",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://discord.com/api/webhooks/{webhook.id}/{webhook.token}",
          httpMethod: "GET",
          authentication: "WEBHOOK_URL",
          isAvailableInBrazil: true,
          accountRequirements: "Nenhum",
          credentialsRequired: ["webhookUrl"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Discord Developer Docs — Get Webhook",
          officialSourceUrl: "https://discord.com/developers/docs/resources/webhook#get-webhook",
          verifiedAt: "2026-09-15",
          evidence: "GET na URL do Webhook retorna objeto com channel_id, guild_id, name e avatar.",
          limitationsAndNotes: "Não consome rate limits de mensagens.",
        },
      ],
    },

    // --------------------------------------------------------------------------
    // 3. WHATSAPP META CLOUD API
    // --------------------------------------------------------------------------
    {
      providerId: "WHATSAPP",
      providerName: "WhatsApp Meta Cloud API (Oficial)",
      type: "CHANNEL",
      overallStatus: "REQUIRES_APPROVAL",
      primaryAuthType: "BEARER_TOKEN",
      officialPortalUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
      officialDocsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages",
      lastAuditedAt: "2026-09-15",
      summary: "API oficial da Meta (Graph API v21.0). Exige App Meta for Developers, Conta WhatsApp Business (WABA) e número de telefone verificado.",
      capabilities: [
        {
          capability: "SEND_MESSAGE",
          label: "Envio Oficial de Mensagens via Graph API",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://graph.facebook.com/v21.0/{phone_number_id}/messages",
          httpMethod: "POST",
          authentication: "BEARER_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "App Meta Developers aprovado, WhatsApp Business Account (WABA), Phone Number ID e Token de Sistema",
          credentialsRequired: ["accessToken", "phoneNumberId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "WhatsApp Cloud API — Messages Reference",
          officialSourceUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages",
          verifiedAt: "2026-09-15",
          evidence: "Endpoint oficial suporta envio de mensagens de texto e mídia para números em formato E.164.",
          limitationsAndNotes: "Para conversas iniciadas pela empresa, a Meta exige o uso de Message Templates pré-aprovados fora da janela de 24h de atendimento.",
        },
        {
          capability: "WEBHOOKS",
          label: "Webhook Oficial de Status e Mensagens (HMAC-SHA256)",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://graph.facebook.com/v21.0/{app_id}/subscriptions",
          httpMethod: "POST",
          authentication: "HMAC_SHA256",
          isAvailableInBrazil: true,
          accountRequirements: "Endpoint HTTPS público configurado no Meta Developers App",
          credentialsRequired: ["webhookVerifyToken", "appSecret"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "WhatsApp Cloud API — Webhooks & Signatures",
          officialSourceUrl: "https://developers.facebook.com/docs/graph-api/webhooks/getting-started",
          verifiedAt: "2026-09-15",
          evidence: "Validação GET com 'hub.mode', 'hub.verify_token', 'hub.challenge' e POST com assinatura HMAC-SHA256 no header 'X-Hub-Signature-256'.",
          limitationsAndNotes: "A verificação de assinatura timing-safe é obrigatória para segurança.",
        },
        {
          capability: "HEALTH_CHECK",
          label: "Validação de Phone Number ID e Qualidade",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://graph.facebook.com/v21.0/{phone_number_id}",
          httpMethod: "GET",
          authentication: "BEARER_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Token com permissão whatsapp_business_messaging",
          credentialsRequired: ["accessToken", "phoneNumberId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "WhatsApp Business Management API — Phone Numbers",
          officialSourceUrl: "https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers",
          verifiedAt: "2026-09-15",
          evidence: "GET no Phone Number ID retorna display_phone_number, verified_name e quality_rating.",
          limitationsAndNotes: "Permite diagnosticar se o número foi banido ou suspenso pela Meta.",
        },
      ],
    },

    // --------------------------------------------------------------------------
    // 4. MERCADO LIVRE
    // --------------------------------------------------------------------------
    {
      providerId: "MERCADO_LIVRE",
      providerName: "Mercado Livre Developers",
      type: "MARKETPLACE",
      overallStatus: "HOMOLOGATED",
      primaryAuthType: "OAUTH2",
      officialPortalUrl: "https://developers.mercadolivre.com.br/",
      officialDocsUrl: "https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao",
      lastAuditedAt: "2026-09-15",
      summary: "API oficial de marketplace via OAuth 2.0. Permite busca de produtos no catálogo do Mercado Livre Brasil (MLB) e notificações de pedidos. ATENÇÃO: O programa de afiliados oficial do Mercado Livre opera por portal separado e não possui API pública aberta de geração de deep links.",
      capabilities: [
        {
          capability: "OAUTH2",
          label: "Autorização OAuth 2.0 (Authorization Code)",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://auth.mercadolivre.com.br/authorization & https://api.mercadolibre.com/oauth/token",
          httpMethod: "OAUTH",
          authentication: "OAUTH2",
          isAvailableInBrazil: true,
          accountRequirements: "Aplicação criada no portal Mercado Livre Developers",
          credentialsRequired: ["clientId", "clientSecret"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Mercado Livre Developers — Autenticação e Autorização",
          officialSourceUrl: "https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao",
          verifiedAt: "2026-09-15",
          evidence: "Fluxo padrão OAuth 2.0 com troca de código de autorização por access_token (6 horas de validade) e refresh_token.",
          limitationsAndNotes: "Tokens expiram em 6 horas e devem ser renovados periodicamente.",
        },
        {
          capability: "READ_PRODUCTS",
          label: "Busca de Produtos no Catálogo MLB",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.mercadolibre.com/sites/MLB/search",
          httpMethod: "GET",
          authentication: "BEARER_TOKEN",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Mercado Livre ativa",
          credentialsRequired: ["accessToken"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Mercado Livre Developers — Itens e Buscas",
          officialSourceUrl: "https://developers.mercadolivre.com.br/pt_br/itens-e-buscas",
          verifiedAt: "2026-09-15",
          evidence: "Endpoint oficial /sites/MLB/search?q={query}&limit={n} retorna lista com id, title, price, original_price, thumbnail, permalink.",
          limitationsAndNotes: "Endpoint de catálogo de marketplace geral.",
        },
        {
          capability: "WEBHOOKS",
          label: "Notificações em Tempo Real (Webhooks de Tópicos)",
          status: "REQUIRES_CREDENTIALS",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://api.mercadolibre.com/applications/{app_id}/notifications",
          httpMethod: "POST",
          authentication: "OAUTH2",
          isAvailableInBrazil: true,
          accountRequirements: "URL pública de callback configurada no painel de desenvolvedor",
          credentialsRequired: ["clientId"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Mercado Livre Developers — Notificações",
          officialSourceUrl: "https://developers.mercadolivre.com.br/pt_br/notificacoes",
          verifiedAt: "2026-09-15",
          evidence: "Mercado Livre envia payloads com 'resource', 'user_id', 'topic', 'application_id' e espera resposta HTTP 200 em menos de 500ms.",
          limitationsAndNotes: "O webhook avisa que algo mudou; o app deve fazer um GET no resource para obter os detalhes.",
        },
        {
          capability: "GENERATE_AFFILIATE_LINK",
          label: "Geração de Links de Afiliado (Deep Linking)",
          status: "UNVERIFIED",
          isOfficialApiConfirmed: false,
          endpointConfirmed: null,
          httpMethod: null,
          authentication: "NONE",
          isAvailableInBrazil: true,
          accountRequirements: "Programa de Afiliados Mercado Livre (Portal Afiliados)",
          credentialsRequired: [],
          implementationStatus: "PENDING_OFFICIAL_API",
          officialSourceTitle: "Mercado Livre — Programa de Afiliados",
          officialSourceUrl: "https://www.mercadolivre.com.br/afiliados",
          verifiedAt: "2026-09-15",
          evidence: "O portal de desenvolvedores do Mercado Livre NÃO fornece endpoint REST público para geração automatizada de links de afiliado com tag de comissão. Os links são gerados manualmente ou por extensões oficiais no portal de afiliados.",
          limitationsAndNotes: "O SaaS utiliza tagging de UTMs e redirecionamento parametrizado, mas a API nativa de monetização direta não está documentada como API aberta.",
        },
      ],
    },

    // --------------------------------------------------------------------------
    // 5. SHOPEE
    // --------------------------------------------------------------------------
    {
      providerId: "SHOPEE",
      providerName: "Shopee Affiliate Open API",
      type: "MARKETPLACE",
      overallStatus: "REQUIRES_APPROVAL",
      primaryAuthType: "HMAC_SHA256",
      officialPortalUrl: "https://affiliate.shopee.com.br/",
      officialDocsUrl: "https://open-api.affiliate.shopee.com.br/",
      lastAuditedAt: "2026-09-15",
      summary: "A Shopee possui uma API oficial GraphQL para o Programa de Afiliados (Shopee Affiliate Open API), porém o acesso exige cadastro aprovado e chaves de parceria (AppId + Secret Key).",
      capabilities: [
        {
          capability: "GENERATE_AFFILIATE_LINK",
          label: "Geração de Links Curtos de Afiliado (generateShortLink)",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://open-api.affiliate.shopee.com.br/graphql",
          httpMethod: "POST",
          authentication: "HMAC_SHA256",
          isAvailableInBrazil: true,
          accountRequirements: "Conta no Shopee Affiliate Program com aprovação no portal Open API",
          credentialsRequired: ["appId", "secretKey"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Shopee Affiliate Open API — GraphQL Documentation",
          officialSourceUrl: "https://open-api.affiliate.shopee.com.br/",
          verifiedAt: "2026-09-15",
          evidence: "Documentação confirma mutation GraphQL 'generateShortLink(input: { originUrl, subIds })' autenticada por header 'Authorization: SHA256 Credential=..., Timestamp=..., Signature=...'.",
          limitationsAndNotes: "Requer aprovação comercial prévia da Shopee Brasil para emissão das chaves de API.",
        },
        {
          capability: "READ_PRODUCTS",
          label: "Busca de Ofertas de Afiliado (productOfferV2)",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://open-api.affiliate.shopee.com.br/graphql",
          httpMethod: "POST",
          authentication: "HMAC_SHA256",
          isAvailableInBrazil: true,
          accountRequirements: "Acesso aprovado ao Shopee Affiliate Open API",
          credentialsRequired: ["appId", "secretKey"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Shopee Affiliate Open API — Product Offer Query",
          officialSourceUrl: "https://open-api.affiliate.shopee.com.br/",
          verifiedAt: "2026-09-15",
          evidence: "Query GraphQL 'productOfferV2(keyword, page, limit)' retorna itemId, price, commissionRate, imageUrl e productLink.",
          limitationsAndNotes: "Restrito a contas de afiliados aprovadas na API.",
        },
        {
          capability: "READ_COMMISSION",
          label: "Relatório de Conversões e Comissões",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://open-api.affiliate.shopee.com.br/graphql",
          httpMethod: "POST",
          authentication: "HMAC_SHA256",
          isAvailableInBrazil: true,
          accountRequirements: "Acesso aprovado ao Shopee Affiliate Open API",
          credentialsRequired: ["appId", "secretKey"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Shopee Affiliate Open API — Conversion Report",
          officialSourceUrl: "https://open-api.affiliate.shopee.com.br/",
          verifiedAt: "2026-09-15",
          evidence: "Query GraphQL 'conversionReport(purchaseTimeStart, purchaseTimeEnd)' retorna status de pedidos e comissões.",
          limitationsAndNotes: "Dados consolidados com delay de processamento da Shopee.",
        },
      ],
    },

    // --------------------------------------------------------------------------
    // 6. AMAZON
    // --------------------------------------------------------------------------
    {
      providerId: "AMAZON",
      providerName: "Amazon Associates (PA-API 5.0)",
      type: "MARKETPLACE",
      overallStatus: "REQUIRES_APPROVAL",
      primaryAuthType: "AWS_SIGV4",
      officialPortalUrl: "https://associados.amazon.com.br/",
      officialDocsUrl: "https://webservices.amazon.com/paapi5/documentation/",
      lastAuditedAt: "2026-09-15",
      summary: "Amazon Product Advertising API (PA-API 5.0). Exige conta Amazon Associados Brasil ativa com qualificação mínima (3 vendas qualificadas nos primeiros 180 dias) para liberação das chaves de API com AWS SigV4.",
      capabilities: [
        {
          capability: "READ_PRODUCTS",
          label: "Busca de Produtos (SearchItems via PA-API 5.0)",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://webservices.amazon.com.br/paapi5/searchitems",
          httpMethod: "POST",
          authentication: "AWS_SIGV4",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Amazon Associados Brasil com PA-API 5.0 habilitada (mínimo de 3 vendas faturadas)",
          credentialsRequired: ["accessKey", "secretKey", "partnerTag"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Amazon PA-API 5.0 — SearchItems Operation",
          officialSourceUrl: "https://webservices.amazon.com/paapi5/documentation/search-items.html",
          verifiedAt: "2026-09-15",
          evidence: "Operação SearchItems com payload JSON assinado via AWS Signature Version 4 para o host webservices.amazon.com.br.",
          limitationsAndNotes: "Quotas iniciais restritas (1 requisição/segundo com limite diário proporcional ao volume de vendas gerado).",
        },
        {
          capability: "READ_PRICES",
          label: "Consulta Detalhada de Preço e Ofertas (GetItems)",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://webservices.amazon.com.br/paapi5/getitems",
          httpMethod: "POST",
          authentication: "AWS_SIGV4",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Amazon Associados qualificada",
          credentialsRequired: ["accessKey", "secretKey", "partnerTag"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Amazon PA-API 5.0 — GetItems Operation",
          officialSourceUrl: "https://webservices.amazon.com/paapi5/documentation/get-items.html",
          verifiedAt: "2026-09-15",
          evidence: "Operação GetItems com ItemIds (ASINs) e Resources como Offers.Listings.Price, ItemInfo.Title.",
          limitationsAndNotes: "Não armazena preços em cache por mais de 24h conforme termos de uso da Amazon.",
        },
        {
          capability: "READ_DISCOUNTS",
          label: "Verificação de Descontos e Variações de Preço",
          status: "REQUIRES_APPROVAL",
          isOfficialApiConfirmed: true,
          endpointConfirmed: "https://webservices.amazon.com.br/paapi5/getitems",
          httpMethod: "POST",
          authentication: "AWS_SIGV4",
          isAvailableInBrazil: true,
          accountRequirements: "Conta Amazon Associados qualificada",
          credentialsRequired: ["accessKey", "secretKey", "partnerTag"],
          implementationStatus: "REAL_ADAPTER_READY",
          officialSourceTitle: "Amazon PA-API 5.0 — Offers Resource",
          officialSourceUrl: "https://webservices.amazon.com/paapi5/documentation/offers.html",
          verifiedAt: "2026-09-15",
          evidence: "Recurso Offers.Listings.SavingBasis e Offers.Listings.Price.",
          limitationsAndNotes: "Exige que o produto esteja em estoque e disponível para venda direta pela Amazon ou Marketplace.",
        },
      ],
    },
  ];

  static getAll(): ProviderAuditRecord[] {
    return this.AUDIT_RECORDS;
  }

  static getByProviderId(providerId: string): ProviderAuditRecord | undefined {
    const norm = providerId.replace(/_/g, "").toUpperCase();
    return this.AUDIT_RECORDS.find(
      (p) => p.providerId.replace(/_/g, "").toUpperCase() === norm
    );
  }

  static getSummaryStats() {
    const records = this.AUDIT_RECORDS;
    let totalCapabilities = 0;
    let verifiedRealOrCredentials = 0;
    let requiresApproval = 0;
    let unverified = 0;

    for (const p of records) {
      for (const c of p.capabilities) {
        totalCapabilities++;
        if (c.status === "VERIFIED_REAL" || c.status === "REQUIRES_CREDENTIALS") {
          verifiedRealOrCredentials++;
        } else if (c.status === "REQUIRES_APPROVAL") {
          requiresApproval++;
        } else if (c.status === "UNVERIFIED" || c.status === "UNAVAILABLE") {
          unverified++;
        }
      }
    }

    return {
      totalProviders: records.length,
      homologatedProviders: records.filter((r) => r.overallStatus === "HOMOLOGATED" || r.overallStatus === "REQUIRES_CREDENTIALS").length,
      requiresApprovalProviders: records.filter((r) => r.overallStatus === "REQUIRES_APPROVAL").length,
      totalCapabilities,
      verifiedRealOrCredentials,
      requiresApproval,
      unverified,
    };
  }
}
