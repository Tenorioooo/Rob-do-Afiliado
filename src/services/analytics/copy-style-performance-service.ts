import { prisma } from "@/lib/db/prisma";
import { CopyStylePerformance } from "@/domain/analytics/analytics-types";
import { PerformanceScoreService } from "@/domain/analytics/performance-score";
import { OfferStyle } from "@/domain/offers/types";

export class CopyStylePerformanceService {
  /**
   * Analyzes and ranks copy styles based on actual click and conversion data.
   */
  static async getStyleRankings(
    userId: string,
    minClicksForRanking: number = 20
  ): Promise<{
    styles: CopyStylePerformance[];
    bestStyle: CopyStylePerformance | null;
    isRankingConfident: boolean;
  }> {
    const allStyles: OfferStyle[] = ["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"];
    const results: CopyStylePerformance[] = [];

    const offers = await prisma.offer.findMany({
      where: { userId },
      include: {
        analyticsEvents: true,
        conversions: true,
        publications: true,
      },
    });

    for (const style of allStyles) {
      const styleOffers = offers.filter((o) => o.style === style);
      let clicks = 0;
      let conversions = 0;
      let confirmed = 0;
      let estimated = 0;
      let publicationsCount = 0;
      let revenue = 0;

      for (const off of styleOffers) {
        publicationsCount += off.publications.length;
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
        impressions: Math.max(clicks * 5, publicationsCount * 10),
        clicks,
        conversions,
        revenue,
        estimatedCommission: estimated,
        confirmedCommission: confirmed,
      });

      results.push({
        style,
        offersCount: styleOffers.length,
        publicationsCount,
        metrics: summary,
        rank: null,
      });
    }

    // Rank only if at least one style has enough sample data
    const hasEnoughData = results.some((r) => r.metrics.clicks >= minClicksForRanking);

    results.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);

    if (hasEnoughData) {
      results.forEach((r, idx) => {
        if (r.metrics.clicks >= minClicksForRanking) {
          r.rank = idx + 1;
        }
      });
    }

    const bestStyle = hasEnoughData && results[0].metrics.clicks >= minClicksForRanking ? results[0] : null;

    return {
      styles: results,
      bestStyle,
      isRankingConfident: hasEnoughData && (bestStyle?.metrics.clicks || 0) >= 30,
    };
  }
}
