import { prisma } from "@/lib/db/prisma";
import {
  ClickEventInput,
  ConversionEventInput,
  EntityPerformanceSummary,
  ChannelPerformance,
  ProductPerformance,
  PlatformPerformance,
  OfferPerformance,
  EventSource,
} from "@/domain/analytics/analytics-types";
import { AnalyticsAttributionService } from "@/domain/analytics/attribution";
import { PerformanceScoreService } from "@/domain/analytics/performance-score";
import crypto from "crypto";

export class AnalyticsService {
  /**
   * Tracks an affiliate link click with attribution, rate limiting & central counter increment.
   */
  static async trackClick(input: ClickEventInput) {
    const link = await prisma.affiliateLink.findUnique({
      where: { id: input.affiliateLinkId },
    });

    if (!link) {
      throw new Error("Link de afiliado não encontrado.");
    }

    if (!link.active) {
      throw new Error("Link de afiliado está inativo.");
    }

    // IP Hash for rate-limiting & fraud prevention
    const ipHash = input.ipAddress
      ? crypto.createHash("sha256").update(input.ipAddress).digest("hex")
      : null;

    // Rate Limit: Check if same ip clicked the same link in the last 3 seconds
    if (ipHash) {
      const recentClick = await prisma.analyticsEvent.findFirst({
        where: {
          affiliateLinkId: link.id,
          ipHash,
          eventType: "CLICK",
          createdAt: { gte: new Date(Date.now() - 3000) },
        },
      });

      if (recentClick) {
        // Return existing event silently to prevent duplicate inflation
        return recentClick;
      }
    }

    // Resolve Attribution
    const attribution = await AnalyticsAttributionService.resolveAttribution({
      affiliateLinkId: link.id,
      offerId: input.offerId,
      publicationId: input.publicationId,
      channelId: input.channelId,
      platform: input.platform || link.platform,
    });

    // Create Click Event
    const event = await prisma.analyticsEvent.create({
      data: {
        userId: link.userId,
        eventType: "CLICK",
        affiliateLinkId: link.id,
        offerId: attribution.offerId,
        opportunityId: attribution.opportunityId,
        publicationId: attribution.publicationId,
        channelId: attribution.channelId,
        productId: attribution.productId,
        platform: attribution.platform,
        source: input.source || link.source || "mock",
        ipHash,
        userAgent: input.userAgent || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // Central increment of link clicks
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    return event;
  }

  /**
   * Records a conversion event safely with idempotency and commission creation.
   */
  static async recordConversion(input: ConversionEventInput) {
    // 1. Idempotency Check: Prevent duplicate order registration
    if (input.externalOrderId) {
      const existing = await prisma.conversion.findUnique({
        where: {
          userId_platform_externalOrderId: {
            userId: input.userId,
            platform: input.platform,
            externalOrderId: input.externalOrderId,
          },
        },
      });

      if (existing) {
        // Idempotent return
        return { conversion: existing, isDuplicate: true };
      }
    }

    // 2. Resolve Attribution
    const attribution = await AnalyticsAttributionService.resolveAttribution({
      affiliateLinkId: input.affiliateLinkId,
      offerId: input.offerId,
      publicationId: input.publicationId,
      channelId: input.channelId,
      platform: input.platform,
    });

    const status = input.status || "PENDING";
    const source: EventSource = input.source || "mock";
    const occurredAt = input.occurredAt || new Date();

    // 3. Create Conversion
    const conversion = await prisma.conversion.create({
      data: {
        userId: input.userId,
        affiliateLinkId: attribution.affiliateLinkId,
        offerId: attribution.offerId,
        opportunityId: attribution.opportunityId,
        publicationId: attribution.publicationId,
        channelId: attribution.channelId,
        platform: input.platform,
        externalOrderId: input.externalOrderId || null,
        orderValue: input.orderValue,
        commissionValue: input.commissionValue,
        currency: input.currency || "BRL",
        status,
        source,
        occurredAt,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // 4. Create Commission record
    const commissionStatus =
      status === "APPROVED"
        ? "CONFIRMED"
        : status === "CANCELLED" || status === "REFUNDED"
        ? "CANCELLED"
        : "ESTIMATED";

    await prisma.commission.create({
      data: {
        userId: input.userId,
        conversionId: conversion.id,
        amount: input.commissionValue,
        status: commissionStatus,
        platform: input.platform,
        source,
      },
    });

    // 5. Create Analytics Event for CONVERSION
    await prisma.analyticsEvent.create({
      data: {
        userId: input.userId,
        eventType: "CONVERSION",
        affiliateLinkId: attribution.affiliateLinkId,
        offerId: attribution.offerId,
        opportunityId: attribution.opportunityId,
        publicationId: attribution.publicationId,
        channelId: attribution.channelId,
        productId: attribution.productId,
        platform: input.platform,
        source,
        metadata: JSON.stringify({
          conversionId: conversion.id,
          orderValue: input.orderValue,
          commissionValue: input.commissionValue,
          status,
        }),
      },
    });

    // 6. Update AffiliateLink counters if linked
    if (attribution.affiliateLinkId && status !== "CANCELLED" && status !== "REFUNDED") {
      await prisma.affiliateLink.update({
        where: { id: attribution.affiliateLinkId },
        data: {
          conversions: { increment: 1 },
          estimatedEarnings: { increment: input.commissionValue },
        },
      });
    }

    return { conversion, isDuplicate: false };
  }

  /**
   * Retrieves overall overview metrics with temporal comparison (period vs previous period).
   */
  static async getOverview(userId: string, days: number = 30) {
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    // Current period
    const currentClicks = await prisma.analyticsEvent.count({
      where: { userId, eventType: "CLICK", createdAt: { gte: currentStart } },
    });

    const currentConversions = await prisma.conversion.findMany({
      where: { userId, occurredAt: { gte: currentStart } },
    });

    const currentPublications = await prisma.publication.count({
      where: { userId, status: "PUBLISHED", publishedAt: { gte: currentStart } },
    });

    const currentEvents = await prisma.analyticsEvent.findMany({
      where: { userId, createdAt: { gte: currentStart } },
      select: { source: true },
    });

    // Previous period
    const prevClicks = await prisma.analyticsEvent.count({
      where: { userId, eventType: "CLICK", createdAt: { gte: previousStart, lt: currentStart } },
    });

    const prevConversions = await prisma.conversion.findMany({
      where: { userId, occurredAt: { gte: previousStart, lt: currentStart } },
    });

    // Aggregate Current
    let revenue = 0;
    let estimatedCommission = 0;
    let confirmedCommission = 0;
    let cancelledCommission = 0;
    let validConversionsCount = 0;

    for (const c of currentConversions) {
      if (c.status === "APPROVED") {
        revenue += c.orderValue;
        confirmedCommission += c.commissionValue;
        validConversionsCount++;
      } else if (c.status === "PENDING") {
        revenue += c.orderValue;
        estimatedCommission += c.commissionValue;
        validConversionsCount++;
      } else if (c.status === "CANCELLED" || c.status === "REFUNDED") {
        cancelledCommission += c.commissionValue;
      }
    }

    // Aggregate Previous
    let prevRevenue = 0;
    let prevConfirmedCommission = 0;
    let prevEstimatedCommission = 0;
    let prevValidConversionsCount = 0;

    for (const c of prevConversions) {
      if (c.status === "APPROVED") {
        prevRevenue += c.orderValue;
        prevConfirmedCommission += c.commissionValue;
        prevValidConversionsCount++;
      } else if (c.status === "PENDING") {
        prevRevenue += c.orderValue;
        prevEstimatedCommission += c.commissionValue;
        prevValidConversionsCount++;
      }
    }

    const prevTotalCommission = prevConfirmedCommission + prevEstimatedCommission;
    const currentTotalCommission = confirmedCommission + estimatedCommission;

    // Temporal comparison deltas (only if previous period had data)
    const clicksDelta = prevClicks > 0 ? Number((((currentClicks - prevClicks) / prevClicks) * 100).toFixed(1)) : null;
    const conversionsDelta = prevValidConversionsCount > 0 ? Number((((validConversionsCount - prevValidConversionsCount) / prevValidConversionsCount) * 100).toFixed(1)) : null;
    const commissionDelta = prevTotalCommission > 0 ? Number((((currentTotalCommission - prevTotalCommission) / prevTotalCommission) * 100).toFixed(1)) : null;

    // Data Source Badge
    const hasMock = currentEvents.some((e) => e.source === "mock") || currentConversions.some((c) => c.source === "mock");
    const hasReal = currentEvents.some((e) => e.source === "real") || currentConversions.some((c) => c.source === "real");
    const dataSource: "MOCK" | "REAL" | "MIXED" = hasMock && hasReal ? "MIXED" : hasReal ? "REAL" : "MOCK";

    const summary = PerformanceScoreService.summarize({
      impressions: Math.max(currentClicks * 5, currentPublications * 10),
      clicks: currentClicks,
      conversions: validConversionsCount,
      revenue,
      estimatedCommission,
      confirmedCommission,
      cancelledCommission,
      cost: null, // Cost is null because external ads cost is not integrated yet
    });

    return {
      days,
      summary,
      publicationsCount: currentPublications,
      dataSource,
      comparison: {
        hasPreviousData: prevClicks > 0 || prevValidConversionsCount > 0,
        clicksDelta,
        conversionsDelta,
        commissionDelta,
      },
    };
  }

  /**
   * Detailed performance by channel.
   */
  static async getChannelAnalytics(userId: string): Promise<ChannelPerformance[]> {
    const channels = await prisma.channel.findMany({
      where: { userId },
      include: {
        publications: true,
        analyticsEvents: true,
        conversions: true,
      },
    });

    const results: ChannelPerformance[] = [];

    for (const ch of channels) {
      const clicks = ch.analyticsEvents.filter((e) => e.eventType === "CLICK").length;
      let confirmed = 0;
      let estimated = 0;
      let cancelled = 0;
      let convCount = 0;
      let revenue = 0;

      for (const conv of ch.conversions) {
        if (conv.status === "APPROVED") {
          confirmed += conv.commissionValue;
          revenue += conv.orderValue;
          convCount++;
        } else if (conv.status === "PENDING") {
          estimated += conv.commissionValue;
          revenue += conv.orderValue;
          convCount++;
        } else {
          cancelled += conv.commissionValue;
        }
      }

      const summary = PerformanceScoreService.summarize({
        impressions: Math.max(clicks * 5, ch.publications.length * 10),
        clicks,
        conversions: convCount,
        revenue,
        estimatedCommission: estimated,
        confirmedCommission: confirmed,
        cancelledCommission: cancelled,
      });

      const scoreCalc = PerformanceScoreService.calculateScore({
        clicks,
        conversions: convCount,
        commission: confirmed + estimated,
      });

      results.push({
        channelId: ch.id,
        name: ch.name,
        type: ch.type,
        metrics: summary,
        scoreBreakdown: scoreCalc.breakdown,
      });
    }

    results.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);
    return results;
  }

  /**
   * Product rankings and classification (WINNER / NEUTRAL / UNDERPERFORMER).
   */
  static async getProductAnalytics(userId: string): Promise<ProductPerformance[]> {
    const products = await prisma.product.findMany({
      include: {
        opportunities: { where: { userId } },
        affiliateLinks: { where: { userId } },
        offers: {
          where: { userId },
          include: { analyticsEvents: true, conversions: true },
        },
      },
      take: 50,
    });

    const list: ProductPerformance[] = [];
    let totalScoreSum = 0;

    for (const p of products) {
      let clicks = 0;
      let conversions = 0;
      let confirmed = 0;
      let estimated = 0;
      let revenue = 0;

      for (const off of p.offers) {
        clicks += off.analyticsEvents.filter((e) => e.eventType === "CLICK").length;
        for (const conv of off.conversions) {
          if (conv.status === "APPROVED") {
            confirmed += conv.commissionValue;
            revenue += conv.orderValue;
            conversions++;
          } else if (conv.status === "PENDING") {
            estimated += conv.commissionValue;
            revenue += conv.orderValue;
            conversions++;
          }
        }
      }

      const summary = PerformanceScoreService.summarize({
        impressions: Math.max(clicks * 5, p.offers.length * 5),
        clicks,
        conversions,
        revenue,
        estimatedCommission: estimated,
        confirmedCommission: confirmed,
      });

      totalScoreSum += summary.performanceScore;

      list.push({
        productId: p.id,
        title: p.title,
        category: p.category,
        platform: p.platform,
        opportunityScore: p.opportunityScore,
        metrics: summary,
        classification: "NEUTRAL",
        reason: "",
      });
    }

    const avgScore = list.length > 0 ? totalScoreSum / list.length : 50;

    for (const item of list) {
      if (item.metrics.sampleSize >= 15 && item.metrics.performanceScore > avgScore + 15) {
        item.classification = "WINNER";
        item.reason = `Performance acima da média geral (${item.metrics.performanceScore}/100 vs média ${avgScore.toFixed(0)}).`;
      } else if (item.metrics.sampleSize >= 15 && item.metrics.performanceScore < avgScore - 15) {
        item.classification = "UNDERPERFORMER";
        item.reason = `Performance abaixo da média geral (${item.metrics.performanceScore}/100 vs média ${avgScore.toFixed(0)}).`;
      } else {
        item.classification = "NEUTRAL";
        item.reason = "Performance alinhada com a média do catálogo.";
      }
    }

    list.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);
    return list;
  }

  /**
   * Platform analytics comparison (Shopee, Mercado Livre, Amazon...).
   */
  static async getPlatformAnalytics(userId: string): Promise<PlatformPerformance[]> {
    const platforms = ["SHOPEE", "MERCADO_LIVRE", "AMAZON"];
    const results: PlatformPerformance[] = [];

    for (const plat of platforms) {
      const productsCount = await prisma.product.count({ where: { platform: plat } });
      const offersCount = await prisma.offer.count({
        where: { userId, product: { platform: plat } },
      });
      const publicationsCount = await prisma.publication.count({
        where: { userId, offer: { product: { platform: plat } }, status: "PUBLISHED" },
      });

      const clicks = await prisma.analyticsEvent.count({
        where: { userId, platform: plat, eventType: "CLICK" },
      });

      const conversions = await prisma.conversion.findMany({
        where: { userId, platform: plat },
      });

      let confirmed = 0;
      let estimated = 0;
      let revenue = 0;
      let convCount = 0;

      for (const c of conversions) {
        if (c.status === "APPROVED") {
          confirmed += c.commissionValue;
          revenue += c.orderValue;
          convCount++;
        } else if (c.status === "PENDING") {
          estimated += c.commissionValue;
          revenue += c.orderValue;
          convCount++;
        }
      }

      const summary = PerformanceScoreService.summarize({
        impressions: Math.max(clicks * 5, publicationsCount * 10),
        clicks,
        conversions: convCount,
        revenue,
        estimatedCommission: estimated,
        confirmedCommission: confirmed,
      });

      results.push({
        platform: plat,
        productsCount,
        offersCount,
        publicationsCount,
        metrics: summary,
      });
    }

    return results;
  }

  /**
   * Offer analytics list.
   */
  static async getOfferAnalytics(userId: string, limit: number = 30): Promise<OfferPerformance[]> {
    const offers = await prisma.offer.findMany({
      where: { userId },
      include: {
        product: true,
        analyticsEvents: true,
        conversions: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return offers.map((off) => {
      const clicks = off.analyticsEvents.filter((e) => e.eventType === "CLICK").length;
      let confirmed = 0;
      let estimated = 0;
      let convCount = 0;
      let revenue = 0;

      for (const c of off.conversions) {
        if (c.status === "APPROVED") {
          confirmed += c.commissionValue;
          revenue += c.orderValue;
          convCount++;
        } else if (c.status === "PENDING") {
          estimated += c.commissionValue;
          revenue += c.orderValue;
          convCount++;
        }
      }

      const summary = PerformanceScoreService.summarize({
        impressions: Math.max(clicks * 5, 10),
        clicks,
        conversions: convCount,
        revenue,
        estimatedCommission: estimated,
        confirmedCommission: confirmed,
      });

      const reason = summary.conversions > 0
        ? `Oferta converteu ${summary.conversions}x gerando R$ ${(confirmed + estimated).toFixed(2)} de comissão.`
        : clicks > 0
        ? `${clicks} cliques recebidos, aguardando primeiras conversões.`
        : "Aguardando primeiros cliques pós-publicação.";

      return {
        offerId: off.id,
        title: off.title,
        style: off.style,
        platform: off.product?.platform || "SHOPEE",
        metrics: summary,
        analysisReason: reason,
      };
    });
  }

  /**
   * Tracks a publication event for real or mock channels with full attribution metadata.
   */
  static async trackPublication(input: {
    userId: string;
    publicationId: string;
    offerId: string;
    channelId: string;
    provider: string;
    source: "mock" | "real";
    telegramMessageId?: string | null;
    affiliateLinkId?: string | null;
    productId?: string | null;
    platform?: string | null;
    metadata?: Record<string, any>;
  }) {
    const meta = {
      provider: input.provider,
      telegramMessageId: input.telegramMessageId || undefined,
      publishedAt: new Date().toISOString(),
      ...(input.metadata || {}),
    };

    const event = await prisma.analyticsEvent.create({
      data: {
        userId: input.userId,
        eventType: "PUBLICATION",
        publicationId: input.publicationId,
        offerId: input.offerId,
        channelId: input.channelId,
        affiliateLinkId: input.affiliateLinkId || null,
        productId: input.productId || null,
        platform: input.platform || null,
        source: input.source,
        metadata: JSON.stringify(meta),
      },
    });

    return event;
  }
}

