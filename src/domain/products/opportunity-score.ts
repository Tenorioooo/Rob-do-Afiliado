import {
  NormalizedProduct,
  ProductAnalysisIndicators,
  OpportunityScoreCalculation,
  ScoreComponentResult,
  ConfidenceLevel,
} from "./types";

export interface ScoreWeights {
  trend: number; // 25
  discount: number; // 20
  commission: number; // 20
  ratingReviews: number; // 15
  priceAttractiveness: number; // 10
  freshness: number; // 10
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  trend: 25,
  discount: 20,
  commission: 20,
  ratingReviews: 15,
  priceAttractiveness: 10,
  freshness: 10,
};

export class OpportunityScoringService {
  /**
   * Calculates a transparent, explainable Opportunity Score (0 - 100)
   * Handles missing data transparently by re-weighting available metrics proportionally.
   */
  static calculate(
    product: NormalizedProduct,
    analysis: ProductAnalysisIndicators,
    weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
  ): OpportunityScoreCalculation {
    const rawScores: { [key in keyof ScoreWeights]: { score: number; available: boolean; explanation: string } } = {
      trend: {
        score: analysis.trendStrength !== null ? analysis.trendStrength : 0,
        available: analysis.trendStrength !== null,
        explanation: analysis.trendStrength !== null
          ? `Índice de tendência e demanda: ${analysis.trendStrength}/100`
          : "Dado de tendência não fornecido pelo marketplace",
      },
      discount: {
        score: analysis.discountDepth,
        available: true,
        explanation: `Desconto de ${product.discountPercent}% OFF (Nível ${analysis.discountDepth}/100)`,
      },
      commission: {
        score: analysis.commissionYield,
        available: true,
        explanation: `Comissão estimada de R$ ${product.commissionAmount.toFixed(2)} (${(product.commissionRate * 100).toFixed(0)}%)`,
      },
      ratingReviews: {
        score:
          analysis.ratingQuality !== null && analysis.reviewVolumeScore !== null
            ? Math.round(analysis.ratingQuality * 0.6 + analysis.reviewVolumeScore * 0.4)
            : analysis.ratingQuality !== null
            ? analysis.ratingQuality
            : 0,
        available: analysis.ratingQuality !== null,
        explanation: analysis.ratingQuality !== null
          ? `Avaliação ⭐ ${product.rating || 0} (${product.reviewCount || 0} avaliações)`
          : "Avaliações não disponíveis no momento",
      },
      priceAttractiveness: {
        score: analysis.priceAttractiveness,
        available: true,
        explanation: `Preço atual R$ ${product.currentPrice.toFixed(2)} competitivo para a categoria`,
      },
      freshness: {
        score: analysis.freshnessScore,
        available: true,
        explanation: "Oportunidade recente identificada no ciclo",
      },
    };

    // Calculate sum of available weights for proportional redistribution
    let availableWeightsSum = 0;
    for (const key of Object.keys(weights) as (keyof ScoreWeights)[]) {
      if (rawScores[key].available) {
        availableWeightsSum += weights[key];
      }
    }

    // Guard against zero available weights
    if (availableWeightsSum === 0) {
      availableWeightsSum = 100;
    }

    const breakdown: OpportunityScoreCalculation["breakdown"] = {} as any;
    let totalScoreSum = 0;

    for (const key of Object.keys(weights) as (keyof ScoreWeights)[]) {
      const item = rawScores[key];
      const baseWeight = weights[key];
      const effectiveWeight = item.available
        ? Number(((baseWeight / availableWeightsSum) * 100).toFixed(1))
        : 0;
      const weightedScore = item.available
        ? Number(((item.score * effectiveWeight) / 100).toFixed(1))
        : 0;

      if (item.available) {
        totalScoreSum += weightedScore;
      }

      breakdown[key] = {
        name: key,
        score: item.score,
        weight: baseWeight,
        effectiveWeight,
        weightedScore,
        explanation: item.explanation,
        dataAvailable: item.available,
      };
    }

    const finalScore = Math.min(Math.max(Math.round(totalScoreSum), 0), 100);

    // Determine Tier
    let tier: OpportunityScoreCalculation["tier"] = "MODERATE";
    if (finalScore >= 90) tier = "HOT";
    else if (finalScore >= 78) tier = "HIGH_POTENTIAL";
    else if (finalScore >= 60) tier = "MODERATE";
    else tier = "LOW";

    // Determine Confidence
    let confidence: ConfidenceLevel = "ALTA";
    if (analysis.dataCompletenessRatio >= 0.85) confidence = "ALTA";
    else if (analysis.dataCompletenessRatio >= 0.6) confidence = "MEDIA";
    else confidence = "BAIXA";

    return {
      totalScore: finalScore,
      tier,
      confidence,
      dataCompleteness: analysis.dataCompletenessRatio,
      breakdown,
      reasons: analysis.recommendationReasons,
    };
  }
}
