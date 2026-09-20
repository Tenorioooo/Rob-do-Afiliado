/**
 * Channel Domain Types & Adapter Contracts
 */

export type ChannelType = "TELEGRAM" | "WHATSAPP" | "DISCORD" | "WEBHOOK";

export type ChannelStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "DISABLED";

export type ChannelProviderSource = "mock" | "real";

export interface ChannelConfig {
  [key: string]: any;
}

export interface DispatchPayload {
  publicationId: string;
  offerId: string;
  title: string;
  body: string;
  cta: string;
  affiliateUrl: string;
  formattedMessage: string;
  destination: string;
  imageUrl?: string;
  config?: ChannelConfig;
}

export interface DispatchResult {
  success: boolean;
  source: ChannelProviderSource;
  provider: string;
  providerMessageId?: string;
  error?: string;
  errorCode?: string;
  timestamp: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  source: ChannelProviderSource;
  provider: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface IChannelAdapter {
  readonly type: ChannelType;
  readonly provider: string;
  readonly isMock: boolean;

  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] };
  testConnection(destination: string, config: ChannelConfig): Promise<ConnectionTestResult>;
  sendMessage(payload: DispatchPayload): Promise<DispatchResult>;
}
