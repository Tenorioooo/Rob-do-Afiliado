import { ExternalRequestClient } from "@/services/integrations/http-client";
import crypto from "crypto";

export class WhatsAppCloudAdapter {
  private static readonly API_VERSION = "v21.0";
  private static readonly BASE_URL = `https://graph.facebook.com/${this.API_VERSION}`;

  /**
   * Validates access token and phone number ID connectivity with Meta Graph API.
   */
  static async validateConnection(params: {
    phoneNumberId: string;
    accessToken: string;
  }): Promise<{
    valid: boolean;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    errorMessage?: string;
  }> {
    try {
      const url = `${this.BASE_URL}/${params.phoneNumberId}`;
      const res = await ExternalRequestClient.request(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.id) {
        return {
          valid: true,
          displayPhoneNumber: res.data.display_phone_number,
          verifiedName: res.data.verified_name,
          qualityRating: res.data.quality_rating,
        };
      }

      const errorDetail = res.data?.error?.message || `Erro HTTP ${res.status}`;
      return { valid: false, errorMessage: errorDetail };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao validar conexão WhatsApp Cloud API";
      return { valid: false, errorMessage: msg };
    }
  }

  /**
   * Sends a standard text message or image message via Cloud API.
   */
  static async sendMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    recipientPhone: string; // E.164 format without '+' e.g. "5511999998888"
    text: string;
    imageUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    try {
      const cleanRecipient = params.recipientPhone.replace(/\D/g, "");
      const url = `${this.BASE_URL}/${params.phoneNumberId}/messages`;

      let body: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanRecipient,
      };

      if (params.imageUrl) {
        body.type = "image";
        body.image = {
          link: params.imageUrl,
          caption: params.text,
        };
      } else {
        body.type = "text";
        body.text = {
          preview_url: true,
          body: params.text,
        };
      }

      const res = await ExternalRequestClient.request(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
        body,
      });

      if (res.ok && res.data?.messages?.[0]?.id) {
        return {
          success: true,
          messageId: res.data.messages[0].id,
        };
      }

      const errMsg = res.data?.error?.message || `Falha ao enviar WhatsApp (HTTP ${res.status})`;
      return { success: false, errorMessage: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar mensagem no WhatsApp";
      return { success: false, errorMessage: msg };
    }
  }

  /**
   * Validates Meta Webhook Signature (X-Hub-Signature-256).
   */
  static validateWebhookSignature(
    rawBody: string,
    signatureHeader: string | null | undefined,
    appSecret: string
  ): boolean {
    if (!signatureHeader || !appSecret) return false;

    try {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")}`;

      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  static async sendTextMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    text: string;
  }) {
    return this.sendMessage({
      phoneNumberId: params.phoneNumberId,
      accessToken: params.accessToken,
      recipientPhone: params.to,
      text: params.text,
    });
  }
}

/**
 * WhatsApp Group Instance Adapter
 * Supports Evolution API, Z-API, Zapito and Generic Webhook instances for affiliate groups & channels.
 */
export class WhatsAppGroupInstanceAdapter {
  /**
   * Validates instance connectivity.
   */
  static async validateConnection(params: {
    instanceUrl: string;
    apiKey?: string;
    instanceName?: string;
  }): Promise<{ valid: boolean; instanceName?: string; errorMessage?: string }> {
    try {
      let cleanUrl = params.instanceUrl.trim().replace(/\/+$/, "");
      const headers: Record<string, string> = {};
      if (params.apiKey) {
        headers["apikey"] = params.apiKey;
        headers["Client-Token"] = params.apiKey;
        headers["Authorization"] = `Bearer ${params.apiKey}`;
      }

      // Check instance health / status endpoint
      const testUrl = params.instanceName
        ? `${cleanUrl}/instance/connectionState/${params.instanceName}`
        : `${cleanUrl}/status`;

      const res = await ExternalRequestClient.request(testUrl, {
        method: "GET",
        headers,
        timeoutMs: 8000,
      });

      if (res.ok) {
        return {
          valid: true,
          instanceName: params.instanceName || "Instância WhatsApp Ativa",
        };
      }

      // If status endpoint returns 404 or method not allowed, try base URL ping
      const pingRes = await ExternalRequestClient.request(cleanUrl, {
        method: "GET",
        headers,
        timeoutMs: 5000,
      });

      if (pingRes.ok || pingRes.status === 200 || pingRes.status === 401 || pingRes.status === 403) {
        return {
          valid: true,
          instanceName: params.instanceName || "Instância Conectada",
        };
      }

      return {
        valid: false,
        errorMessage: `Instância inacessível (HTTP ${res.status || pingRes.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar na instância do WhatsApp";
      return { valid: false, errorMessage: msg };
    }
  }

  /**
   * Sends a formatted offer message (with optional product image) to a WhatsApp Group or Number.
   */
  static async sendMessage(params: {
    instanceUrl: string;
    apiKey?: string;
    instanceName?: string;
    destination: string; // Group JID e.g. "1203630283749@g.us" or Phone "5511999998888"
    text: string;
    imageUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    try {
      const cleanUrl = params.instanceUrl.trim().replace(/\/+$/, "");
      const cleanDest = params.destination.trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (params.apiKey) {
        headers["apikey"] = params.apiKey;
        headers["Client-Token"] = params.apiKey;
        headers["Authorization"] = `Bearer ${params.apiKey}`;
      }

      let targetEndpoint = "";
      let payload: any = {};

      // 1. Evolution API pattern (if instanceName is provided or URL matches evolution pattern)
      if (params.instanceName || cleanUrl.includes("evolution")) {
        const inst = params.instanceName || "default";
        if (params.imageUrl) {
          targetEndpoint = `${cleanUrl}/message/sendMedia/${inst}`;
          payload = {
            number: cleanDest,
            media: params.imageUrl,
            mediatype: "image",
            caption: params.text,
          };
        } else {
          targetEndpoint = `${cleanUrl}/message/sendText/${inst}`;
          payload = {
            number: cleanDest,
            text: params.text,
          };
        }
      }
      // 2. Z-API / Zapito pattern
      else if (cleanUrl.includes("z-api") || cleanUrl.includes("zapito")) {
        if (params.imageUrl) {
          targetEndpoint = `${cleanUrl}/send-image`;
          payload = {
            phone: cleanDest,
            image: params.imageUrl,
            caption: params.text,
          };
        } else {
          targetEndpoint = `${cleanUrl}/send-text`;
          payload = {
            phone: cleanDest,
            message: params.text,
          };
        }
      }
      // 3. Universal Webhook / Generic Instance
      else {
        targetEndpoint = cleanUrl;
        payload = {
          destination: cleanDest,
          number: cleanDest,
          phone: cleanDest,
          text: params.text,
          message: params.text,
          imageUrl: params.imageUrl,
          image: params.imageUrl,
          timestamp: new Date().toISOString(),
        };
      }

      const res = await ExternalRequestClient.request(targetEndpoint, {
        method: "POST",
        headers,
        body: payload,
        timeoutMs: 12000,
      });

      if (res.ok) {
        const msgId =
          res.data?.key?.id ||
          res.data?.messageId ||
          res.data?.id ||
          `wa-${Date.now()}`;
        return { success: true, messageId: msgId };
      }

      const errText = res.data?.message || res.data?.error || `Erro HTTP ${res.status}`;
      return { success: false, errorMessage: `Falha no envio WhatsApp: ${errText}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no envio via instância WhatsApp";
      return { success: false, errorMessage: msg };
    }
  }
}

export interface WhatsAppValidationResult {
  valid: boolean;
  instanceName?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  errorMessage?: string;
}

/**
 * Universal WhatsApp Channel Adapter (Auto-detects Group Instance vs. Meta Cloud API)
 */
export class WhatsAppChannelAdapter {
  static async validateConnection(params: {
    instanceUrl?: string;
    apiKey?: string;
    instanceName?: string;
    phoneNumberId?: string;
    accessToken?: string;
  }): Promise<WhatsAppValidationResult> {
    if (params.instanceUrl) {
      return WhatsAppGroupInstanceAdapter.validateConnection({
        instanceUrl: params.instanceUrl,
        apiKey: params.apiKey,
        instanceName: params.instanceName,
      });
    }

    if (params.phoneNumberId && params.accessToken) {
      return WhatsAppCloudAdapter.validateConnection({
        phoneNumberId: params.phoneNumberId,
        accessToken: params.accessToken,
      });
    }

    return {
      valid: false,
      errorMessage: "Informe a URL da Instância/API ou Phone Number ID e Access Token.",
    };
  }

  static async sendMessage(params: {
    instanceUrl?: string;
    apiKey?: string;
    instanceName?: string;
    phoneNumberId?: string;
    accessToken?: string;
    destination: string;
    text: string;
    imageUrl?: string;
  }) {
    if (params.instanceUrl) {
      return WhatsAppGroupInstanceAdapter.sendMessage({
        instanceUrl: params.instanceUrl,
        apiKey: params.apiKey,
        instanceName: params.instanceName,
        destination: params.destination,
        text: params.text,
        imageUrl: params.imageUrl,
      });
    }

    if (params.phoneNumberId && params.accessToken) {
      return WhatsAppCloudAdapter.sendMessage({
        phoneNumberId: params.phoneNumberId,
        accessToken: params.accessToken,
        recipientPhone: params.destination,
        text: params.text,
        imageUrl: params.imageUrl,
      });
    }

    return {
      success: false,
      errorMessage: "Credenciais de WhatsApp não configuradas para envio.",
    };
  }
}
