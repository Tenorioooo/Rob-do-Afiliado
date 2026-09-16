import { prisma } from "@/lib/db/prisma";
import { ChannelDispatcher, DispatchExecutionRequest } from "@/domain/dispatcher/channel-dispatcher";
import { PublicationWorker } from "@/domain/dispatcher/publication-worker";

export interface SchedulePublicationParams {
  userId: string;
  offerId: string;
  channelId: string;
  scheduledFor: Date;
}

export interface ListPublicationsFilter {
  userId: string;
  status?: string;
  channelId?: string;
  offerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PublicationService {
  /**
   * Dispatch an offer to a channel immediately
   */
  static async sendNow(params: { userId: string; offerId: string; channelId: string; overrideText?: string }) {
    const { publication, result } = await ChannelDispatcher.dispatch({
      userId: params.userId,
      offerId: params.offerId,
      channelId: params.channelId,
    });

    return { publication, result };
  }

  /**
   * Schedule an offer publication for a future time
   */
  static async schedule(params: SchedulePublicationParams) {
    // Validate offer ownership
    const offer = await prisma.offer.findUnique({
      where: { id: params.offerId },
    });

    if (!offer || offer.userId !== params.userId) {
      throw new Error("Oferta não encontrada ou acesso não autorizado.");
    }

    // Validate channel ownership
    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
    });

    if (!channel || channel.userId !== params.userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    if (!channel.active) {
      throw new Error(`Canal '${channel.name}' está inativo.`);
    }

    // Check future date
    if (new Date(params.scheduledFor).getTime() <= Date.now()) {
      throw new Error("A data de agendamento deve ser no futuro.");
    }

    // Generate unique idempotency key for this scheduled publication
    const timeBucket = new Date(params.scheduledFor).toISOString().slice(0, 16); // Minute precision
    const idempotencyKey = `pub_sched_${params.userId}_${params.offerId}_${params.channelId}_${timeBucket}`;

    // Create scheduled publication record
    const publication = await prisma.publication.create({
      data: {
        userId: params.userId,
        offerId: params.offerId,
        channelId: params.channelId,
        status: "SCHEDULED",
        scheduledAt: new Date(params.scheduledFor),
        idempotencyKey,
      },
      include: {
        channel: true,
        offer: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create event log
    await prisma.robotEvent.create({
      data: {
        userId: params.userId,
        eventType: "PUBLICATION_SCHEDULED",
        title: "Publicação Agendada",
        description: `Publicação agendada para ${new Date(params.scheduledFor).toLocaleString("pt-BR")} no canal ${channel.name}`,
        metadata: JSON.stringify({
          publicationId: publication.id,
          offerId: params.offerId,
          channelId: params.channelId,
          scheduledFor: params.scheduledFor,
        }),
      },
    });

    return publication;
  }

  /**
   * Retry a failed publication
   */
  static async retryPublication(publicationId: string, userId: string) {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication || publication.userId !== userId) {
      throw new Error("Publicação não encontrada ou acesso não autorizado.");
    }

    if (publication.status !== "FAILED" && publication.status !== "RETRYING") {
      throw new Error(`Publicações com status ${publication.status} não podem ser reenviadas.`);
    }

    const { publication: updatedPub, result } = await ChannelDispatcher.dispatch({
      userId,
      offerId: publication.offerId,
      channelId: publication.channelId,
      idempotencyKey: publication.idempotencyKey,
      forceResend: true,
    });

    return { publication: updatedPub, result };
  }

  /**
   * Cancel a scheduled or queued publication
   */
  static async cancelPublication(publicationId: string, userId: string) {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: { channel: true },
    });

    if (!publication || publication.userId !== userId) {
      throw new Error("Publicação não encontrada ou acesso não autorizado.");
    }

    if (publication.status !== "SCHEDULED" && publication.status !== "QUEUED") {
      throw new Error(`Não é possível cancelar uma publicação com status ${publication.status}.`);
    }

    const updated = await prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: "CANCELLED",
      },
    });

    await prisma.robotEvent.create({
      data: {
        userId,
        eventType: "PUBLICATION_CANCELLED",
        title: "Publicação Cancelada",
        description: `Publicação ${publication.id.slice(0, 8)} cancelada para o canal ${publication.channel.name}`,
        metadata: JSON.stringify({ publicationId }),
      },
    });

    return updated;
  }

  /**
   * List publications with filters and pagination
   */
  static async listPublications(filters: ListPublicationsFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: filters.userId,
    };

    if (filters.status && filters.status !== "ALL") {
      whereClause.status = filters.status;
    }

    if (filters.channelId && filters.channelId !== "ALL") {
      whereClause.channelId = filters.channelId;
    }

    if (filters.offerId) {
      whereClause.offerId = filters.offerId;
    }

    if (filters.search) {
      whereClause.OR = [
        { offer: { title: { contains: filters.search } } },
        { channel: { name: { contains: filters.search } } },
        { providerMessageId: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.publication.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              type: true,
              provider: true,
              destination: true,
              active: true,
            },
          },
          offer: {
            include: {
              product: true,
              affiliateLink: true,
            },
          },
        },
      }),
      prisma.publication.count({
        where: whereClause,
      }),
    ]);

    const formattedItems = items.map((pub) => ({
      ...pub,
      offer: {
        id: pub.offer.id,
        productTitle: pub.offer.product.title,
        productPrice: pub.offer.product.currentPrice,
        productImage: pub.offer.product.imageUrl,
        marketplace: pub.offer.product.platform,
        affiliateUrl: pub.offer.affiliateLink?.affiliateUrl || pub.offer.product.url,
        copyText: `${pub.offer.title}\n\n${pub.offer.body}\n\n${pub.offer.cta}`,
      },
    }));

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single publication details
   */
  static async getPublicationById(publicationId: string, userId: string) {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        channel: true,
        offer: {
          include: {
            product: true,
            affiliateLink: true,
          },
        },
      },
    });

    if (!publication || publication.userId !== userId) {
      return null;
    }

    return {
      ...publication,
      offer: {
        id: publication.offer.id,
        productTitle: publication.offer.product.title,
        productPrice: publication.offer.product.currentPrice,
        productImage: publication.offer.product.imageUrl,
        marketplace: publication.offer.product.platform,
        affiliateUrl: publication.offer.affiliateLink?.affiliateUrl || publication.offer.product.url,
        copyText: `${publication.offer.title}\n\n${publication.offer.body}\n\n${publication.offer.cta}`,
      },
    };
  }

  /**
   * Trigger worker cycle
   */
  static async processWorkerCycle() {
    return await PublicationWorker.processPendingPublications();
  }
}
