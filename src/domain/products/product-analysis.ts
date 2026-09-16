import { NormalizedProduct, ProductAnalysisIndicators } from "./types";
import { formatCurrency } from "@/lib/utils";

export class ProductAnalysisService {
  /**
   * Analyzes a normalized product and produces structured analytical indicators
   * without fabricating missing data.
   */
  static analyze(product: NormalizedProduct): ProductAnalysisIndicators {
    const reasons: string[] = [];

    // 1. Discount Depth (0 - 100)
    let discountDepth = 0;
    if (product.discountPercent >= 50) {
      discountDepth = 100;
      reasons.push(`Desconto agressivo de ${product.discountPercent}% OFF`);
    } else if (product.discountPercent >= 35) {
      discountDepth = 85;
      reasons.push(`Desconto relevante de ${product.discountPercent}% OFF acima da média`);
    } else if (product.discountPercent >= 20) {
      discountDepth = 70;
      reasons.push(`Desconto promocional de ${product.discountPercent}%`);
    } else if (product.discountPercent >= 10) {
      discountDepth = 50;
    } else {
      discountDepth = 30;
    }

    // 2. Commission Yield (0 - 100)
    let commissionYield = 50;
    if (product.commissionAmount >= 30 || product.commissionRate >= 0.15) {
      commissionYield = 98;
      reasons.push(`Alta comissão estimada de ${formatCurrency(product.commissionAmount)} (${(product.commissionRate * 100).toFixed(0)}%)`);
    } else if (product.commissionAmount >= 15 || product.commissionRate >= 0.1) {
      commissionYield = 85;
      reasons.push(`Boa comissão de ${formatCurrency(product.commissionAmount)} por conversão`);
    } else if (product.commissionAmount >= 8) {
      commissionYield = 70;
    } else {
      commissionYield = 50;
    }

    // 3. Rating Quality (0 - 100 or null)
    let ratingQuality: number | null = null;
    if (product.rating !== null) {
      if (product.rating >= 4.8) {
        ratingQuality = 100;
        reasons.push(`Excelente avaliação dos compradores (⭐ ${product.rating} estrelas)`);
      } else if (product.rating >= 4.5) {
        ratingQuality = 85;
        reasons.push(`Forte índice de satisfação (⭐ ${product.rating})`);
      } else if (product.rating >= 4.0) {
        ratingQuality = 70;
      } else {
        ratingQuality = 45;
      }
    }

    // 4. Review Volume (0 - 100 or null)
    let reviewVolumeScore: number | null = null;
    if (product.reviewCount !== null) {
      if (product.reviewCount >= 5000) {
        reviewVolumeScore = 100;
        reasons.push(`Grande volume social comprovado com +${product.reviewCount.toLocaleString("pt-BR")} avaliações`);
      } else if (product.reviewCount >= 1000) {
        reviewVolumeScore = 85;
        reasons.push(`Mais de ${product.reviewCount.toLocaleString("pt-BR")} avaliações registradas`);
      } else if (product.reviewCount >= 200) {
        reviewVolumeScore = 70;
      } else {
        reviewVolumeScore = 50;
      }
    }

    // 5. Trend Strength (0 - 100 or null)
    let trendStrength: number | null = null;
    if (product.trendScore !== null) {
      trendStrength = product.trendScore;
      if (product.trendScore >= 90) {
        reasons.push("Pico de buscas e demanda em alta nas redes");
      } else if (product.trendScore >= 80) {
        reasons.push("Tendência crescente de interesse e cliques");
      }
    }

    // 6. Price Attractiveness (0 - 100)
    let priceAttractiveness = 80;
    if (product.currentPrice < 100) {
      priceAttractiveness = 95;
      reasons.push("Ticket de compra por impulso (abaixo de R$ 100)");
    } else if (product.currentPrice < 300) {
      priceAttractiveness = 85;
      reasons.push("Excelente relação custo-benefício para a categoria");
    } else {
      priceAttractiveness = 75;
    }

    // 7. Freshness Score
    const freshnessScore = 95;

    // Calculate Data Completeness Ratio
    let totalFields = 6;
    let presentFields = 3; // discount, commission, price always present
    if (product.rating !== null) presentFields++;
    if (product.reviewCount !== null) presentFields++;
    if (product.trendScore !== null) presentFields++;

    const dataCompletenessRatio = Number((presentFields / totalFields).toFixed(2));

    if (reasons.length === 0) {
      reasons.push("Produto selecionado com base nos critérios de corte");
    }

    return {
      productId: product.id || product.externalId,
      priceAttractiveness,
      discountDepth,
      commissionYield,
      ratingQuality,
      reviewVolumeScore,
      trendStrength,
      freshnessScore,
      recommendationReasons: reasons,
      dataCompletenessRatio,
    };
  }
}
