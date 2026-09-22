import { IChannelAdapter, ChannelType, ChannelConfig, ConnectionTestResult, DispatchPayload, DispatchResult } from "../types";

export class MockDiscordAdapter implements IChannelAdapter {
  readonly type: ChannelType = "DISCORD";
  readonly provider = "discord-mock";
  readonly isMock = true;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!config.webhookUrl && !config.webhookUrl_configured) {
      errors.push("URL do Webhook do Discord é obrigatória (ex: https://discord.com/api/webhooks/...).");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    const target = destination || config.webhookUrl;
    if (!target || !target.includes("discord.com/api/webhooks")) {
      return {
        success: false,
        source: "mock",
        provider: this.provider,
        message: "Webhook do Discord inválido. Certifique-se de que a URL comece com https://discord.com/api/webhooks/.",
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      source: "mock",
      provider: this.provider,
      message: "Conexão com Webhook do Discord validada com sucesso.",
      details: {
        target,
        serverName: "Servidor Promos VIP",
        channelName: "#ofertas",
        status: "CONNECTED",
      },
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    const target = payload.destination || payload.config?.webhookUrl;
    if (!target) {
      return {
        success: false,
        source: "mock",
        provider: this.provider,
        error: "Webhook do Discord não configurado.",
        errorCode: "INVALID_WEBHOOK",
        timestamp: new Date(),
      };
    }

    const providerMessageId = `mock_dc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      success: true,
      source: "mock",
      provider: this.provider,
      providerMessageId,
      timestamp: new Date(),
    };
  }
}
