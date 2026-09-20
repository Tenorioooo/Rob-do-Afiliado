import { IntegrationCapability, IntegrationType, AuthType } from "@/domain/integrations/capabilities";

export interface SetupStep {
  title: string;
  description: string;
  linkUrl?: string;
  linkLabel?: string;
}

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
  setupGuide?: SetupStep[];
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
      setupGuide: [
        {
          title: "1. Crie seu Bot no Telegram",
          description: "Abra o Telegram, pesquise por @BotFather e envie o comando /newbot. Siga os passos e escolha o nome do seu bot.",
          linkUrl: "https://t.me/BotFather",
          linkLabel: "Abrir @BotFather no Telegram",
        },
        {
          title: "2. Copie o Bot Token",
          description: "O BotFather fornecerá um token no formato 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ. Copie e cole no campo 'Bot Token'.",
        },
        {
          title: "3. Adicione o Bot ao seu Canal",
          description: "Adicione seu bot recém-criado como Administrador no seu Canal ou Grupo do Telegram e preencha o Chat ID ou @nomedocanal.",
        },
      ],
      requiredFields: [
        {
          key: "botToken",
          label: "Bot Token (obtido no @BotFather)",
          type: "password",
          placeholder: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
          helperText: "Token de autenticação gerado pelo @BotFather",
          required: true,
        },
        {
          key: "chatId",
          label: "Chat ID ou @username do Canal Público",
          type: "text",
          placeholder: "@meucanal_promos ou -1001234567890",
          helperText: "Identificador do canal público (ex: @meucanal) ou ID numérico do grupo",
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
      setupGuide: [
        {
          title: "1. Acesse as Configurações do seu Canal",
          description: "No Discord, clique com o botão direito no canal onde deseja enviar as ofertas e selecione 'Editar Canal'.",
        },
        {
          title: "2. Crie uma Integração Webhook",
          description: "Vá na aba 'Integrações' > 'Webhooks' e clique em 'Novo Webhook'. Escolha o nome e o avatar para o bot.",
        },
        {
          title: "3. Copie a URL do Webhook",
          description: "Clique em 'Copiar URL do Webhook' e cole no campo abaixo.",
        },
      ],
      requiredFields: [
        {
          key: "webhookUrl",
          label: "URL do Webhook do Canal",
          type: "url",
          placeholder: "https://discord.com/api/webhooks/123456789/abcdef...",
          helperText: "URL do Webhook criada nas configurações do canal no Discord",
          required: true,
        },
      ],
    },

    // 3. WHATSAPP (GRUPOS & CANAIS DE OFERTAS / INSTÂNCIAS / META CLOUD API)
    {
      id: "WHATSAPP",
      name: "WhatsApp (Grupos & Canais de Ofertas)",
      type: "CHANNEL",
      authType: "API_KEY",
      initialStatus: "REQUER CREDENCIAIS",
      categoryLabel: "Canal de distribuição",
      actionButtonLabel: "Configurar WhatsApp",
      description: "Envie ofertas automáticas com fotos, links tagueados e emojis diretamente em Grupos de WhatsApp de Achadinhos e Canais (Evolution API, Z-API, Webhook ou Meta Cloud API).",
      documentationUrl: "https://evolution-api.com",
      capabilitiesDisplay: [
        "Disparo de ofertas em Grupos e Canais de WhatsApp",
        "Envio de fotos dos produtos e copies formatadas",
        "Compatível com Evolution API, Z-API, Zapito e Meta Cloud API",
      ],
      capabilities: ["SEND_MESSAGE", "SEND_MEDIA", "WEBHOOKS"],
      isOfficiallySupported: true,
      setupGuide: [
        {
          title: "1. Modo Grupos de Ofertas (Recomendado para Afiliados)",
          description: "Conecte sua instância de WhatsApp (Evolution API, Z-API, Zapito ou Webhook) escaneando o QR Code no seu painel de instâncias.",
        },
        {
          title: "2. Copie a URL e Chave da API",
          description: "Cole abaixo a URL da API da sua instância (ex: https://api.suainstancia.com) e a Chave de API (ApiKey / Token).",
        },
        {
          title: "3. Cadastre seus Grupos de Promoção",
          description: "Na aba 'Canais', cadastre o ID/JID do Grupo (ex: 1203630283749@g.us) ou número para onde o robô irá disparar as ofertas automaticamente.",
        },
      ],
      requiredFields: [
        {
          key: "instanceUrl",
          label: "URL da API / Instância de WhatsApp (para Grupos)",
          type: "text",
          placeholder: "https://api.suainstancia.com ou https://seu-webhook.com",
          helperText: "URL da sua Evolution API, Z-API, Zapito ou Webhook de disparo em grupos",
          required: false,
        },
        {
          key: "apiKey",
          label: "Chave de API / Token da Instância",
          type: "password",
          placeholder: "sua_chave_de_api_ou_token",
          helperText: "Chave de autenticação (ApiKey da Evolution API ou Client-Token da Z-API)",
          required: false,
        },
        {
          key: "instanceName",
          label: "Nome da Instância (Opcional)",
          type: "text",
          placeholder: "promocoes_vip",
          helperText: "Nome da instância (usado na Evolution API)",
          required: false,
        },
        {
          key: "phoneNumberId",
          label: "Phone Number ID (Meta Cloud API Oficial)",
          type: "text",
          placeholder: "105948202485930",
          helperText: "Opcional: Apenas caso utilize a Meta Cloud API do Meta Developers",
          required: false,
        },
        {
          key: "accessToken",
          label: "Access Token (Meta Cloud API Oficial)",
          type: "password",
          placeholder: "EAAG...",
          helperText: "Opcional: Token do Usuário do Sistema da Meta",
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
      initialStatus: "PRONTO PARA CONECTAR",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Configurar Mercado Livre",
      description: "Atribuição de comissões de afiliados, rastreamento de links e consulta de produtos e descontos.",
      documentationUrl: "https://afiliados.mercadolivre.com.br",
      capabilitiesDisplay: [
        "Geração de links de afiliado com tag oficial",
        "Busca e consulta de produtos reais",
        "Preços e estoque atualizados",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "GENERATE_AFFILIATE_LINK",
        "READ_PRICES",
        "READ_STOCK",
        "READ_DISCOUNTS",
        "WEBHOOKS",
      ],
      isOfficiallySupported: true,
      setupGuide: [
        {
          title: "1. Acesse o Programa de Afiliados Mercado Livre",
          description: "Acesse o portal oficial do Mercado Livre Afiliados (ou faça seu login na conta de afiliado).",
          linkUrl: "https://afiliados.mercadolivre.com.br",
          linkLabel: "Acessar Portal de Afiliados Mercado Livre",
        },
        {
          title: "2. Localize sua Tag / ID de Afiliado",
          description: "No seu painel de afiliado ou extensão do Mercado Livre, localize seu identificador de parceiro (ex: MLB-AFF-XXXXX, seu token ou código de campanha matt_tool).",
        },
        {
          title: "3. Salve a Tag no Robô do Afiliado",
          description: "Insira sua Tag de Afiliado abaixo. Todas as oportunidades garimpadas e links gerados pelo robô levarão sua tag para garantir suas comissões.",
        },
      ],
      requiredFields: [
        {
          key: "affiliateTag",
          label: "Tag / ID de Afiliado Mercado Livre",
          type: "text",
          placeholder: "MLB-AFF-12345 ou seu token de afiliado",
          helperText: "Sua Tag ou identificador de parceiro no Mercado Livre Afiliados",
          required: true,
        },
        {
          key: "clientId",
          label: "App ID / Client ID Developers (Opcional)",
          type: "text",
          placeholder: "1234567890123456",
          helperText: "Opcional: Para sincronização avançada via API Developers",
          required: false,
        },
        {
          key: "clientSecret",
          label: "Client Secret Developers (Opcional)",
          type: "password",
          placeholder: "abcdef123456...",
          helperText: "Opcional: Chave secreta do Mercado Livre Developers",
          required: false,
        },
      ],
    },

    // 5. SHOPEE
    {
      id: "SHOPEE",
      name: "Shopee",
      type: "MARKETPLACE",
      authType: "HMAC_SHA256",
      initialStatus: "PRONTO PARA CONECTAR",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Configurar Shopee",
      description: "Geração oficial de short links de afiliados (shp.ee) e consulta de comissões via Open Platform.",
      documentationUrl: "https://open-api.affiliate.shopee.com.br",
      capabilitiesDisplay: [
        "Geração de short links oficiais shp.ee",
        "Atribuição direta de comissões na sua conta",
        "Consulta de taxas de comissão e ofertas",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "GENERATE_AFFILIATE_LINK",
        "READ_COMMISSION",
        "READ_CONVERSIONS",
      ],
      isOfficiallySupported: true,
      setupGuide: [
        {
          title: "1. Acesse o Shopee Affiliate Open Platform",
          description: "Faça login no portal de desenvolvedores de afiliados da Shopee.",
          linkUrl: "https://open-api.affiliate.shopee.com.br",
          linkLabel: "Abrir Shopee Affiliate Open Platform",
        },
        {
          title: "2. Obtenha seu App ID e Secret Key",
          description: "No menu lateral, vá em 'App Management' (Gerenciamento de Aplicativo) e copie o 'App ID' e o 'Secret Key'.",
        },
        {
          title: "3. Cole as Credenciais",
          description: "Insira os dados nos campos abaixo para habilitar a geração automática de shortlinks oficiais shp.ee.",
        },
      ],
      requiredFields: [
        {
          key: "appId",
          label: "App ID / Partner ID Shopee",
          type: "text",
          placeholder: "123456",
          helperText: "App ID fornecido no Shopee Affiliate Open Platform",
          required: true,
        },
        {
          key: "secretKey",
          label: "Secret Key Shopee",
          type: "password",
          placeholder: "shopee_secret_key_...",
          helperText: "Chave secreta de assinatura HMAC da API de afiliados",
          required: true,
        },
        {
          key: "subIdPrefix",
          label: "Prefixo Sub_ID de Rastreamento (Opcional)",
          type: "text",
          placeholder: "robo_afiliado",
          helperText: "Prefixo opcional para identificar vendas geradas no painel da Shopee",
          required: false,
        },
      ],
    },

    // 6. AMAZON
    {
      id: "AMAZON",
      name: "Amazon Associates",
      type: "MARKETPLACE",
      authType: "AWS_SIGV4",
      initialStatus: "PRONTO PARA CONECTAR",
      categoryLabel: "Marketplace de afiliados",
      actionButtonLabel: "Configurar Amazon",
      description: "Links de associados com tag oficial da Amazon e comissionamento em compras qualificadas.",
      documentationUrl: "https://associados.amazon.com.br",
      capabilitiesDisplay: [
        "Atribuição de comissões com Tag de Associado",
        "Geração de links parametrizados Amazon",
        "Compatibilidade com catálogo e promoções",
      ],
      capabilities: [
        "READ_PRODUCTS",
        "READ_PRICES",
        "READ_STOCK",
        "GENERATE_AFFILIATE_LINK",
      ],
      isOfficiallySupported: true,
      setupGuide: [
        {
          title: "1. Acesse o Amazon Associados Brasil",
          description: "Faça login no portal do programa de afiliados da Amazon.",
          linkUrl: "https://associados.amazon.com.br",
          linkLabel: "Abrir Amazon Associados",
        },
        {
          title: "2. Copie seu Store ID / Tag de Associado",
          description: "No topo direito do painel da Amazon, localize seu ID de Associado (exemplo: sualoja-20).",
        },
        {
          title: "3. Salve no Robô do Afiliado",
          description: "Cole sua Tag de Associado abaixo. Todos os produtos e ofertas da Amazon terão sua tag anexada.",
        },
      ],
      requiredFields: [
        {
          key: "partnerTag",
          label: "Store ID / Associate Tag da Amazon",
          type: "text",
          placeholder: "meusite-20",
          helperText: "Sua Tag de Associado cadastrada no Amazon Associados (ex: sualoja-20)",
          required: true,
        },
        {
          key: "accessKey",
          label: "Access Key ID PA-API (Opcional)",
          type: "text",
          placeholder: "AKIA...",
          helperText: "Opcional: Chave pública PA-API 5.0 para busca direta",
          required: false,
        },
        {
          key: "secretKey",
          label: "Secret Access Key (Opcional)",
          type: "password",
          placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          helperText: "Opcional: Chave secreta PA-API 5.0",
          required: false,
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
