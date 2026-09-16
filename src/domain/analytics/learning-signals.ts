import { prisma } from "@/lib/db/prisma";
import { LearningSignalData, LearningSignalType, SignalConfidence } from "./analytics-types";
import { PerformanceScoreService } from "./performance-score";

export interface LearningThresholds {
  minClicksForLearning: number; // default 30
  reliableThreshold: number; // default 100
}

export const DEFAULT_LEARNING_THRESHOLDS: LearningThresholds = {
  minClicksForLearning: 30,
  reliableThreshold: 100,
};

export class LearningSignalService {
  /**
   * Generates or refreshes all continuous learning signals for a given user.
   */
  static async computeSignals(
    userId: string,
    thresholds: LearningThresholds = DEFAULT_LEARNING_THRESHOLDS
  ): Promise<LearningSignalData[]> {
    const signals: LearningSignalData[] = [];

    // Fetch user events
    const events = await prisma.analyticsEvent.findMany({
      where: { userId },
      include: {
        affiliateLink: true,
        offer: { include: { product: true } },
        publication: { include: { channel: true } },
        channel: true,
      },
    });

    const conversions = await prisma.conversion.findMany({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    });

    const clicks = events.filter((e) => e.eventType === "CLICK");
    const totalClicks = clicks.length;

    // 1. BEST_CHANNEL SIGNAL
    const channelMap = new Map<
      string,
      { name: string; clicks: number; conversions: number; commission: number }
    >();

    for (const c of clicks) {
      const chId = c.channelId || c.publication?.channelId;
      if (!chId) continue;
      const chName = c.channel?.name || c.publication?.channel?.name || chId;
      const current = channelMap.get(chId) || { name: chName, clicks: 0, conversions: 0, commission: 0 };
      current.clicks++;
      channelMap.set(chId, current);
    }

    for (const conv of conversions) {
      if (!conv.channelId) continue;
      const current = channelMap.get(conv.channelId);
      if (current) {
        current.conversions++;
        current.commission += conv.commissionValue;
      }
    }

    let topChannel: { id: string; name: string; score: number; clicks: number; conversions: number; cr: number } | null = null;

    for (const [chId, data] of Array.from(channelMap.entries())) {
      if (data.clicks < thresholds.minClicksForLearning) continue;
      const scoreRes = PerformanceScoreService.calculateScore({
        clicks: data.clicks,
        conversions: data.conversions,
        commission: data.commission,
      });
      const cr = PerformanceScoreService.calculateConversionRate(data.conversions, data.clicks);
      if (!topChannel || scoreRes.totalScore > topChannel.score) {
        topChannel = {
          id: chId,
          name: data.name,
          score: scoreRes.totalScore,
          clicks: data.clicks,
          conversions: data.conversions,
          cr,
        };
      }
    }

    if (topChannel) {
      const confidence: SignalConfidence =
        topChannel.clicks >= thresholds.reliableThreshold ? "STRONG" : "RELIABLE";
      signals.push({
        userId,
        signalType: "BEST_CHANNEL",
        targetEntity: topChannel.name,
        score: topChannel.score,
        confidence,
        sampleSize: topChannel.clicks,
        reason: `Canal ${topChannel.name} apresentou o melhor desempenho com ${topChannel.cr.toFixed(1)}% de conversão em ${topChannel.clicks} cliques auditados.`,
        metadata: { channelId: topChannel.id, clicks: topChannel.clicks, conversions: topChannel.conversions },
      });
    }

    // 2. BEST_COPY_STYLE SIGNAL
    const copyMap = new Map<string, { clicks: number; conversions: number; commission: number }>();

    for (const c of clicks) {
      const style = c.offer?.style || "DESCONTO";
      const current = copyMap.get(style) || { clicks: 0, conversions: 0, commission: 0 };
      current.clicks++;
      copyMap.set(style, current);
    }

    for (const conv of conversions) {
      const offer = conv.offerId ? await prisma.offer.findUnique({ where: { id: conv.offerId } }) : null;
      const style = offer?.style || "DESCONTO";
      const current = copyMap.get(style);
      if (current) {
        current.conversions++;
        current.commission += conv.commissionValue;
      }
    }

    let topStyle: { style: string; score: number; clicks: number; conversions: number; cr: number } | null = null;

    for (const [style, data] of Array.from(copyMap.entries())) {
      if (data.clicks < thresholds.minClicksForLearning) continue;
      const scoreRes = PerformanceScoreService.calculateScore({
        clicks: data.clicks,
        conversions: data.conversions,
        commission: data.commission,
      });
      const cr = PerformanceScoreService.calculateConversionRate(data.conversions, data.clicks);
      if (!topStyle || scoreRes.totalScore > topStyle.score) {
        topStyle = {
          style,
          score: scoreRes.totalScore,
          clicks: data.clicks,
          conversions: data.conversions,
          cr,
        };
      }
    }

    if (topStyle) {
      const confidence: SignalConfidence =
        topStyle.clicks >= thresholds.reliableThreshold ? "STRONG" : "RELIABLE";
      signals.push({
        userId,
        signalType: "BEST_COPY_STYLE",
        targetEntity: topStyle.style,
        score: topStyle.score,
        confidence,
        sampleSize: topStyle.clicks,
        reason: `Copy no estilo ${topStyle.style} gerou maior tração com score ${topStyle.score}/100 e conversão de ${topStyle.cr.toFixed(1)}%.`,
        metadata: { style: topStyle.style, clicks: topStyle.clicks, conversions: topStyle.conversions },
      });
    }

    // 3. BEST_PLATFORM SIGNAL
    const platMap = new Map<string, { clicks: number; conversions: number; commission: number }>();

    for (const c of clicks) {
      const plat = c.platform || c.offer?.product?.platform || "SHOPEE";
      const current = platMap.get(plat) || { clicks: 0, conversions: 0, commission: 0 };
      current.clicks++;
      platMap.set(plat, current);
    }

    for (const conv of conversions) {
      const plat = conv.platform || "SHOPEE";
      const current = platMap.get(plat);
      if (current) {
        current.conversions++;
        current.commission += conv.commissionValue;
      }
    }

    let topPlatform: { platform: string; score: number; clicks: number; conversions: number } | null = null;

    for (const [plat, data] of Array.from(platMap.entries())) {
      if (data.clicks < thresholds.minClicksForLearning) continue;
      const scoreRes = PerformanceScoreService.calculateScore({
        clicks: data.clicks,
        conversions: data.conversions,
        commission: data.commission,
      });
      if (!topPlatform || scoreRes.totalScore > topPlatform.score) {
        topPlatform = {
          platform: plat,
          score: scoreRes.totalScore,
          clicks: data.clicks,
          conversions: data.conversions,
        };
      }
    }

    if (topPlatform) {
      const confidence: SignalConfidence =
        topPlatform.clicks >= thresholds.reliableThreshold ? "STRONG" : "RELIABLE";
      signals.push({
        userId,
        signalType: "BEST_PLATFORM",
        targetEntity: topPlatform.platform,
        score: topPlatform.score,
        confidence,
        sampleSize: topPlatform.clicks,
        reason: `Marketplace ${topPlatform.platform} lidera em retorno financeiro e engajamento com amostra de ${topPlatform.clicks} cliques.`,
        metadata: { platform: topPlatform.platform, clicks: topPlatform.clicks },
      });
    }

    // Persist signals to Database
    for (const sig of signals) {
      const existing = await prisma.learningSignal.findFirst({
        where: { userId, signalType: sig.signalType },
      });

      if (existing) {
        await prisma.learningSignal.update({
          where: { id: existing.id },
          data: {
            targetEntity: sig.targetEntity,
            score: sig.score,
            confidence: sig.confidence,
            sampleSize: sig.sampleSize,
            reason: sig.reason,
            metadata: sig.metadata ? JSON.stringify(sig.metadata) : null,
            active: true,
          },
        });
      } else {
        await prisma.learningSignal.create({
          data: {
            userId: sig.userId,
            signalType: sig.signalType,
            targetEntity: sig.targetEntity,
            score: sig.score,
            confidence: sig.confidence,
            sampleSize: sig.sampleSize,
            reason: sig.reason,
            metadata: sig.metadata ? JSON.stringify(sig.metadata) : null,
            active: true,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Retrieves active signals for Autopilot decision prioritization.
   */
  static async getActiveSignals(userId: string): Promise<LearningSignalData[]> {
    const dbSignals = await prisma.learningSignal.findMany({
      where: { userId, active: true },
    });

    return dbSignals.map((s) => ({
      id: s.id,
      userId: s.userId,
      signalType: s.signalType as LearningSignalType,
      targetEntity: s.targetEntity,
      score: s.score,
      confidence: s.confidence as SignalConfidence,
      sampleSize: s.sampleSize,
      reason: s.reason,
      metadata: s.metadata ? JSON.parse(s.metadata) : undefined,
      active: s.active,
    }));
  }
}
