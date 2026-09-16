export type IntegrationCapability =
  | "READ_PRODUCTS"
  | "READ_PRICES"
  | "READ_STOCK"
  | "READ_DISCOUNTS"
  | "GENERATE_AFFILIATE_LINK"
  | "READ_COMMISSION"
  | "READ_CONVERSIONS"
  | "READ_ORDERS"
  | "WEBHOOKS"
  | "POSTBACKS"
  | "SEND_MESSAGE"
  | "SEND_MEDIA"
  | "EDIT_MESSAGE"
  | "DELETE_MESSAGE";

export type IntegrationType = "MARKETPLACE" | "CHANNEL";

export type IntegrationStatus =
  | "NOT_CONFIGURED"
  | "CONNECTING"
  | "CONNECTED"
  | "DEGRADED"
  | "ERROR"
  | "DISCONNECTED"
  | "MOCK"
  | "UNAVAILABLE";

export type AuthType =
  | "BOT_TOKEN"
  | "WEBHOOK_URL"
  | "OAUTH2"
  | "API_KEY"
  | "BEARER_TOKEN"
  | "AWS_SIGV4"
  | "HMAC_SHA256";

export class CapabilityHelper {
  /**
   * Checks if a capability is present in a JSON array string or string array.
   */
  static hasCapability(capabilities: string | string[], capability: IntegrationCapability): boolean {
    if (!capabilities) return false;
    const list: string[] = typeof capabilities === "string" ? JSON.parse(capabilities || "[]") : capabilities;
    return list.includes(capability);
  }

  /**
   * Formats capability names into human-readable Portuguese labels.
   */
  static formatLabel(capability: IntegrationCapability): string {
    const labels: Record<IntegrationCapability, string> = {
      READ_PRODUCTS: "Leitura de Produtos",
      READ_PRICES: "Monitoramento de Preços",
      READ_STOCK: "Verificação de Estoque",
      READ_DISCOUNTS: "Cálculo de Descontos",
      GENERATE_AFFILIATE_LINK: "Geração de Links de Afiliado",
      READ_COMMISSION: "Consulta de Comissões",
      READ_CONVERSIONS: "Relatório de Conversões",
      READ_ORDERS: "Leitura de Pedidos",
      WEBHOOKS: "Notificações em Tempo Real (Webhooks)",
      POSTBACKS: "Postbacks de Afiliado",
      SEND_MESSAGE: "Envio de Mensagens",
      SEND_MEDIA: "Envio de Imagens/Mídia",
      EDIT_MESSAGE: "Edição de Mensagens",
      DELETE_MESSAGE: "Exclusão de Mensagens",
    };
    return labels[capability] || capability;
  }

  /**
   * Checks whether a provider supports a specific capability.
   */
  static supportsCapability(capabilities: IntegrationCapability[] | string | string[], capability: IntegrationCapability): boolean {
    return this.hasCapability(capabilities as any, capability);
  }
}
