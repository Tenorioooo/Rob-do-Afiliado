import { prisma } from "@/lib/db/prisma";
import { OfferGenerator } from "@/domain/offers/offer-generator";
import { OfferValidator } from "@/domain/offers/offer-validator";
import {
  OfferStyle,
  OfferStructuredInput,
  GeneratedOfferVariant,
} from "@/domain/offers/types";

export interface GenerateOfferRequest {
  userId: string;
  productId: string;
  opportunityId?: string;
  affiliateLinkId?: string;
  preferredStyle?: OfferStyle;
}

export class OfferService {
  /**
   * Generates AI offer copies for a product / opportunity and saves the preferred variant as an Offer record.
   */
  static async generateOffersForProduct(req: GenerateOfferRequest) {
    // 1. Fetch product & user opportunity
    const product = await prisma.product.findUnique({
      where: { id: req.productId },
      include: { snapshots: { take: 5, orderBy: { observedAt: "desc" } } },
    });

    if (!product) {
      throw new Error(`Produto ${req.productId} não encontrado.`);
    }

    // 2. Resolve or generate affiliate link
    let affiliateLinkId = req.affiliateLinkId;
    let affiliateUrl = product.url;

    if (affiliateLinkId) {
      const link = await prisma.affiliateLink.findFirst({
        where: { id: affiliateLinkId, userId: req.userId },
      });
      if (link) {
        affiliateUrl = link.affiliateUrl;
      }
    } else {
      const existingLink = await prisma.affiliateLink.findFirst({
        where: { userId: req.userId, productId: req.productId, active: true },
      });
      if (existingLink) {
        affiliateLinkId = existingLink.id;
        affiliateUrl = existingLink.affiliateUrl;
      }
    }

    // 3. Resolve opportunity reasons
    let opportunityId = req.opportunityId;
    let reasons: string[] = [];
    if (opportunityId) {
      const opp = await prisma.opportunity.findFirst({
        where: { id: opportunityId, userId: req.userId },
      });
      if (opp && opp.reasons) {
        try {
          reasons = JSON.parse(opp.reasons);
        } catch {}
      }
    }

    const structuredInput: OfferStructuredInput = {
      productId: product.id,
      opportunityId,
      affiliateLinkId,
      title: product.title,
      description: product.description || undefined,
      category: product.category,
      brand: product.brand || undefined,
      platform: product.platform,
      originalPrice: product.originalPrice,
      currentPrice: product.currentPrice,
      discountPercent: product.discountPercent,
      commissionAmount: product.commissionAmount,
      commissionRate: product.commissionRate,
      rating: product.rating || undefined,
      reviewCount: product.reviewCount || undefined,
      salesCount: product.salesCount,
      opportunityScore: product.opportunityScore,
      tags: reasons,
      reasons,
      affiliateUrl,
      inStock: product.inStock,
    };

    // 4. Generate variants using AI Engine
    const variants = await OfferGenerator.generateAllStyles(structuredInput);

    const preferredStyle: OfferStyle = req.preferredStyle || "DESCONTO";
    const selectedVariant =
      variants.find((v) => v.style === preferredStyle) || variants[0];

    // 5. Persist initial Offer record in DB as DRAFT or READY
    const status = selectedVariant.validationStatus === "VALID" ? "READY" : "DRAFT";

    const savedOffer = await prisma.offer.create({
      data: {
        userId: req.userId,
        productId: product.id,
        opportunityId: opportunityId || null,
        affiliateLinkId: affiliateLinkId || null,
        title: selectedVariant.title,
        body: selectedVariant.body,
        cta: selectedVariant.cta,
        headline: selectedVariant.title,
        generatedCopy: selectedVariant.body,
        callToAction: selectedVariant.cta,
        style: selectedVariant.style,
        status,
        aiSource: selectedVariant.aiSource,
        validationStatus: selectedVariant.validationStatus,
        validationMessage: selectedVariant.validationMessage || null,
        reasons: JSON.stringify(selectedVariant.claimsVerified),
        generatedAt: new Date(),
      },
      include: {
        product: true,
        affiliateLink: true,
        opportunity: true,
      },
    });

    // 6. Log Robot Event
    try {
      await prisma.robotEvent.create({
        data: {
          userId: req.userId,
          eventType: "OFFER_GENERATED",
          title: `Oferta Gerada com IA (${selectedVariant.style})`,
          description: `Oferta gerada para ${product.title.slice(0, 50)}... com status ${status}.`,
          metadata: JSON.stringify({
            offerId: savedOffer.id,
            style: selectedVariant.style,
            status,
            validationStatus: selectedVariant.validationStatus,
          }),
          status: "SUCCESS",
        },
      });
    } catch {}

    return {
      offer: savedOffer,
      variants,
      selectedVariant,
    };
  }

  /**
   * Update an offer's content or style.
   */
  static async updateOffer(
    offerId: string,
    userId: string,
    data: {
      title?: string;
      body?: string;
      cta?: string;
      style?: OfferStyle;
      status?: "DRAFT" | "READY" | "APPROVED" | "CANCELLED";
    }
  ) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, userId },
      include: { product: true },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada ou acesso não autorizado.");
    }

    const newTitle = data.title !== undefined ? data.title : offer.title;
    const newBody = data.body !== undefined ? data.body : offer.body;
    const newCta = data.cta !== undefined ? data.cta : offer.cta;

    // Run validator on updated text
    const structuredInput: OfferStructuredInput = {
      productId: offer.product.id,
      title: offer.product.title,
      category: offer.product.category,
      platform: offer.product.platform,
      originalPrice: offer.product.originalPrice,
      currentPrice: offer.product.currentPrice,
      discountPercent: offer.product.discountPercent,
      commissionAmount: offer.product.commissionAmount,
      commissionRate: offer.product.commissionRate,
      salesCount: offer.product.salesCount,
      opportunityScore: offer.product.opportunityScore,
      affiliateUrl: offer.product.url,
      inStock: offer.product.inStock,
    };

    const validation = OfferValidator.validate(
      newTitle,
      newBody,
      newCta,
      structuredInput
    );

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        title: newTitle,
        body: newBody,
        cta: newCta,
        headline: newTitle,
        generatedCopy: newBody,
        callToAction: newCta,
        style: data.style || offer.style,
        status: data.status || offer.status,
        validationStatus: validation.status,
        validationMessage: validation.summaryMessage,
      },
      include: { product: true, affiliateLink: true },
    });

    return { offer: updated, validation };
  }

  /**
   * Approve an offer.
   */
  static async approveOffer(offerId: string, userId: string) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, userId },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada.");
    }

    if (offer.status === "CANCELLED") {
      throw new Error("Não é possível aprovar uma oferta cancelada.");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
      include: { product: true, affiliateLink: true },
    });

    // Log Robot Event
    try {
      await prisma.robotEvent.create({
        data: {
          userId,
          eventType: "OFFER_APPROVED",
          title: "Oferta Aprovada",
          description: `Oferta "${offer.title.slice(0, 45)}..." aprovada com sucesso.`,
          status: "SUCCESS",
        },
      });
    } catch {}

    return updated;
  }

  /**
   * Cancel an offer.
   */
  static async cancelOffer(offerId: string, userId: string) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, userId },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada.");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "CANCELLED" },
      include: { product: true },
    });

    return updated;
  }

  /**
   * Get user offers with filters and pagination.
   */
  static async getUserOffers(
    userId: string,
    options: {
      status?: string;
      style?: string;
      platform?: string;
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }
    if (options.style && options.style !== "ALL") {
      where.style = options.style;
    }
    if (options.platform && options.platform !== "ALL") {
      where.product = { platform: options.platform };
    }
    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { body: { contains: options.search } },
        { product: { title: { contains: options.search } } },
      ];
    }

    const [total, offers] = await Promise.all([
      prisma.offer.count({ where }),
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: true,
          affiliateLink: true,
          opportunity: true,
          queueItems: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      offers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
