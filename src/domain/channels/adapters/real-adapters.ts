import { IChannelAdapter, ChannelType, ChannelConfig, ConnectionTestResult, DispatchPayload, DispatchResult } from "../types";
import { TelegramChannelAdapter } from "@/integrations/channels/telegram.adapter";
import { DiscordChannelAdapter } from "@/integrations/channels/discord.adapter";
import { WhatsAppChannelAdapter } from "@/integrations/channels/whatsapp.adapter";

export class RealTelegramAdapter implements IChannelAdapter {
  readonly type: ChannelType = "TELEGRAM";
  readonly provider = "telegram-api";
  readonly isMock = false;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!config.botToken && !config.bot_token && !config.botToken_configured) {
      errors.push("Bot Token oficial é obrigatório.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    const token = config.botToken || config.bot_token;
    if (!token) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: "Bot Token não configurado no canal ou na Central de Integrações.",
        timestamp: new Date(),
      };
    }

    const validation = await TelegramChannelAdapter.validateConnection(token);
    if (!validation.valid) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: `Falha ao validar bot do Telegram: ${validation.errorMessage || "Token inválido"}`,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      source: "real",
      provider: this.provider,
      message: `Conexão validada com sucesso com @${validation.username || validation.firstName || "Bot"}`,
      details: {
        botUsername: validation.username ? `@${validation.username}` : undefined,
        botName: validation.firstName,
        botId: validation.botId,
        destination: destination || undefined,
        status: "ONLINE",
      },
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    const token = payload.config?.botToken || payload.config?.bot_token;
    if (!token) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        error: "Bot Token ausente nas credenciais.",
        errorCode: "MISSING_CREDENTIALS",
        timestamp: new Date(),
      };
    }

    const result = await TelegramChannelAdapter.sendMessage({
      botToken: token,
      chatId: payload.destination,
      text: payload.formattedMessage || `${payload.title}\n\n${payload.body}\n\n${payload.affiliateUrl}`,
      parseMode: "HTML",
    });

    return {
      success: result.success,
      source: "real",
      provider: this.provider,
      providerMessageId: result.messageId,
      error: result.errorMessage,
      timestamp: new Date(),
    };
  }
}

export class RealDiscordAdapter implements IChannelAdapter {
  readonly type: ChannelType = "DISCORD";
  readonly provider = "discord-webhook-api";
  readonly isMock = false;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!config.webhookUrl && !config.webhook_url && !config.webhookUrl_configured) {
      errors.push("Webhook URL oficial do Discord é obrigatória.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    const webhookUrl = config.webhookUrl || config.webhook_url || destination;
    const botToken = config.botToken || config.bot_token;

    const targetUrl = webhookUrl?.startsWith("http") ? webhookUrl : "";
    if (!targetUrl && !botToken) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: "URL do Webhook do Discord não informada.",
        timestamp: new Date(),
      };
    }

    const validation = await DiscordChannelAdapter.validateConnection(targetUrl);

    return {
      success: validation.valid,
      source: "real",
      provider: this.provider,
      message: validation.valid
        ? `Webhook do Discord conectado com sucesso${validation.name ? ` (${validation.name})` : ""}.`
        : `Erro ao validar Webhook do Discord: ${validation.errorMessage || "URL inválida"}`,
      details: {
        webhookName: validation.name,
        channelId: validation.channelId,
        guildId: validation.guildId,
        destination: destination || undefined,
        status: validation.valid ? "ONLINE" : "ERROR",
      },
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    const webhookUrl = payload.config?.webhookUrl || payload.config?.webhook_url || payload.destination;
    const botToken = payload.config?.botToken || payload.config?.bot_token;

    if (!webhookUrl && !botToken) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        error: "Webhook URL ou Bot Token do Discord não configurados.",
        errorCode: "MISSING_CREDENTIALS",
        timestamp: new Date(),
      };
    }

    let result;
    if (webhookUrl && webhookUrl.startsWith("http")) {
      result = await DiscordChannelAdapter.sendWebhookMessage({
        webhookUrl,
        content: payload.formattedMessage || `${payload.title}\n\n${payload.body}\n\n${payload.affiliateUrl}`,
      });
    } else if (botToken && payload.destination) {
      result = await DiscordChannelAdapter.sendBotMessage({
        botToken,
        channelId: payload.destination,
        content: payload.formattedMessage || `${payload.title}\n\n${payload.body}\n\n${payload.affiliateUrl}`,
      });
    } else {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        error: "Destino inválido para envio Discord.",
        errorCode: "INVALID_DESTINATION",
        timestamp: new Date(),
      };
    }

    return {
      success: result.success,
      source: "real",
      provider: this.provider,
      providerMessageId: result.messageId,
      error: result.errorMessage,
      timestamp: new Date(),
    };
  }
}

export class RealWhatsAppAdapter implements IChannelAdapter {
  readonly type: ChannelType = "WHATSAPP";
  readonly provider = "meta-cloud-api";
  readonly isMock = false;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const hasInstance = Boolean(config.instanceUrl || config.instance_url || config.instanceUrl_configured);
    const hasCloud = Boolean(
      (config.accessToken || config.access_token || config.accessToken_configured) &&
      (config.phoneNumberId || config.phone_number_id)
    );

    if (!hasInstance && !hasCloud) {
      errors.push("Configure a URL da Instância (para Grupos) ou Phone Number ID e Access Token (Meta Cloud API).");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    const instanceUrl = config.instanceUrl || config.instance_url;
    const apiKey = config.apiKey || config.api_key || config.token;
    const instanceName = config.instanceName || config.instance_name;
    const accessToken = config.accessToken || config.access_token;
    const phoneNumberId = config.phoneNumberId || config.phone_number_id;

    if (!instanceUrl && (!accessToken || !phoneNumberId)) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: "Configuração do WhatsApp não encontrada (Instância ou Meta Cloud API necessária).",
        timestamp: new Date(),
      };
    }

    const validation = await WhatsAppChannelAdapter.validateConnection({
      instanceUrl,
      apiKey,
      instanceName,
      phoneNumberId,
      accessToken,
    });

    return {
      success: validation.valid,
      source: "real",
      provider: this.provider,
      message: validation.valid
        ? `WhatsApp conectado com sucesso (${validation.instanceName || validation.verifiedName || validation.displayPhoneNumber || "Pronto para envios"})`
        : `Erro ao validar WhatsApp: ${validation.errorMessage || "Credenciais inválidas"}`,
      details: {
        instanceName: validation.instanceName,
        verifiedName: validation.verifiedName,
        displayPhoneNumber: validation.displayPhoneNumber,
        destination: destination || undefined,
        status: validation.valid ? "ONLINE" : "ERROR",
      },
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    const instanceUrl = payload.config?.instanceUrl || payload.config?.instance_url;
    const apiKey = payload.config?.apiKey || payload.config?.api_key || payload.config?.token;
    const instanceName = payload.config?.instanceName || payload.config?.instance_name;
    const accessToken = payload.config?.accessToken || payload.config?.access_token;
    const phoneNumberId = payload.config?.phoneNumberId || payload.config?.phone_number_id;

    if (!instanceUrl && (!accessToken || !phoneNumberId)) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        error: "Credenciais de WhatsApp (Instância ou Meta Cloud API) não configuradas.",
        errorCode: "MISSING_CREDENTIALS",
        timestamp: new Date(),
      };
    }

    const messageText = payload.formattedMessage || `${payload.title}\n\n${payload.body}\n\n${payload.affiliateUrl}`;

    const result = await WhatsAppChannelAdapter.sendMessage({
      instanceUrl,
      apiKey,
      instanceName,
      phoneNumberId,
      accessToken,
      destination: payload.destination,
      text: messageText,
      imageUrl: payload.imageUrl,
    });

    return {
      success: result.success,
      source: "real",
      provider: this.provider,
      providerMessageId: result.messageId,
      error: result.errorMessage,
      timestamp: new Date(),
    };
  }
}
