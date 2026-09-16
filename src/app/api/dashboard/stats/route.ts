import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    // 1. Opportunities counts
    const totalOpportunities = await prisma.opportunity.count({
      where: { userId },
    });

    const qualifiedOpportunities = await prisma.opportunity.count({
      where: { userId, status: "QUALIFIED" },
    });

    // 2. Average Opportunity Score & Max Score
    const opportunities = await prisma.opportunity.findMany({
      where: { userId, status: "QUALIFIED" },
      select: { score: true },
    });

    const avgScore =
      opportunities.length > 0
        ? Math.round(opportunities.reduce((acc, curr) => acc + curr.score, 0) / opportunities.length)
        : 0;

    const maxScore =
      opportunities.length > 0
        ? Math.max(...opportunities.map((o) => o.score))
        : 0;

    // 3. Total Scanned / Analyzed from RobotScans
    const scans = await prisma.robotScan.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
    });

    const totalScansCount = await prisma.robotScan.count({ where: { userId } });

    const totalProductsAnalyzed = scans.reduce((acc, s) => acc + (s.totalAnalyzed || 0), 0);

    const lastScan = scans.length > 0 ? scans[0] : null;

    // 4. Top Opportunities for Dashboard Table
    const topOpportunities = await prisma.opportunity.findMany({
      where: { userId, status: "QUALIFIED" },
      orderBy: { score: "desc" },
      take: 5,
      include: {
        product: true,
      },
    });

    const parsedTop = topOpportunities.map((opp) => ({
      id: opp.id,
      productId: opp.productId,
      score: opp.score,
      confidence: opp.confidence,
      title: opp.product.title,
      platform: opp.product.platform,
      imageUrl: opp.product.imageUrl,
      currentPrice: opp.product.currentPrice,
      originalPrice: opp.product.originalPrice,
      discountPercent: opp.product.discountPercent,
      commissionAmount: opp.product.commissionAmount,
      commissionRate: opp.product.commissionRate,
      category: opp.product.category,
      reasons: JSON.parse(opp.reasons || "[]"),
    }));

    // 5. Phase 3 Metrics: Links, Offers, and Queue
    const [totalLinks, totalOffers, pendingOffers, approvedOffers, queuedOffers] =
      await Promise.all([
        prisma.affiliateLink.count({ where: { userId } }),
        prisma.offer.count({ where: { userId } }),
        prisma.offer.count({ where: { userId, status: { in: ["DRAFT", "READY"] } } }),
        prisma.offer.count({ where: { userId, status: "APPROVED" } }),
        prisma.offerQueueItem.count({ where: { userId, status: { in: ["QUEUED", "SCHEDULED"] } } }),
      ]);

    // 6. Phase 4 Metrics: Channels, Automation, and Publications
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      activeChannelsCount,
      activeRulesCount,
      publicationsToday,
      totalPublications,
      successfulPublications,
      failedPublications,
    ] = await Promise.all([
      prisma.channel.count({ where: { userId, active: true } }),
      prisma.automationRule.count({ where: { userId, active: true } }),
      prisma.publication.count({
        where: {
          userId,
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.publication.count({ where: { userId } }),
      prisma.publication.count({ where: { userId, status: "PUBLISHED" } }),
      prisma.publication.count({ where: { userId, status: "FAILED" } }),
    ]);

    const successRate =
      totalPublications > 0
        ? Math.round((successfulPublications / totalPublications) * 100)
        : 100;

    return NextResponse.json({
      stats: {
        totalOpportunities,
        qualifiedOpportunities,
        avgScore,
        maxScore,
        totalScansCount,
        totalProductsAnalyzed,
        lastScanAt: lastScan?.finishedAt || lastScan?.startedAt || null,
        lastScanStatus: lastScan?.status || null,
        totalLinks,
        totalOffers,
        pendingOffers,
        approvedOffers,
        queuedOffers,
        activeChannelsCount,
        activeRulesCount,
        publicationsToday,
        totalPublications,
        successfulPublications,
        failedPublications,
        successRate,
      },
      topOpportunities: parsedTop,
      recentScans: scans,
    });
  } catch (error: unknown) {
    console.error("[API:Dashboard:Stats:Error]", error);
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 });
  }
}
