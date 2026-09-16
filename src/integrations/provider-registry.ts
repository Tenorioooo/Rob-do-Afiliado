import { IntegrationCapability, IntegrationType, AuthType } from "@/domain/integrations/capabilities";

export interface ProviderDefinition {
  id: string;
  name: string;
  type: IntegrationType;
  authType: AuthType;
  description: string;
  initialStatus: string;
  categoryLabel: string;
  actionButtonLabel: string;
  capabilitiesDisplay: string[];
  documentationUrl: string;
  capabilities: IntegrationCapability[];
  isOfficiallySupported: boolean;
  requiredFields: {
    key: string;
    label: string;
    type: "text" | "password" | "textarea" | "url";
    placeholder?: string;
    helperText?: string;
    required: boolean;
  }[];
}

export class ProviderRegistry {
  private static readonly PROVIDERS: ProviderDefinition[] = [
    // 1. TELEGRAM
    {
      id: "TELEGRAM",
      name: "Telegram",
      type: "CHANNEL",
      authType: "BOT_TOKEN",
      initialStatus: "PRONTO PARA CONECTAR",
      categoryLabel: "Canal de distribuição",
      actionButtonLabel: "Conectar Telegram",
      description: "Conecte um bot do Telegram para publicar automaticamente suas ofertas com fotos e formatação rica.",
      documentationUrl: "https://core.telegram.org/bots/api",
      capabilitiesDisplay: [
        "Enviar mensagens",
        "Enviar mídia com legenda",
        "Webhooks oficiais",
      ],
      capabilities: ["SEND_MESSAGE", "SEND_MEDIA", "EDIT_MESSAGE", "DELETE_MESSAGE", "WEBHOOKS"],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "botToken",
          label: "Bot Token (obtido no @BotFather)",
          type: "password",
          placeholder: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
          helperText: "Token gerado pelo BotFather no Telegram",
          required: true,
        },
        {
          key: "chatId",
          label: "Chat ID ou @username do Canal Público",
          type: "text",
          placeholder: "@meucanal_promos ou -1001234567890",
          helperText: "Identificador do canal público ou ID numérico do grupo (ex: -100123456789)",
          required: false,
        },
      ],
    },

    // 2. DISCORD
    {
      id: "DISCORD",
      name: "Discord",
      type: "CHANNEL",
      authType: "WEBHOOK_URL",
      initialStatus: "PRONTO PARA CONECTAR",
      categoryLabel: "Canal de distribuição",
      actionButtonLabel: "Conectar Discord",
      description: "Publique ofertas automaticamente em servidores e canais através dos mecanismos oficiais do Discord.",
      documentationUrl: "https://discord.com/developers/docs/resources/webhook",
      capabilitiesDisplay: [
        "Enviar mensagens",
        "Enviar mídia / Embeds visuais",
        "Webhooks em tempo real",
      ],
      capabilities: ["SEND_MESSAGE", "SEND_MEDIA", "EDIT_MESSAGE", "DELETE_MESSAGE", "WEBHOOKS"],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "webhookUrl",
          label: "URL do Webhook do Canal",
          type: "url",
          placeholder: "https://discord.com/api/webhooks/123456789/abcdef...",
          helperText: "Criada em Configurações do Canal > Integrações > Webhooks",
          required: true,
        },
      ],
    },

    // 3. WHATSAPP (META CLOUD API)
    {
      id: "WHATSAPP",
      name: "WhatsApp Cloud API",
      type: "CHANNEL",
      authType: "BEARER_TOKEN",
      initialStatus: "REQUER CREDENCIAIS",
      categoryLabel: "Canal de distribuição",
      actionButtonLabel: "Configurar WhatsApp",
      description: "Conecte sua conta através da WhatsApp Cloud API oficial da Meta.",
      documentationUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
      capabilitiesDisplay: [
        "Envio de mensagens de texto",
        "Envio de fotos e templates",
        "Webhooks de status de entrega",
      ],
      capabilities: ["SEND_MESSAGE", "SEND_MEDIA", "WEBHOOKS"],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "phoneNumberId",
          label: "Phone Number ID",
          type: "text",
          placeholder: "105948202485930",
          helperText: "ID do número de telefone no painel Meta for Developers",
          required: true,
        },
        {
          key: "accessToken",
          label: "System User Access Token",
          type: "password",
          placeholder: "EAAG...",
          helperText: "Token permanente de Usuário do Sistema com permissão whatsapp_business_messaging",
          required: true,
        },
        {
          key: "wabaId",
          label: "WhatsApp Business Account ID (WABA ID)",
          type: "text",
          placeholder: "109283746592817",
          helperText: "ID da conta do WhatsApp Business",
          required: false,
        },
      ],
    },

    // 4. MERCADO LIVRE
    {
      id: "MERCADO_LIVRE",
      name: "Mercado Livre",
      type: "MARKETPLACE",
      authType: "OAUTH2",
      initialStatus: "REQUER OAUTH",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Conectar Mercado Livre",
      description: "Consulta oficial de produtos, preços, reputação de vendedores e notificações em tempo real.",
      documentationUrl: "https://developers.mercadolibre.com.br",
      capabilitiesDisplay: [
        "Busca e consulta de produtos",
        "Preços e estoque atualizados",
        "Notificações de pedidos via Webhook",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "READ_PRICES",
        "READ_STOCK",
        "READ_DISCOUNTS",
        "WEBHOOKS",
      ],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "clientId",
          label: "App ID / Client ID",
          type: "text",
          placeholder: "1234567890123456",
          helperText: "Client ID da aplicação criada no Mercado Livre Developers",
          required: true,
        },
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          placeholder: "abcdef123456...",
          helperText: "Chave secreta gerada no Mercado Livre Developers",
          required: true,
        },
      ],
    },

    // 5. SHOPEE
    {
      id: "SHOPEE",
      name: "Shopee",
      type: "MARKETPLACE",
      authType: "HMAC_SHA256",
      initialStatus: "REQUER CREDENCIAIS / APROVAÇÃO",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Configurar Shopee",
      description: "Geração oficial de short links de afiliados e consulta de comissões via Open Platform.",
      documentationUrl: "https://open-api.affiliate.shopee.com.br",
      capabilitiesDisplay: [
        "Geração de short links de afiliado",
        "Consulta de taxas de comissão",
        "Relatórios de conversão oficiais",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "GENERATE_AFFILIATE_LINK",
        "READ_COMMISSION",
        "READ_CONVERSIONS",
      ],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "appId",
          label: "App ID / Partner ID",
          type: "text",
          placeholder: "123456",
          helperText: "Identificador da conta parceira aprovada na Shopee",
          required: true,
        },
        {
          key: "secretKey",
          label: "Secret Key",
          type: "password",
          placeholder: "shopee_secret_key_...",
          helperText: "Chave de assinatura HMAC da API de afiliados",
          required: true,
        },
      ],
    },

    // 6. AMAZON
    {
      id: "AMAZON",
      name: "Amazon Associates",
      type: "MARKETPLACE",
      authType: "AWS_SIGV4",
      initialStatus: "REQUER APROVAÇÃO",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Configurar Amazon",
      description: "Busca oficial de produtos, preços atualizados e links de associados via PA-API 5.0.",
      documentationUrl: "https://webservices.amazon.com/paapi5/documentation/",
      capabilitiesDisplay: [
        "Busca de produtos PA-API 5.0",
        "Preços, ofertas e disponibilidade",
        "Links de associados com tag oficial",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "READ_PRICES",
        "READ_STOCK",
        "GENERATE_AFFILIATE_LINK",
      ],
      isOfficiallySupported: true,
      requiredFields: [
        {
          key: "accessKey",
          label: "Access Key ID",
          type: "text",
          placeholder: "AKIA...",
          helperText: "Chave pública gerada no Amazon Associates",
          required: true,
        },
        {
          key: "secretKey",
          label: "Secret Access Key",
          type: "password",
          placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          helperText: "Chave secreta AWS SigV4",
          required: true,
        },
        {
          key: "partnerTag",
          label: "Store ID / Associate Tag",
          type: "text",
          placeholder: "meusite-20",
          helperText: "Tag de associado para atribuição de comissão",
          required: true,
        },
      ],
    },
  ];

  static getAll(): ProviderDefinition[] {
    return this.PROVIDERS;
  }

  static getById(id: string): ProviderDefinition | undefined {
    return this.PROVIDERS.find((p) => p.id.toUpperCase() === id.toUpperCase());
  }

  static getMarketplaces(): ProviderDefinition[] {
    return this.PROVIDERS.filter((p) => p.type === "MARKETPLACE");
  }

  static getChannels(): ProviderDefinition[] {
    return this.PROVIDERS.filter((p) => p.type === "CHANNEL");
  }
}
