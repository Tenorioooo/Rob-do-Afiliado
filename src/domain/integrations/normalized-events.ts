export type NormalizedEventType =
  | "MESSAGE_RECEIVED"
  | "MESSAGE_SENT"
  | "CONVERSION"
  | "COMMISSION_UPDATED"
  | "PRODUCT_UPDATED"
  | "PRICE_CHANGED"
  | "ORDER_CREATED"
  | "CHANNEL_UPDATED"
  | "CONNECTION_CHANGED";

export interface NormalizedIntegrationEvent {
  provider: string;
  eventType: NormalizedEventType;
  externalEventId: string;
  connectionId?: string | null;
  userId?: string | null;
  timestamp: Date;
  rawPayload: any;
  data: {
    // For messages
    chatId?: string;
    messageId?: string;
    text?: string;
    senderId?: string;
    senderName?: string;
    // For conversions/orders
    externalOrderId?: string;
    orderValue?: number;
    commissionValue?: number;
    currency?: string;
    conversionStatus?: "PENDING" | "APPROVED" | "CANCELLED" | "REFUNDED";
    affiliateLinkId?: string;
    // For products
    externalProductId?: string;
    currentPrice?: number;
    originalPrice?: number;
    inStock?: boolean;
    // Extra
    metadata?: Record<string, any>;
  };
}
