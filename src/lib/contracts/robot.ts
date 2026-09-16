/**
 * Robot Engine Pipeline Contracts
 * Defines the 9-stage autonomous workflow:
 * 1. DISCOVERY
 * 2. ANALYSIS
 * 3. SCORING
 * 4. AFFILIATE LINK
 * 5. AI COPY
 * 6. QUEUE
 * 7. DISTRIBUTION
 * 8. TRACKING
 * 9. LEARNING
 */

import { MarketplaceProduct } from "./marketplace";
import { ChannelMessage, ChannelDeliveryResult } from "./channel";

export interface DiscoveryOptions {
  platforms: string[];
  categories: string[];
  maxItemsPerPlatform?: number;
  minSales?: number;
}

export interface AnalysisMetrics {
  productId: string;
  priceVolatility: number;
  demandIndex: number;
  sellerReputation: number;
  reviewSentimentScore: number;
  marginViability: boolean;
  recommendationReasons: string[];
}

export interface OpportunityScoreResult {
  productId: string;
  score: number; // 0 - 100
  breakdown: {
    discountWeight: number;
    commissionWeight: number;
    trendWeight: number;
    ratingWeight: number;
    volumeWeight: number;
  };
  tier: "HOT" | "HIGH_POTENTIAL" | "MODERATE" | "LOW";
}

export interface GeneratedOfferCopy {
  productId: string;
  headline: string;
  body: string;
  callToAction: string;
  hook: string;
  emojis: string[];
  fullText: string;
}

export interface DistributionJob {
  id: string;
  offerId: string;
  channels: string[];
  scheduledTime: Date;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
}

export interface LearningFeedback {
  productId: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  suggestedAdjustments: {
    categoryWeightBoost?: number;
    idealPostingHour?: number;
  };
}

// 1. Stage: Discovery
export interface ProductDiscoveryService {
  discoverOpportunities(options: DiscoveryOptions): Promise<MarketplaceProduct[]>;
}

// 2. Stage: Analysis
export interface ProductAnalysisService {
  analyzeProduct(product: MarketplaceProduct): Promise<AnalysisMetrics>;
}

// 3. Stage: Scoring
export interface OpportunityScoringService {
  calculateScore(product: MarketplaceProduct, analysis: AnalysisMetrics): Promise<OpportunityScoreResult>;
}

// 4. Stage: Affiliate Link
export interface AffiliateLinkService {
  generateLink(userId: string, productId: string, originalUrl: string): Promise<string>;
}

// 5. Stage: AI Copy
export interface OfferGenerationService {
  generateCopy(product: MarketplaceProduct, affiliateUrl: string): Promise<GeneratedOfferCopy>;
}

// 6. Stage: Queue
export interface QueueService {
  enqueueOffer(job: DistributionJob): Promise<{ jobId: string; status: string }>;
}

// 7. Stage: Distribution
export interface DistributionService {
  dispatchOffer(channelId: string, offer: ChannelMessage): Promise<ChannelDeliveryResult>;
}

// 8. Stage: Tracking
export interface TrackingService {
  recordClick(linkId: string, metadata?: Record<string, unknown>): Promise<void>;
  recordConversion(linkId: string, amount: number): Promise<void>;
}

// 9. Stage: Learning
export interface LearningService {
  processPerformanceData(userId: string): Promise<LearningFeedback[]>;
}
