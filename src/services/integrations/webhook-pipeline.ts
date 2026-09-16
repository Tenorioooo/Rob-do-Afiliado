import { prisma } from "@/lib/db/prisma";
import { IntegrationIdempotencyService } from "./idempotency-service";
import { WhatsAppCloudAdapter } from "@/integrations/channels/whatsapp.adapter";
import { AnalyticsService } from "@/services/analytics/analytics-service";
import { CredentialService } from "./credential-service";
import { NormalizedIntegrationEvent } from "@/domain/integrations/normalized-events";

export class WebhookPipelineService {
  /**
   * Main entry point for ingesting and processing external webhooks securely.
   */
  static async ingestWebhook(params: {
    connectionId: string;
    provider: string;
    rawBody: string;
    parsedPayload: any;
    headers: Headers;
  }): Promise<{ success: boolean; eventId?: string; isDuplicate?: boolean; errorMessage?: string }> {
    const conn = await prisma.integrationConnection.findUnique({
      where: { id: params.connectionId },
    });

    if (!conn) {
      return { success: false, errorMessage: "Conexão de integração não encontrada." };
    }

    let credentials: Record<string, any> = {};
    if (conn.encryptedCredentials) {
      try {
        credentials = CredentialService.decrypt(conn.encryptedCredentials);
      } catch {}
    }

    // 1. Signature Validation
    const signatureValid = this.verifySignature({
      provider: conn.provider,
      rawBody: params.rawBody,
      headers: params.headers,
      credentials,
    });

    if (!signatureValid) {
      await prisma.integrationAuditLog.create({
        data: {
          userId: conn.userId,
          connectionId: conn.id,
          provider: conn.provider,
          action: "WEBHOOK_FAILED",
          details: JSON.stringify({ error: "Assinatura de webhook inválida" }),
        },
      });
      return { success: false, errorMessage: "Assinatura do webhook inválida ou não autorizada." };
    }

    // 2. Extract External Event ID
    const externalEventId = this.extractExternalEventId(conn.provider, params.parsedPayload);

    // 3. Idempotency Check & Event Creation
    const { event, isDuplicate } = await IntegrationIdempotencyService.recordEvent({
      userId: conn.userId,
      connectionId: conn.id,
      provider: conn.provider,
      externalEventId,
      eventType: this.detectEventType(conn.provider, params.parsedPayload),
      payload: params.parsedPayload,
    });

    if (isDuplicate) {
      return { success: true, eventId: event.id, isDuplicate: true };
    }

    // Update last webhook timestamp on connection
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { lastWebhookAt: new Date() },
    });

    // 4. Normalization & Asynchronous Routing
    try {
      const normalized = this.normalizePayload(conn.provider, conn.userId, conn.id, externalEventId, params.parsedPayload);

      // Route to domain handlers
      await this.routeEvent(conn.userId, normalized);

      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          normalizedPayload: JSON.stringify(normalized),
        },
      });

      await prisma.integrationAuditLog.create({
        data: {
          userId: conn.userId,
          connectionId: conn.id,
          provider: conn.provider,
          action: "WEBHOOK_PROCESSED",
          details: JSON.stringify({ eventId: event.id, type: normalized.eventType }),
        },
      });

      return { success: true, eventId: event.id, isDuplicate: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no processamento do evento";
      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", errorMessage: msg },
      });
      return { success: false, eventId: event.id, errorMessage: msg };
    }
  }

  /**
   * Verifies provider signature headers.
   */
  private static verifySignature(params: {
    provider: string;
    rawBody: string;
    headers: Headers;
    credentials: Record<string, any>;
  }): boolean {
    if (params.provider === "TELEGRAM") {
      const secretToken = params.headers.get("x-telegram-bot-api-secret-token");
      if (params.credentials.webhookSecret && secretToken !== params.credentials.webhookSecret) {
        return false;
      }
      return true;
    }

    if (params.provider === "WHATSAPP") {
      const sigHeader = params.headers.get("x-hub-signature-256");
      if (params.credentials.appSecret) {
        return WhatsAppCloudAdapter.validateWebhookSignature(params.rawBody, sigHeader, params.credentials.appSecret);
      }
      return true;
    }

    return true;
  }

  /**
   * Extracts external event ID from payload.
   */
  private static extractExternalEventId(provider: string, payload: any): string {
    if (provider === "TELEGRAM") {
      return String(payload?.update_id || `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    }
    if (provider === "WHATSAPP") {
      const messageId = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id;
      return messageId || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    if (provider === "MERCADO_LIVRE") {
      return String(payload?._id || payload?.id || `ml_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    }
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  /**
   * Detects event type from payload.
   */
  private static detectEventType(provider: string, payload: any): string {
    if (provider === "TELEGRAM") {
      if (payload?.message) return "MESSAGE_RECEIVED";
      if (payload?.channel_post) return "CHANNEL_POST";
      return "TELEGRAM_UPDATE";
    }
    if (provider === "WHATSAPP") {
      if (payload?.entry?.[0]?.changes?.[0]?.value?.messages) return "MESSAGE_RECEIVED";
      if (payload?.entry?.[0]?.changes?.[0]?.value?.statuses) return "MESSAGE_STATUS_UPDATE";
      return "WHATSAPP_EVENT";
    }
    if (provider === "MERCADO_LIVRE") {
      return payload?.topic ? `ML_${payload.topic.toUpperCase()}` : "ML_NOTIFICATION";
    }
    return "GENERIC_EVENT";
  }

  /**
   * Normalizes provider payload into standard format.
   */
  private static normalizePayload(
    provider: string,
    userId: string,
    connectionId: string,
    externalEventId: string,
    payload: any
  ): NormalizedIntegrationEvent {
    let text: string | undefined;
    let chatId: string | undefined;

    if (provider === "TELEGRAM") {
      const msg = payload?.message || payload?.channel_post;
      text = msg?.text;
      chatId = String(msg?.chat?.id || "");
    } else if (provider === "WHATSAPP") {
      const msg = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      text = msg?.text?.body;
      chatId = msg?.from;
    }

    return {
      provider,
      eventType: "MESSAGE_RECEIVED",
      externalEventId,
      connectionId,
      userId,
      timestamp: new Date(),
      rawPayload: payload,
      data: {
        text,
        chatId,
      },
    };
  }

  /**
   * Routes normalized events to domain consumers (Analytics, Attribution, Autopilot).
   */
  private static async routeEvent(userId: string, event: NormalizedIntegrationEvent) {
    if (event.data.externalOrderId && event.data.orderValue && event.data.commissionValue) {
      await AnalyticsService.recordConversion({
        userId,
        platform: event.provider,
        externalOrderId: event.data.externalOrderId,
        orderValue: event.data.orderValue,
        commissionValue: event.data.commissionValue,
        status: event.data.conversionStatus || "APPROVED",
        source: "real",
        occurredAt: event.timestamp,
      });
    }
  }

  /**
   * Replays an event safely.
   */
  static async replayEvent(userId: string, eventId: string) {
    const event = await prisma.integrationEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) throw new Error("Evento não encontrado.");

    await prisma.integrationAuditLog.create({
      data: {
        userId,
        connectionId: event.connectionId,
        provider: event.provider,
        action: "REPLAY_REQUESTED",
        details: JSON.stringify({ eventId }),
      },
    });

    return { success: true, eventId };
  }

  /**
   * Wrapper for convenient webhook ingestion.
   */
  static async ingest(params: {
    connectionId: string;
    provider: string;
    rawBody: string;
    headers?: any;
  }): Promise<{ success: boolean; eventId?: string; isDuplicate?: boolean; status?: string; errorMessage?: string }> {
    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(params.rawBody);
    } catch {
      parsedPayload = params.rawBody;
    }

    const headersObj = params.headers instanceof Headers
      ? params.headers
      : new Headers(params.headers || {});

    const res = await this.ingestWebhook({
      connectionId: params.connectionId,
      provider: params.provider,
      rawBody: params.rawBody,
      parsedPayload,
      headers: headersObj,
    });

    return {
      ...res,
      status: res.isDuplicate ? "IGNORED" : res.success ? "PROCESSED" : "FAILED",
    };
  }
}

export const WebhookPipeline = WebhookPipelineService;
