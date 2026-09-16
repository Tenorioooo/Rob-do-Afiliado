import { ExternalRequestClient } from "@/services/integrations/http-client";
import crypto from "crypto";

export class AmazonMarketplaceAdapter {
  private static readonly SERVICE = "ProductAdvertisingAPI";
  private static readonly REGION = "us-east-1";
  private static readonly HOST = "webservices.amazon.com";
  private static readonly ENDPOINT = `https://${this.HOST}/paapi5/searchitems`;

  /**
   * Generates AWS SigV4 signed headers for PA-API 5.0 requests.
   */
  private static signSigV4(params: {
    accessKey: string;
    secretKey: string;
    payload: string;
    target: string;
  }): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);

    const canonicalUri = "/paapi5/searchitems";
    const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${this.HOST}\nx-amz-date:${amzDate}\nx-amz-target:${params.target}\n`;
    const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
    const payloadHash = crypto.createHash("sha256").update(params.payload).digest("hex");

    const canonicalRequest = `POST\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${this.REGION}/${this.SERVICE}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash("sha256").update(canonicalRequest).digest("hex")}`;

    const kDate = crypto.createHmac("sha256", `AWS4${params.secretKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(this.REGION).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(this.SERVICE).digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authorizationHeader = `${algorithm} Credential=${params.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: this.HOST,
      "x-amz-date": amzDate,
      "x-amz-target": params.target,
      Authorization: authorizationHeader,
    };
  }

  /**
   * Searches items and returns monetized associate detail URLs using PA-API 5.0.
   */
  static async searchItems(params: {
    accessKey: string;
    secretKey: string;
    partnerTag: string;
    keywords: string;
  }): Promise<{ items: any[]; success: boolean; errorMessage?: string }> {
    try {
      const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
      const body = {
        Keywords: params.keywords,
        Resources: [
          "ItemInfo.Title",
          "Offers.Listings.Price",
          "Images.Primary.Medium",
          "DetailPageURL",
        ],
        PartnerTag: params.partnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.com.br",
      };

      const payload = JSON.stringify(body);
      const headers = this.signSigV4({
        accessKey: params.accessKey,
        secretKey: params.secretKey,
        payload,
        target,
      });

      const res = await ExternalRequestClient.request(this.ENDPOINT, {
        method: "POST",
        headers,
        body: payload,
      });

      if (res.ok && res.data?.SearchResult?.Items) {
        return {
          success: true,
          items: res.data.SearchResult.Items,
        };
      }

      const errMsg = res.data?.Errors?.[0]?.Message || `Erro Amazon PA-API (HTTP ${res.status})`;
      return { success: false, items: [], errorMessage: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar Amazon PA-API";
      return { success: false, items: [], errorMessage: msg };
    }
  }

  /**
   * Validates PA-API credentials with a lightweight test query.
   */
  static async validateConnection(params: {
    accessKey: string;
    secretKey: string;
    partnerTag: string;
  }): Promise<{ valid: boolean; errorMessage?: string }> {
    const res = await this.searchItems({
      accessKey: params.accessKey,
      secretKey: params.secretKey,
      partnerTag: params.partnerTag,
      keywords: "test",
    });

    return {
      valid: res.success,
      errorMessage: res.errorMessage,
    };
  }
}
