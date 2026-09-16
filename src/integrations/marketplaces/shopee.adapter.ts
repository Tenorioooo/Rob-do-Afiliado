import { ExternalRequestClient } from "@/services/integrations/http-client";
import crypto from "crypto";

export class ShopeeMarketplaceAdapter {
  private static readonly GRAPHQL_ENDPOINT = "https://open-api.affiliate.shopee.com.br/graphql";

  /**
   * Generates official Shopee Affiliate HMAC signature.
   */
  static generateSignature(params: {
    appId: string;
    secret: string;
    timestamp: number | string;
    payload: string;
  }): string {
    const factor = `${params.appId}${params.timestamp}${params.payload}${params.secret}`;
    return crypto.createHash("sha256").update(factor).digest("hex");
  }

  /**
   * Generates official Shopee Affiliate Open API authorization headers.
   */
  private static generateAuthHeaders(appId: string, secretKey: string, payload: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature({ appId, secret: secretKey, timestamp, payload });

    return {
      "Content-Type": "application/json",
      Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
    };
  }

  /**
   * Generates a monetized short link using Shopee Affiliate GraphQL API.
   */
  static async generateAffiliateLink(params: {
    appId: string;
    secretKey: string;
    originUrl: string;
    subIds?: string[];
  }): Promise<{ shortLink?: string; success: boolean; errorMessage?: string }> {
    try {
      const query = `
        mutation {
          generateShortLink(input: {
            originUrl: "${params.originUrl}",
            subIds: ${JSON.stringify(params.subIds || [])}
          }) {
            shortLink
          }
        }
      `;

      const payload = JSON.stringify({ query });
      const headers = this.generateAuthHeaders(params.appId, params.secretKey, payload);

      const res = await ExternalRequestClient.request(this.GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: payload,
      });

      if (res.ok && res.data?.data?.generateShortLink?.shortLink) {
        return {
          success: true,
          shortLink: res.data.data.generateShortLink.shortLink,
        };
      }

      const err = res.data?.errors?.[0]?.message || `Erro Shopee API (HTTP ${res.status})`;
      return { success: false, errorMessage: err };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar link de afiliado Shopee";
      return { success: false, errorMessage: msg };
    }
  }

  /**
   * Validates partner credentials by performing a lightweight query.
   */
  static async validateConnection(appId: string, secretKey: string): Promise<{ valid: boolean; errorMessage?: string }> {
    try {
      const query = `
        query {
          conversionReport(page: 1, limit: 1) {
            total
          }
        }
      `;
      const payload = JSON.stringify({ query });
      const headers = this.generateAuthHeaders(appId, secretKey, payload);

      const res = await ExternalRequestClient.request(this.GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: payload,
        timeoutMs: 6000,
      });

      if (res.ok && res.data && !res.data.errors) {
        return { valid: true };
      }

      const errMsg = res.data?.errors?.[0]?.message || `Credenciais inválidas (HTTP ${res.status})`;
      return { valid: false, errorMessage: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na validação com a API Shopee";
      return { valid: false, errorMessage: msg };
    }
  }
}
