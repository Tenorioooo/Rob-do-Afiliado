import {
  ChannelAdapter,
  ChannelCredentials,
  ChannelMessage,
  ChannelDeliveryResult,
  ChannelStatusInfo,
} from "../contracts/channel";

/**
 * WhatsApp Channel Adapter (Mock / Interface implementation)
 * Ready for Evolution API / Baileys / WhatsApp Cloud API integration.
 */
export class WhatsAppAdapter implements ChannelAdapter {
  readonly channelType = "WHATSAPP";
  private isConnected = false;
  private phoneNumber?: string;

  async connect(credentials: ChannelCredentials): Promise<{ success: boolean; error?: string }> {
    if (!credentials.phoneNumber && !credentials.sessionToken) {
      return {
        success: false,
        error: "Número de WhatsApp ou token de sessão é obrigatório.",
      };
    }

    this.phoneNumber = credentials.phoneNumber;
    this.isConnected = true;

    return { success: true };
  }

  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.phoneNumber = undefined;
    return true;
  }

  async sendMessage(text: string): Promise<ChannelDeliveryResult> {
    if (!this.isConnected) {
      return {
        success: false,
        sentAt: new Date(),
        error: "Sessão do WhatsApp desconectada.",
      };
    }

    return {
      success: true,
      messageId: `wpp-msg-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  async sendOffer(offer: ChannelMessage): Promise<ChannelDeliveryResult> {
    if (!this.isConnected) {
      return {
        success: false,
        sentAt: new Date(),
        error: "Sessão do WhatsApp desconectada.",
      };
    }

    const formattedWpp = `
🚨 *ACHADINHO IMPERDÍVEL!* 🚨

${offer.headline}

${offer.body}

💵 *De:* ~R$ ${offer.originalPrice?.toFixed(2) || ""}~
💥 *Por apenas:* *R$ ${offer.currentPrice.toFixed(2)}*
📉 *Desconto:* ${offer.discountPercent}% OFF

🛒 *COMPRE AQUI COM DESCONTO:*
${offer.affiliateUrl}
    `.trim();

    console.log("[WhatsAppAdapter] Simulated dispatch:", formattedWpp);

    return {
      success: true,
      messageId: `wpp-offer-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  async getStatus(): Promise<ChannelStatusInfo> {
    return {
      connected: this.isConnected,
      channelName: this.phoneNumber || "Grupo WhatsApp Ofertas",
      channelType: "WHATSAPP",
      memberCount: this.isConnected ? 650 : 0,
      lastActiveAt: new Date(),
      statusMessage: this.isConnected
        ? "Instância WhatsApp conectada via QR Code/API."
        : "Instância desconectada.",
    };
  }
}
