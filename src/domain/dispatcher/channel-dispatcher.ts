import { prisma } from "@/lib/db/prisma";
import { ChannelFactory } from "../channels/adapters/channel-factory";
import { MessageFormatter } from "./message-formatter";
import { SecretStorage } from "@/lib/security/secret-storage";
import { DispatchResult } from "../channels/types";

export const MAX_RETRIES = 3;

export interface DispatchExecutionRequest {
  userId: string;
  offerId: string;
  channelId: string;
  queueItemId?: string;
  idempotencyKey?: string;
  customScheduledAt?: Date | null;
  forceResend?: boolean;
}

export class ChannelDispatcher {
  /**
   * Generates a deterministic idempotency key.
   */
  static generateIdempotencyKey(userId: string, offerId: string, channelId: string, timestamp?: Date): string {
    const timeBucket = timestamp ? timestamp.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
    return `pub_${userId}_${offerId}_${channelId}_${timeBucket}`;
  }

  /**
   * Dispatches an offer to a specific channel with strict idempotency and retry handling.
   */
  static async dispatch(req: DispatchExecutionRequest): Promise<{ publication: any; result: DispatchResult }> {
    // 1. Fetch channel and offer with relations
    const channel = await prisma.channel.findFirst({
      where: { id: req.channelId, userId: req.userId },
    });

    if (!channel) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    if (!channel.active || channel.status === "DISABLED") {
      throw new Error(`Canal ${channel.name} está desativado.`);
    }

    const offer = await prisma.offer.findFirst({
      where: { id: req.offerId, userId: req.userId },
      include: {
        product: true,
        affiliateLink: true,
      },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada.");
    }

    // 2. Resolve affiliate link URL
    let affiliateUrl = offer.affiliateLink?.affiliateUrl || offer.product.url;

    // 3. Format message specifically for channel
    const formattedMessage = MessageFormatter.format(
      {
        title: offer.title,
        body: offer.body,
        cta: offer.cta,
        affiliateUrl,
      },
      channel.type
    );

    // 4. Idempotency Check
    const idempotencyKey = req.idempotencyKey || this.generateIdempotencyKey(req.userId, req.offerId, req.channelId);

    // Check if duplicate successful publication exists within last 24h if not forceResend
    if (!req.forceResend) {
      const existingSuccess = await prisma.publication.findFirst({
        where: {
          userId: req.userId,
          offerId: req.offerId,
          channelId: req.channelId,
          status: "PUBLISHED",
          publishedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingSuccess) {
        throw new Error(
          `Esta oferta já foi publicada com sucesso neste canal recentemente (${existingSuccess.id}). Use o reenvio forçado se necessário.`
        );
      }
    }

    // 5. Create or find initial Publication record in DB
    const existingPub = await prisma.publication.findUnique({
      where: { idempotencyKey },
    });

    let publication = existingPub;
    if (!publication) {
      publication = await prisma.publication.create({
        data: {
          userId: req.userId,
          offerId: req.offerId,
          channelId: req.channelId,
          queueItemId: req.queueItemId || null,
          status: "PROCESSING",
          provider: channel.provider,
          source: channel.provider === "mock" ? "mock" : "real",
          payload: JSON.stringify({
            title: offer.title,
            body: offer.body,
            cta: offer.cta,
            affiliateUrl,
            formattedMessage,
          }),
          idempotencyKey,
          startedAt: new Date(),
          retryCount: 0,
        },
      });
    } else {
      publication = await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: "PROCESSING",
          startedAt: new Date(),
        },
      });
    }

    // 5.5 Live Dispatch Guard Validation (Kill Switches, VERIFIED_REAL, Autopilot permission)
    if (channel.provider !== "mock") {
      const { DispatchGuardService } = await import("@/services/integrations/dispatch-guard");
      const guardCheck = await DispatchGuardService.canDispatchLive({
        userId: req.userId,
        channelId: channel.id,
        provider: channel.type,
      });

      if (!guardCheck.allowed) {
        publication = await prisma.publication.update({
          where: { id: publication.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            errorCode: guardCheck.errorCode || "DISPATCH_GUARD_BLOCKED",
            errorMessage: guardCheck.blockingReason || "Disparo real bloqueado pelo sistema de segurança.",
          },
        });

        // Log structured event
        console.warn("[REAL_DISPATCH_BLOCKED]", {
          provider: channel.type,
          channelId: channel.id,
          offerId: req.offerId,
          reason: guardCheck.blockingReason,
          errorCode: guardCheck.errorCode,
        });

        throw new Error(`Disparo real bloqueado: ${guardCheck.blockingReason}`);
      }
    }

    // 6. Execute dispatch via Adapter
    const adapter = ChannelFactory.getAdapter(channel.type, channel.provider);
    let rawConfig = SecretStorage.getRawConfig(channel.config);

    // Fallback: If channel.config is missing botToken, resolve from decrypted IntegrationConnection
    let destination = channel.identifier || channel.destination || "";
    if (channel.provider !== "mock") {
      const connection = await prisma.integrationConnection.findUnique({
        where: {
          userId_provider: {
            userId: req.userId,
            provider: channel.type.toUpperCase(),
          },
        },
      });

      if (connection) {
        const { ConnectionService } = await import("@/services/integrations/connection-service");
        const connCreds = await ConnectionService.getDecryptedCredentials(connection.id);
        rawConfig = { ...connCreds, ...rawConfig };

        if (!destination && (connCreds.chatId || connCreds.destination)) {
          destination = connCreds.chatId || connCreds.destination;
        }
      }
    }

    const dispatchPayload = {
      publicationId: publication.id,
      offerId: offer.id,
      title: offer.title,
      body: offer.body,
      cta: offer.cta,
      affiliateUrl,
      formattedMessage,
      destination,
      config: rawConfig,
    };

    console.info("[REAL_DISPATCH_STARTED]", {
      provider: channel.type,
      channelId: channel.id,
      offerId: offer.id,
      source: adapter.isMock ? "mock" : "real",
    });

    let dispatchResult: DispatchResult;
    try {
      dispatchResult = await adapter.sendMessage(dispatchPayload);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido no adapter.";
      dispatchResult = {
        success: false,
        source: adapter.isMock ? "mock" : "real",
        provider: adapter.provider,
        error: errorMsg,
        errorCode: "ADAPTER_EXCEPTION",
        timestamp: new Date(),
      };
    }

    // 7. Update Publication status in database
    if (dispatchResult.success) {
      publication = await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          providerMessageId: dispatchResult.providerMessageId || null,
          errorMessage: null,
          errorCode: null,
        },
        include: { offer: true, channel: true },
      });

      // Update Channel lastMessageAt
      await prisma.channel.update({
        where: { id: channel.id },
        data: { lastMessageAt: new Date(), status: "CONNECTED" },
      });

      // Update Offer status to PUBLISHED if was ready/scheduled
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      // Update QueueItem status if linked
      if (req.queueItemId) {
        await prisma.offerQueueItem.update({
          where: { id: req.queueItemId },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
      }

      // Track in Analytics
      try {
        const { AnalyticsService } = await import("@/services/analytics/analytics-service");
        await AnalyticsService.trackPublication({
          userId: req.userId,
          publicationId: publication.id,
          offerId: offer.id,
          channelId: channel.id,
          provider: channel.type,
          source: adapter.isMock ? "mock" : "real",
          telegramMessageId: dispatchResult.providerMessageId,
          affiliateLinkId: offer.affiliateLinkId,
          productId: offer.productId,
          platform: offer.product?.platform,
        });
      } catch (analyticsErr) {
        console.error("[ANALYTICS_TRACK_ERROR]", analyticsErr);
      }

      // Log structured event & Robot Event
      console.info("[REAL_DISPATCH_SENT]", {
        provider: channel.type,
        channelId: channel.id,
        offerId: offer.id,
        publicationId: publication.id,
        telegramMessageId: dispatchResult.providerMessageId,
        source: adapter.isMock ? "mock" : "real",
      });

      try {
        await prisma.robotEvent.create({
          data: {
            userId: req.userId,
            eventType: "PUBLICATION_PUBLISHED",
            title: `Oferta Publicada no ${channel.type}`,
            description: `Oferta "${offer.title.slice(0, 40)}..." enviada para ${channel.name} (${dispatchResult.provider}).`,
            metadata: JSON.stringify({
              publicationId: publication.id,
              channelId: channel.id,
              providerMessageId: dispatchResult.providerMessageId,
              source: adapter.isMock ? "mock" : "real",
            }),
            status: "SUCCESS",
          },
        });
      } catch {}
    } else {
      // Failed Dispatch - Check if error is permanent (non-retryable)
      const errLower = (dispatchResult.error || "").toLowerCase();
      const codeUpper = (dispatchResult.errorCode || "").toUpperCase();
      const isPermanentError =
        codeUpper.includes("401") ||
        codeUpper.includes("403") ||
        codeUpper.includes("404") ||
        codeUpper.includes("400") ||
        codeUpper.includes("UNAUTHORIZED") ||
        codeUpper.includes("FORBIDDEN") ||
        codeUpper.includes("NOT_FOUND") ||
        codeUpper.includes("BAD_REQUEST") ||
        codeUpper.includes("CHAT_NOT_FOUND") ||
        codeUpper.includes("BOT_BLOCKED") ||
        codeUpper.includes("INVALID_TOKEN") ||
        codeUpper.includes("INVALID_REQUEST") ||
        codeUpper.includes("DISPATCH_GUARD_BLOCKED") ||
        errLower.includes("not found") ||
        errLower.includes("bad request") ||
        errLower.includes("chat not found") ||
        errLower.includes("bot was blocked") ||
        errLower.includes("unauthorized") ||
        errLower.includes("invalid token");

      const nextRetryCount = publication.retryCount + 1;
      const canRetry = !isPermanentError && nextRetryCount < MAX_RETRIES;
      const finalStatus = canRetry ? "RETRYING" : "FAILED";

      publication = await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: finalStatus,
          failedAt: new Date(),
          retryCount: nextRetryCount,
          errorCode: dispatchResult.errorCode || "DISPATCH_FAILED",
          errorMessage: dispatchResult.error || "Falha no envio para o canal.",
        },
        include: { offer: true, channel: true },
      });

      console.error("[REAL_DISPATCH_FAILED]", {
        provider: channel.type,
        channelId: channel.id,
        offerId: req.offerId,
        publicationId: publication.id,
        error: dispatchResult.error,
        errorCode: dispatchResult.errorCode,
        canRetry,
        retryCount: nextRetryCount,
      });

      // Log Robot Event
      try {
        await prisma.robotEvent.create({
          data: {
            userId: req.userId,
            eventType: "PUBLICATION_FAILED",
            title: `Falha no Disparo (${channel.type})`,
            description: `Erro ao enviar para ${channel.name}: ${dispatchResult.error}`,
            metadata: JSON.stringify({
              publicationId: publication.id,
              retryCount: nextRetryCount,
              errorCode: dispatchResult.errorCode,
            }),
            status: "ERROR",
          },
        });
      } catch {}
    }

    return { publication, result: dispatchResult };
  }
}
