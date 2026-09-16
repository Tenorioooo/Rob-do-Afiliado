import { SignalConfidence, EntityPerformanceSummary } from "./analytics-types";

export interface ScoreWeights {
  ctrWeight: number; // e.g. 0.30
  conversionWeight: number; // e.g. 0.30
  commissionWeight: number; // e.g. 0.25
  consistencyWeight: number; // e.g. 0.15
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  ctrWeight: 0.30,
  conversionWeight: 0.30,
  commissionWeight: 0.25,
  consistencyWeight: 0.15,
};

export class PerformanceScoreService {
  /**
   * Evaluates statistical confidence based on sample size thresholds.
   * < 30 events -> WEAK
   * 30 - 99 events -> RELIABLE
   * 100+ events -> STRONG
   */
  static evaluateConfidence(sampleSize: number): SignalConfidence {
    if (sampleSize >= 100) return "STRONG";
    if (sampleSize >= 30) return "RELIABLE";
    return "WEAK";
  }

  /**
   * Calculates CTR percentage (0 - 100).
   */
  static calculateCTR(clicks: number, impressions: number): number {
    if (impressions <= 0) return 0;
    const ctr = (clicks / impressions) * 100;
    return Number(Math.min(100, Math.max(0, ctr)).toFixed(2));
  }

  /**
   * Calculates Conversion Rate percentage (0 - 100).
   */
  static calculateConversionRate(conversions: number, clicks: number): number {
    if (clicks <= 0) return 0;
    const cr = (conversions / clicks) * 100;
    return Number(Math.min(100, Math.max(0, cr)).toFixed(2));
  }

  /**
   * Calculates a transparent, explainable Performance Score (0 - 100).
   */
  static calculateScore(params: {
    clicks: number;
    conversions: number;
    impressions?: number;
    commission: number;
    weights?: ScoreWeights;
  }): {
    totalScore: number;
    breakdown: {
      ctrScore: number;
      conversionScore: number;
      commissionScore: number;
      consistencyScore: number;
    };
    confidence: SignalConfidence;
    reason: string;
  } {
    const weights = params.weights || DEFAULT_SCORE_WEIGHTS;
    const impressions = params.impressions || Math.max(params.clicks * 5, 1);
    const ctr = this.calculateCTR(params.clicks, impressions);
    const cr = this.calculateConversionRate(params.conversions, params.clicks);
    const confidence = this.evaluateConfidence(params.clicks);

    // 1. CTR Score (normalized: benchmark 10% = 100 pts)
    const ctrScore = Math.min(100, (ctr / 10) * 100);

    // 2. Conversion Score (benchmark 5% = 100 pts)
    const conversionScore = Math.min(100, (cr / 5) * 100);

    // 3. Commission Score (benchmark R$ 50 = 100 pts)
    const commissionScore = Math.min(100, (params.commission / 50) * 100);

    // 4. Sample Consistency Score
    let consistencyScore = 20;
    if (confidence === "STRONG") {
      consistencyScore = 100;
    } else if (confidence === "RELIABLE") {
      consistencyScore = 65;
    } else if (params.clicks > 10) {
      consistencyScore = 40;
    }

    const totalScore = Math.round(
      ctrScore * weights.ctrWeight +
      conversionScore * weights.conversionWeight +
      commissionScore * weights.commissionWeight +
      consistencyScore * weights.consistencyWeight
    );

    const clampedScore = Math.min(100, Math.max(0, totalScore));

    const reason = `Score ${clampedScore}/100 [CTR: ${ctr.toFixed(1)}% (${weights.ctrWeight * 100}%), Conv: ${cr.toFixed(1)}% (${weights.conversionWeight * 100}%), Com: R$ ${params.commission.toFixed(2)} (${weights.commissionWeight * 100}%), Amostra: ${params.clicks} cliques (${confidence})]`;

    return {
      totalScore: clampedScore,
      breakdown: {
        ctrScore: Math.round(ctrScore),
        conversionScore: Math.round(conversionScore),
        commissionScore: Math.round(commissionScore),
        consistencyScore: Math.round(consistencyScore),
      },
      confidence,
      reason,
    };
  }

  /**
   * Summarizes performance from raw numbers.
   */
  static summarize(params: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    estimatedCommission: number;
    confirmedCommission: number;
    cancelledCommission?: number;
    cost?: number | null;
  }): EntityPerformanceSummary {
    const ctr = this.calculateCTR(params.clicks, params.impressions);
    const cr = this.calculateConversionRate(params.conversions, params.clicks);
    const scoreResult = this.calculateScore({
      clicks: params.clicks,
      conversions: params.conversions,
      impressions: params.impressions,
      commission: params.confirmedCommission + params.estimatedCommission,
    });

    let roi: number | null = null;
    if (params.cost !== undefined && params.cost !== null && params.cost > 0) {
      const profit = (params.confirmedCommission + params.estimatedCommission) - params.cost;
      roi = Number(((profit / params.cost) * 100).toFixed(2));
    }

    return {
      impressions: params.impressions,
      clicks: params.clicks,
      conversions: params.conversions,
      ctr,
      conversionRate: cr,
      revenue: params.revenue,
      estimatedCommission: params.estimatedCommission,
      confirmedCommission: params.confirmedCommission,
      cancelledCommission: params.cancelledCommission || 0,
      performanceScore: scoreResult.totalScore,
      roi,
      sampleSize: params.clicks,
      confidence: scoreResult.confidence,
    };
  }
}
