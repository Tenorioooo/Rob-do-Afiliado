import {
  ChannelAdapter,
  ChannelCredentials,
  ChannelMessage,
  ChannelDeliveryResult,
  ChannelStatusInfo,
} from "../contracts/channel";

/**
 * Telegram Channel Adapter (Mock / Interface implementation)
 * Ready for Telegram Bot API integration (sendMessage, sendPhoto).
 */
export class TelegramAdapter implements ChannelAdapter {
  readonly channelType = "TELEGRAM";
  private isConnected = false;
  private botToken?: string;
  private chatId?: string;

  async connect(credentials: ChannelCredentials): Promise<{ success: boolean; error?: string }> {
    if (!credentials.botToken || !credentials.chatId) {
      return {
        success: false,
        error: "Bot Token e Chat ID (ex: @canal_ofertas) são obrigatórios.",
      };
    }

    this.botToken = credentials.botToken;
    this.chatId = credentials.chatId;
    this.isConnected = true;

    return { success: true };
  }

  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.botToken = undefined;
    this.chatId = undefined;
    return true;
  }

  async sendMessage(text: string): Promise<ChannelDeliveryResult> {
    if (!this.isConnected) {
      return {
        success: false,
        sentAt: new Date(),
        error: "Canal Telegram não está conectado.",
      };
    }

    return {
      success: true,
      messageId: `tg-msg-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  async sendOffer(offer: ChannelMessage): Promise<ChannelDeliveryResult> {
    if (!this.isConnected) {
      return {
        success: false,
        sentAt: new Date(),
        error: "Canal Telegram não está conectado.",
      };
    }

    // Format post text for Telegram MarkdownV2
    const formattedPost = `
🔥 *${offer.headline}*

${offer.body}

💰 *De: R$ ${offer.originalPrice?.toFixed(2) || "---"}*
⚡ *Por apenas: R$ ${offer.currentPrice.toFixed(2)}*
🏷️ *Desconto: ${offer.discountPercent}% OFF*

👉 [${offer.callToAction}](${offer.affiliateUrl})
    `.trim();

    console.log("[TelegramAdapter] Simulated dispatch:", formattedPost);

    return {
      success: true,
      messageId: `tg-offer-${Date.now()}`,
      sentAt: new Date(),
    };
  }

  async getStatus(): Promise<ChannelStatusInfo> {
    return {
      connected: this.isConnected,
      channelName: this.chatId || "Canal Telegram VIP",
      channelType: "TELEGRAM",
      memberCount: this.isConnected ? 8420 : 0,
      lastActiveAt: new Date(),
      statusMessage: this.isConnected
        ? "Bot do Telegram ativo com permissão de administrador."
        : "Canal desconectado.",
    };
  }
}
