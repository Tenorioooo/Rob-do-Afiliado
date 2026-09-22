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

    // 3. WHATSAPP (META CLOUD API OFICIAL COM LOGIN DO FACEBOOK / GRUPOS & CANAIS)
    {
      id: "WHATSAPP",
      name: "WhatsApp (Meta Oficial)",
      type: "CHANNEL",
      authType: "OAUTH2",
      initialStatus: "CONECTAR COM OAUTH",
      categoryLabel: "Canal de distribuição oficial",
      actionButtonLabel: "Conectar com Facebook",
      description: "Envie ofertas automáticas de forma 100% oficial pela Meta Cloud API em 1 clique fazendo login com o Facebook (ou via instâncias Evolution API).",
      documentationUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
      capabilitiesDisplay: [
        "Conexão Oficial via Facebook (1 clique)",
        "Disparo de fotos dos produtos e copies formatadas",
        "1.000 conversas gratuitas/mês direto da Meta",
      ],
      capabilities: ["SEND_MESSAGE", "SEND_MEDIA", "WEBHOOKS"],
      isOfficiallySupported: true,
      setupGuide: [
        {
          title: "1. Conexão Oficial via Facebook (Recomendado)",
          description: "Clique em 'Conectar com Facebook' para autorizar seu número de WhatsApp Business de forma 100% oficial pela Meta, sem precisar de servidores ou QR Code que desconecta.",
          linkUrl: "https://developers.facebook.com/docs/whatsapp/embedded-signup",
          linkLabel: "Documentação Meta",
        },
        {
          title: "2. Cota Gratuita da Meta",
          description: "A Meta fornece 1.000 mensagens de serviço gratuitas todo mês para cada conta conectada.",
        },
        {
          title: "3. Disparar em Grupos e Canais",
          description: "Após a conexão, cadastre na aba 'Canais' os números ou grupos para onde o Robô do Afiliado enviará as promoções automaticamente.",
        },
      ],
      requiredFields: [
        {
          key: "phoneNumberId",
          label: "Phone Number ID (Meta Cloud API)",
          type: "text",
          placeholder: "105948202485930",
          helperText: "Identificador do número de WhatsApp na Meta (preenchido automaticamente via Login do Facebook)",
          required: false,
        },
        {
          key: "accessToken",
          label: "Access Token (Meta Cloud API)",
          type: "password",
          placeholder: "EAAG...",
          helperText: "Token de acesso permanente (preenchido automaticamente via Login do Facebook)",
          required: false,
        },
        {
          key: "instanceUrl",
          label: "URL da Evolution API (Opcional para Instância Própria)",
          type: "url",
          placeholder: "https://api.seudominio.com",
          helperText: "Opcional: Caso utilize sua própria instância da Evolution API",
          required: false,
        },
        {
          key: "apiKey",
          label: "Chave de API / Token da Instância",
          type: "password",
          placeholder: "Cole sua AUTHENTICATION_API_KEY aqui",
          helperText: "Opcional: Chave de autenticação da Evolution API",
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
      documentationUrl: "https://affiliate.shopee.com.br/open_api",
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
          title: "1. Acesse o Portal de Afiliados da Shopee (Open API)",
          description: "Faça login no painel de afiliados da Shopee e acesse as configurações da Open API.",
          linkUrl: "https://affiliate.shopee.com.br/open_api",
          linkLabel: "Abrir Painel de Afiliados Shopee (Open API)",
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
