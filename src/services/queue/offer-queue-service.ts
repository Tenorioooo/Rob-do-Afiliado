import { prisma } from "@/lib/db/prisma";
import { OfferQueuePriority } from "@/domain/offers/types";

export class OfferQueueService {
  /**
   * Adds an offer to the persistent dispatch queue with priority and schedule.
   */
  static async enqueueOffer(
    userId: string,
    offerId: string,
    options: {
      priority?: OfferQueuePriority;
      channelId?: string;
      scheduledAt?: Date | string;
    } = {}
  ) {
    // 1. Verify offer ownership
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, userId },
      include: { product: true },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada.");
    }

    if (offer.status === "CANCELLED" || offer.status === "FAILED") {
      throw new Error(`Não é possível enfileirar uma oferta com status ${offer.status}.`);
    }

    // 2. Check for existing active queue item
    const existing = await prisma.offerQueueItem.findFirst({
      where: {
        offerId,
        userId,
        status: { in: ["QUEUED", "PROCESSING", "SCHEDULED"] },
      },
    });

    if (existing) {
      // Update priority and schedule if requested
      const updated = await prisma.offerQueueItem.update({
        where: { id: existing.id },
        data: {
          priority: options.priority || existing.priority,
          scheduledAt: options.scheduledAt ? new Date(options.scheduledAt) : existing.scheduledAt,
          channelId: options.channelId || existing.channelId,
        },
        include: { offer: { include: { product: true, affiliateLink: true } } },
      });
      return updated;
    }

    // 3. Create new queue item
    const scheduledDate = options.scheduledAt ? new Date(options.scheduledAt) : null;
    const initialStatus = scheduledDate && scheduledDate > new Date() ? "SCHEDULED" : "QUEUED";

    const queueItem = await prisma.offerQueueItem.create({
      data: {
        userId,
        offerId,
        channelId: options.channelId || null,
        priority: options.priority || "NORMAL",
        status: initialStatus,
        scheduledAt: scheduledDate,
      },
      include: {
        offer: {
          include: {
            product: true,
            affiliateLink: true,
          },
        },
      },
    });

    // Also update offer status to SCHEDULED if applicable
    if (initialStatus === "SCHEDULED") {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: "SCHEDULED", scheduledFor: scheduledDate },
      });
    }

    // 4. Log Robot Event
    try {
      await prisma.robotEvent.create({
        data: {
          userId,
          eventType: "OFFER_ADDED_TO_QUEUE",
          title: `Oferta Adicionada à Fila (${queueItem.priority})`,
          description: `Oferta "${offer.title.slice(0, 45)}..." adicionada à fila persistente com prioridade ${queueItem.priority}.`,
          metadata: JSON.stringify({
            queueItemId: queueItem.id,
            offerId: queueItem.offerId,
            priority: queueItem.priority,
            status: queueItem.status,
          }),
          status: "SUCCESS",
        },
      });
    } catch {}

    return queueItem;
  }

  /**
   * List queue items for user with sorting by priority and creation date.
   */
  static async getQueue(
    userId: string,
    options: {
      status?: string;
      priority?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }
    if (options.priority && options.priority !== "ALL") {
      where.priority = options.priority;
    }

    const [total, items] = await Promise.all([
      prisma.offerQueueItem.count({ where }),
      prisma.offerQueueItem.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          offer: {
            include: {
              product: true,
              affiliateLink: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update queue item priority or status.
   */
  static async updateQueueItem(
    queueItemId: string,
    userId: string,
    data: {
      priority?: OfferQueuePriority;
      status?: string;
      scheduledAt?: Date | string | null;
    }
  ) {
    const item = await prisma.offerQueueItem.findFirst({
      where: { id: queueItemId, userId },
    });

    if (!item) {
      throw new Error("Item de fila não encontrado.");
    }

    const updated = await prisma.offerQueueItem.update({
      where: { id: queueItemId },
      data: {
        priority: data.priority || item.priority,
        status: data.status || item.status,
        scheduledAt: data.scheduledAt !== undefined ? (data.scheduledAt ? new Date(data.scheduledAt) : null) : item.scheduledAt,
      },
      include: {
        offer: {
          include: {
            product: true,
            affiliateLink: true,
          },
        },
      },
    });

    return updated;
  }
}
