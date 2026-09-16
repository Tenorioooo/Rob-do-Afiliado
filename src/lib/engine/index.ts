/**
 * Robot Engine - Core Domain Implementation
 *
 * Implements the 9-stage pipeline:
 * DISCOVERY -> ANALYSIS -> SCORING -> AFFILIATE LINK -> AI COPY -> QUEUE -> DISTRIBUTION -> TRACKING -> LEARNING
 */

import {
  ProductDiscoveryService,
  ProductAnalysisService,
  OpportunityScoringService,
  AffiliateLinkService,
  OfferGenerationService,
  QueueService,
  DistributionService,
  TrackingService,
  LearningService,
  DiscoveryOptions,
  AnalysisMetrics,
  OpportunityScoreResult,
  GeneratedOfferCopy,
  DistributionJob,
  LearningFeedback,
} from "../contracts/robot";
import { MarketplaceProduct } from "../contracts/marketplace";
import { ChannelMessage, ChannelDeliveryResult } from "../contracts/channel";
import { MOCK_PRODUCTS } from "../mock";

// 1. DISCOVERY STAGE
export class DiscoveryEngineService implements ProductDiscoveryService {
  async discoverOpportunities(options: DiscoveryOptions): Promise<MarketplaceProduct[]> {
    console.log("[RobotEngine:1-Discovery] Scanning platforms:", options.platforms);
    return MOCK_PRODUCTS.filter((product) => {
      const matchPlatform = options.platforms.length === 0 || options.platforms.includes(product.platform);
      const matchCategory = options.categories.length === 0 || options.categories.includes(product.category);
      return matchPlatform && matchCategory;
    });
  }
}

// 2. ANALYSIS STAGE
export class AnalysisEngineService implements ProductAnalysisService {
  async analyzeProduct(product: MarketplaceProduct): Promise<AnalysisMetrics> {
    console.log(`[RobotEngine:2-Analysis] Analyzing product ${product.id} - ${product.title}`);
    const demandIndex = product.salesCount > 1000 ? 95 : 75;
    const reviewSentiment = product.rating >= 4.7 ? 96 : 80;

    return {
      productId: product.id,
      priceVolatility: 12.5,
      demandIndex,
      sellerReputation: 98,
      reviewSentimentScore: reviewSentiment,
      marginViability: product.commissionAmount >= 10.0,
      recommendationReasons: product.opportunityReasons || [
        "Desconto agressivo acima da média",
        "Alta taxa de conversão esperada",
        "Excelente avaliação dos compradores",
      ],
    };
  }
}

// 3. SCORING STAGE
export class ScoringEngineService implements OpportunityScoringService {
  async calculateScore(product: MarketplaceProduct, analysis: AnalysisMetrics): Promise<OpportunityScoreResult> {
    console.log(`[RobotEngine:3-Scoring] Computing Opportunity Score for ${product.id}`);

    const discountWeight = Math.min(product.discountPercent * 0.4, 30);
    const commissionWeight = Math.min((product.commissionAmount / 50) * 30, 30);
    const trendWeight = (product.trendScore / 100) * 20;
    const ratingWeight = ((product.rating - 3) / 2) * 10;
    const volumeWeight = analysis.demandIndex > 90 ? 10 : 5;

    const totalScore = Math.min(
      Math.round(discountWeight + commissionWeight + trendWeight + ratingWeight + volumeWeight),
      100
    );

    let tier: "HOT" | "HIGH_POTENTIAL" | "MODERATE" | "LOW" = "MODERATE";
    if (totalScore >= 90) tier = "HOT";
    else if (totalScore >= 75) tier = "HIGH_POTENTIAL";
    else if (totalScore >= 60) tier = "MODERATE";
    else tier = "LOW";

    return {
      productId: product.id,
      score: totalScore,
      breakdown: {
        discountWeight: Number(discountWeight.toFixed(1)),
        commissionWeight: Number(commissionWeight.toFixed(1)),
        trendWeight: Number(trendWeight.toFixed(1)),
        ratingWeight: Number(ratingWeight.toFixed(1)),
        volumeWeight: Number(volumeWeight.toFixed(1)),
      },
      tier,
    };
  }
}

// 4. AFFILIATE LINK STAGE
export class LinkEngineService implements AffiliateLinkService {
  async generateLink(userId: string, productId: string, originalUrl: string): Promise<string> {
    console.log(`[RobotEngine:4-Link] Generating tagged affiliate link for user ${userId}`);
    const slug = originalUrl.split("/").pop() || productId;
    return `https://affiliateai.app/l/${slug}?sub_id=${userId}`;
  }
}

// 5. AI COPY STAGE
export class AICopyEngineService implements OfferGenerationService {
  async generateCopy(product: MarketplaceProduct, affiliateUrl: string): Promise<GeneratedOfferCopy> {
    console.log(`[RobotEngine:5-AICopy] Generating high-converting AI offer copy for ${product.title}`);

    const hook = `🔥 OFERTA RELÂMPAGO: ${product.discountPercent}% OFF!`;
    const headline = product.title;
    const body = `${product.description}\n\nDe R$ ${product.originalPrice.toFixed(2)} por APENAS R$ ${product.currentPrice.toFixed(2)}! Avaliação ⭐ ${product.rating} com milhares de vendas.`;
    const callToAction = "👉 Pegue o seu antes que o estoque acabe:";

    const fullText = `
${hook}

${headline}

${body}

${callToAction}
${affiliateUrl}
    `.trim();

    return {
      productId: product.id,
      hook,
      headline,
      body,
      callToAction,
      emojis: ["🔥", "⚡", "⭐", "🛒", "🏷️"],
      fullText,
    };
  }
}

// 6. QUEUE STAGE
export class QueueEngineService implements QueueService {
  async enqueueOffer(job: DistributionJob): Promise<{ jobId: string; status: string }> {
    console.log(`[RobotEngine:6-Queue] Enqueuing distribution job ${job.id}`);
    return {
      jobId: `job_${Date.now()}`,
      status: "QUEUED",
    };
  }
}

// 7. DISTRIBUTION STAGE
export class DistributionEngineService implements DistributionService {
  async dispatchOffer(channelId: string, offer: ChannelMessage): Promise<ChannelDeliveryResult> {
    console.log(`[RobotEngine:7-Distribution] Dispatching to channel ${channelId}`);
    return {
      success: true,
      messageId: `dispatch_${Date.now()}`,
      sentAt: new Date(),
    };
  }
}

// 8. TRACKING STAGE
export class TrackingEngineService implements TrackingService {
  async recordClick(linkId: string, metadata?: Record<string, unknown>): Promise<void> {
    console.log(`[RobotEngine:8-Tracking] Click recorded on link ${linkId}`, metadata);
  }

  async recordConversion(linkId: string, amount: number): Promise<void> {
    console.log(`[RobotEngine:8-Tracking] Conversion registered: R$ ${amount} on link ${linkId}`);
  }
}

// 9. LEARNING STAGE
export class LearningEngineService implements LearningService {
  async processPerformanceData(userId: string): Promise<LearningFeedback[]> {
    console.log(`[RobotEngine:9-Learning] Learning from conversion patterns for user ${userId}`);
    return [
      {
        productId: "prod-1",
        clicks: 1420,
        conversions: 84,
        conversionRate: 0.059,
        suggestedAdjustments: {
          categoryWeightBoost: 1.2,
          idealPostingHour: 20, // 8 PM
        },
      },
    ];
  }
}

/**
 * Robot Engine Orchestrator
 * Coordinates the full cycle
 */
export class RobotEngine {
  constructor(
    public readonly discovery = new DiscoveryEngineService(),
    public readonly analysis = new AnalysisEngineService(),
    public readonly scoring = new ScoringEngineService(),
    public readonly link = new LinkEngineService(),
    public readonly copy = new AICopyEngineService(),
    public readonly queue = new QueueEngineService(),
    public readonly distribution = new DistributionEngineService(),
    public readonly tracking = new TrackingEngineService(),
    public readonly learning = new LearningEngineService()
  ) {}

  /**
   * Executes a full autonomous cycle for a given user
   */
  async runCycle(userId: string, options: DiscoveryOptions) {
    // 1. Discover
    const products = await this.discovery.discoverOpportunities(options);

    const processedOpportunities = [];

    for (const product of products.slice(0, 3)) {
      // 2. Analyze
      const analysis = await this.analysis.analyzeProduct(product);

      // 3. Score
      const scoreResult = await this.scoring.calculateScore(product, analysis);

      if (scoreResult.score >= 80) {
        // 4. Link
        const affiliateUrl = await this.link.generateLink(userId, product.id, product.productUrl);

        // 5. AI Copy
        const copy = await this.copy.generateCopy(product, affiliateUrl);

        processedOpportunities.push({
          product,
          analysis,
          scoreResult,
          affiliateUrl,
          copy,
        });
      }
    }

    return {
      timestamp: new Date(),
      totalScanned: products.length,
      qualifiedOpportunities: processedOpportunities.length,
      opportunities: processedOpportunities,
    };
  }
}

export const robotEngine = new RobotEngine();
