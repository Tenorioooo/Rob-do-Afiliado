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
        message: "Bot Token não informado.",
        timestamp: new Date(),
      };
    }

    const validation = await TelegramChannelAdapter.validateConnection(token);
    if (!validation.valid) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: `Falha de validação Telegram: ${validation.errorMessage}`,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      source: "real",
      provider: this.provider,
      message: `Conexão Telegram validada com sucesso com @${validation.username || validation.firstName}`,
      details: validation,
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
    const validation = await DiscordChannelAdapter.validateConnection(targetUrl);

    return {
      success: validation.valid,
      source: "real",
      provider: this.provider,
      message: validation.valid
        ? "Webhook / Bot do Discord validado com sucesso."
        : `Erro Discord: ${validation.errorMessage}`,
      details: validation,
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
    if (!config.accessToken && !config.access_token && !config.accessToken_configured) {
      errors.push("Access Token do WhatsApp Cloud API é obrigatório.");
    }
    if (!config.phoneNumberId && !config.phone_number_id) {
      errors.push("Phone Number ID é obrigatório.");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    const accessToken = config.accessToken || config.access_token;
    const phoneNumberId = config.phoneNumberId || config.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        message: "Access Token e Phone Number ID são obrigatórios.",
        timestamp: new Date(),
      };
    }

    const validation = await WhatsAppChannelAdapter.validateConnection({
      accessToken,
      phoneNumberId,
    });

    return {
      success: validation.valid,
      source: "real",
      provider: this.provider,
      message: validation.valid
        ? `WhatsApp Meta Cloud API validado (${validation.verifiedName || validation.displayPhoneNumber})`
        : `Erro WhatsApp Cloud API: ${validation.errorMessage}`,
      details: validation,
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    const accessToken = payload.config?.accessToken || payload.config?.access_token;
    const phoneNumberId = payload.config?.phoneNumberId || payload.config?.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return {
        success: false,
        source: "real",
        provider: this.provider,
        error: "Access Token ou Phone Number ID não configurados.",
        errorCode: "MISSING_CREDENTIALS",
        timestamp: new Date(),
      };
    }

    const result = await WhatsAppChannelAdapter.sendTextMessage({
      accessToken,
      phoneNumberId,
      to: payload.destination,
      text: payload.formattedMessage || `${payload.title}\n\n${payload.body}\n\n${payload.affiliateUrl}`,
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
