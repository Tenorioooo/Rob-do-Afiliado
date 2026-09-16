import { prisma } from "@/lib/db/prisma";
import { AttributionHierarchy } from "./analytics-types";

export class AnalyticsAttributionService {
  /**
   * Deterministically resolves attribution for an affiliate link, offer, publication or channel.
   */
  static async resolveAttribution(input: {
    affiliateLinkId?: string | null;
    offerId?: string | null;
    publicationId?: string | null;
    channelId?: string | null;
    productId?: string | null;
    platform?: string | null;
  }): Promise<AttributionHierarchy> {
    let affiliateLinkId = input.affiliateLinkId || null;
    let offerId = input.offerId || null;
    let publicationId = input.publicationId || null;
    let channelId = input.channelId || null;
    let productId = input.productId || null;
    let opportunityId: string | null = null;
    let platform = input.platform || null;
    const attributionPath: string[] = [];

    // 1. If publicationId is provided, resolve offer and channel
    if (publicationId) {
      attributionPath.push(`publication:${publicationId}`);
      const pub = await prisma.publication.findUnique({
        where: { id: publicationId },
        include: { offer: true, channel: true },
      });
      if (pub) {
        if (!offerId && pub.offerId) offerId = pub.offerId;
        if (!channelId && pub.channelId) channelId = pub.channelId;
        if (!platform && pub.channel?.type) platform = pub.channel.type;
        if (pub.offer) {
          if (!productId && pub.offer.productId) productId = pub.offer.productId;
          if (!opportunityId && pub.offer.opportunityId) opportunityId = pub.offer.opportunityId;
          if (!affiliateLinkId && pub.offer.affiliateLinkId) affiliateLinkId = pub.offer.affiliateLinkId;
        }
      }
    }

    // 2. If offerId is provided, resolve link, product, opportunity, channel
    if (offerId) {
      attributionPath.push(`offer:${offerId}`);
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { affiliateLink: true, product: true, channel: true },
      });
      if (offer) {
        if (!productId && offer.productId) productId = offer.productId;
        if (!opportunityId && offer.opportunityId) opportunityId = offer.opportunityId;
        if (!affiliateLinkId && offer.affiliateLinkId) affiliateLinkId = offer.affiliateLinkId;
        if (!channelId && offer.channelId) channelId = offer.channelId;
        if (!platform && offer.product?.platform) platform = offer.product.platform;
      }
    }

    // 3. If affiliateLinkId is provided, resolve product, opportunity, platform
    if (affiliateLinkId) {
      attributionPath.push(`link:${affiliateLinkId}`);
      const link = await prisma.affiliateLink.findUnique({
        where: { id: affiliateLinkId },
        include: { product: true, opportunity: true },
      });
      if (link) {
        if (!productId && link.productId) productId = link.productId;
        if (!opportunityId && link.opportunityId) opportunityId = link.opportunityId;
        if (!platform && link.platform) platform = link.platform;
      }
    }

    // 4. If productId is provided, ensure platform is known
    if (productId && !platform) {
      attributionPath.push(`product:${productId}`);
      const prod = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (prod) {
        platform = prod.platform;
      }
    }

    if (channelId && !attributionPath.some((p) => p.startsWith("channel:"))) {
      attributionPath.push(`channel:${channelId}`);
    }

    const completenessLevel: "FULL" | "PARTIAL" | "MINIMAL" =
      affiliateLinkId && offerId && publicationId && channelId && productId
        ? "FULL"
        : affiliateLinkId || offerId || publicationId
        ? "PARTIAL"
        : "MINIMAL";

    return {
      affiliateLinkId,
      offerId,
      publicationId,
      channelId,
      opportunityId,
      productId,
      platform,
      resolvedAt: new Date(),
      completenessLevel,
      attributionPath,
    };
  }
}
