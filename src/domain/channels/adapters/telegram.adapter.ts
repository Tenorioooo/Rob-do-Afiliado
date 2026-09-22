import { IChannelAdapter, ChannelType, ChannelConfig, ConnectionTestResult, DispatchPayload, DispatchResult } from "../types";

export class MockTelegramAdapter implements IChannelAdapter {
  readonly type: ChannelType = "TELEGRAM";
  readonly provider = "telegram-mock";
  readonly isMock = true;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!config.botToken && !config.botToken_configured) {
      errors.push("Bot Token é obrigatório (ex: 123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ).");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    if (!destination || destination.trim().length === 0) {
      return {
        success: false,
        source: "mock",
        provider: this.provider,
        message: "Destino do Telegram inválido. Informe um Chat ID (ex: -100123456789) ou @canal.",
        timestamp: new Date(),
      };
    }

    // Deterministic test
    return {
      success: true,
      source: "mock",
      provider: this.provider,
      message: `Conexão validada com sucesso para o canal ${destination}.`,
      details: {
        destination,
        status: "CONNECTED",
      },
      timestamp: new Date(),
    };
  }

  async sendMessage(payload: DispatchPayload): Promise<DispatchResult> {
    if (!payload.destination) {
      return {
        success: false,
        source: "mock",
        provider: this.provider,
        error: "Destino do Telegram não especificado.",
        errorCode: "INVALID_DESTINATION",
        timestamp: new Date(),
      };
    }

    const providerMessageId = `mock_tg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      success: true,
      source: "mock",
      provider: this.provider,
      providerMessageId,
      timestamp: new Date(),
    };
  }
}
