import { IChannelAdapter, ChannelType, ChannelConfig, ConnectionTestResult, DispatchPayload, DispatchResult } from "../types";

export class MockWhatsAppAdapter implements IChannelAdapter {
  readonly type: ChannelType = "WHATSAPP";
  readonly provider = "whatsapp-mock";
  readonly isMock = true;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!config.sessionId && !config.apiKey && !config.apiKey_configured) {
      // Optional for mock, but structure ready
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult> {
    if (!destination || destination.trim().length < 8) {
      return {
        success: false,
        source: "mock",
        provider: this.provider,
        message: "Destino do WhatsApp inválido. Informe o número com DDI (ex: 5511999999999) ou JID do grupo.",
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      source: "mock",
      provider: this.provider,
      message: `Conexão simulada com sucesso para o WhatsApp ${destination}. Sessão ativa em modo Mock.`,
      details: {
        destination,
        sessionStatus: "CONNECTED_MOCK",
        batteryLevel: "100%",
        mode: "demonstration",
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
        error: "Número ou grupo de destino do WhatsApp não especificado.",
        errorCode: "INVALID_DESTINATION",
        timestamp: new Date(),
      };
    }

    const providerMessageId = `mock_wa_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      success: true,
      source: "mock",
      provider: this.provider,
      providerMessageId,
      timestamp: new Date(),
    };
  }
}
