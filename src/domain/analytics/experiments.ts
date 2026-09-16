import { prisma } from "@/lib/db/prisma";
import { CreateExperimentInput } from "./analytics-types";
import { OfferStyle } from "@/domain/offers/types";

export class ExperimentService {
  /**
   * Creates a new A/B copy experiment with variants.
   */
  static async createExperiment(input: CreateExperimentInput) {
    const weightPerVariant = 1.0 / input.variants.length;

    const experiment = await prisma.experiment.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description,
        targetMetric: input.targetMetric || "CTR",
        status: "RUNNING",
        cooldownHours: input.cooldownHours || 6,
        maxExposure: input.maxExposure || 100,
        variants: {
          create: input.variants.map((v) => ({
            style: v.style,
            trafficWeight: v.trafficWeight ?? weightPerVariant,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            commission: 0,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return experiment;
  }

  /**
   * Selects an active variant for an offer generation cycle without spamming.
   */
  static async selectVariantForTraffic(
    experimentId: string
  ): Promise<{ variantId: string; style: OfferStyle } | null> {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (!experiment || experiment.status !== "RUNNING" || experiment.variants.length === 0) {
      return null;
    }

    // Check max exposure limit
    const totalImpressions = experiment.variants.reduce((acc, v) => acc + v.impressions, 0);
    if (totalImpressions >= experiment.maxExposure) {
      // Complete experiment
      await this.evaluateAndConcludeExperiment(experiment.id);
      return null;
    }

    // Weighted random selection
    const rand = Math.random();
    let cumulative = 0;
    for (const v of experiment.variants) {
      cumulative += v.trafficWeight;
      if (rand <= cumulative) {
        return { variantId: v.id, style: v.style as OfferStyle };
      }
    }

    const fallback = experiment.variants[0];
    return { variantId: fallback.id, style: fallback.style as OfferStyle };
  }

  /**
   * Records an impression, click, or conversion on a variant.
   */
  static async recordVariantMetric(
    variantId: string,
    metric: "IMPRESSION" | "CLICK" | "CONVERSION",
    value: number = 1,
    commissionAmount: number = 0
  ) {
    const variant = await prisma.experimentVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) return;

    const data: any = {};
    if (metric === "IMPRESSION") data.impressions = variant.impressions + value;
    if (metric === "CLICK") data.clicks = variant.clicks + value;
    if (metric === "CONVERSION") {
      data.conversions = variant.conversions + value;
      data.commission = variant.commission + commissionAmount;
    }

    await prisma.experimentVariant.update({
      where: { id: variantId },
      data,
    });
  }

  /**
   * Evaluates experiment results and declares a winner deterministically.
   */
  static async evaluateAndConcludeExperiment(experimentId: string) {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (!experiment || experiment.variants.length === 0) return null;

    let winningVariant = experiment.variants[0];
    let topScore = -1;

    for (const v of experiment.variants) {
      let score = 0;
      if (experiment.targetMetric === "CTR") {
        score = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
      } else if (experiment.targetMetric === "CONVERSION_RATE") {
        score = v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0;
      } else if (experiment.targetMetric === "COMMISSION") {
        score = v.commission;
      }

      if (score > topScore) {
        topScore = score;
        winningVariant = v;
      }
    }

    const reason = `Variação ${winningVariant.style} venceu o teste A/B com métrica ${experiment.targetMetric} atingindo ${topScore.toFixed(2)} em ${winningVariant.impressions} impressões.`;

    const updated = await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        status: "COMPLETED",
        winningStyle: winningVariant.style,
        analysisReason: reason,
        endDate: new Date(),
      },
      include: { variants: true },
    });

    return updated;
  }
}
