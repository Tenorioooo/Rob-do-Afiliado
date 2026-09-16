import { prisma } from "@/lib/db/prisma";
import { ChannelDispatcher, MAX_RETRIES } from "./channel-dispatcher";

export class PublicationWorker {
  /**
   * Processes all pending and scheduled publications ready for dispatch.
   */
  static async processPendingPublications(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    results: any[];
  }> {
    const now = new Date();

    // 1. Fetch pending publications (QUEUED, RETRYING, or SCHEDULED ready)
    const pendingPublications = await prisma.publication.findMany({
      where: {
        OR: [
          { status: "QUEUED" },
          { status: "RETRYING", retryCount: { lt: MAX_RETRIES } },
          { status: "SCHEDULED", scheduledAt: { lte: now } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "asc" },
    });

    let succeeded = 0;
    let failed = 0;
    const results: any[] = [];

    for (const pub of pendingPublications) {
      try {
        const { publication, result } = await ChannelDispatcher.dispatch({
          userId: pub.userId,
          offerId: pub.offerId,
          channelId: pub.channelId,
          queueItemId: pub.queueItemId || undefined,
          idempotencyKey: pub.idempotencyKey,
          forceResend: pub.status === "RETRYING",
        });

        if (result.success) succeeded++;
        else failed++;

        results.push({
          publicationId: publication.id,
          status: publication.status,
          success: result.success,
          error: result.error,
        });
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : "Erro no worker de publicação.";
        results.push({
          publicationId: pub.id,
          status: "FAILED",
          success: false,
          error: msg,
        });
      }
    }

    return {
      processed: pendingPublications.length,
      succeeded,
      failed,
      results,
    };
  }
}
