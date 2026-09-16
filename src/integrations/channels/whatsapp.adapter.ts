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

export const WhatsAppChannelAdapter = WhatsAppCloudAdapter;
