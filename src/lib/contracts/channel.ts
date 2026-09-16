/**
 * Channel Adapter Contract
 * Defines standard operations for distribution channels
 * (Telegram groups/channels, WhatsApp groups/broadcasts, Discord, Webhooks)
 */

export interface ChannelMessage {
  id?: string;
  headline: string;
  body: string;
  imageUrl?: string;
  affiliateUrl: string;
  originalPrice?: number;
  currentPrice: number;
  discountPercent?: number;
  callToAction: string;
  couponCode?: string;
}

export interface ChannelCredentials {
  botToken?: string;
  chatId?: string;
  phoneNumber?: string;
  sessionToken?: string;
  webhookUrl?: string;
  apiKey?: string;
}

export interface ChannelDeliveryResult {
  success: boolean;
  messageId?: string;
  sentAt: Date;
  error?: string;
}

export interface ChannelStatusInfo {
  connected: boolean;
  channelName: string;
  channelType: "TELEGRAM" | "WHATSAPP" | "DISCORD" | "WEBHOOK";
  memberCount?: number;
  lastActiveAt?: Date;
  statusMessage: string;
}

export interface ChannelAdapter {
  readonly channelType: "TELEGRAM" | "WHATSAPP" | "DISCORD" | "WEBHOOK";

  /**
   * Connects and verifies channel credentials/permissions
   */
  connect(credentials: ChannelCredentials): Promise<{ success: boolean; error?: string }>;

  /**
   * Disconnects the channel
   */
  disconnect(): Promise<boolean>;

  /**
   * Sends a plain text or formatted message
   */
  sendMessage(text: string): Promise<ChannelDeliveryResult>;

  /**
   * Dispatches a structured affiliate offer post
   */
  sendOffer(offer: ChannelMessage): Promise<ChannelDeliveryResult>;

  /**
   * Returns live status and metadata about the channel
   */
  getStatus(): Promise<ChannelStatusInfo>;
}
