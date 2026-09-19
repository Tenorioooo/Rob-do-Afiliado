/**
 * Domain Types for Product Discovery, Normalization, Analysis and Scoring
 */

export type MarketplacePlatform =
  | "SHOPEE"
  | "MERCADO_LIVRE"
  | "AMAZON"
  | "MAGALU"
  | "ALIEXPRESS"
  | "CUSTOM";

export type ConfidenceLevel = "ALTA" | "MEDIA" | "BAIXA";

export type OpportunityStatus =
  | "DISCOVERED"
  | "ANALYZING"
  | "QUALIFIED"
  | "REJECTED"
  | "ARCHIVED";

export interface RawMarketplaceItem {
  id?: string;
  externalId: string;
  platform: MarketplacePlatform;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  discountPercentage?: number | null;
  currency?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  salesCount?: number | null;
  commissionRate?: number | null;
  commissionAmount?: number | null;
  trendIndicator?: number | null;
  productUrl: string;
  inStock?: boolean;
  dataSource?: string;
  rawMetadata?: Record<string, unknown>;
}

export interface NormalizedProduct {
  id?: string;
  externalId: string;
  platform: MarketplacePlatform;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  imageUrl: string;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  discountPercent: number;
  commissionRate: number; // e.g. 0.12 (12%)
  commissionAmount: number; // in BRL
  rating: number | null; // null if unavailable
  reviewCount: number | null; // null if unavailable
  salesCount: number;
  trendScore: number | null; // null if unavailable
  url: string;
  inStock: boolean;
  dataSource: "mock" | "api" | "official";
  sourceMetadata?: Record<string, unknown>;
  isDataComplete: boolean;
  availableFields: string[];
  missingFields: string[];
}

export interface ProductAnalysisIndicators {
  productId?: string;
  priceAttractiveness: number; // 0 - 100
  discountDepth: number; // 0 - 100
  commissionYield: number; // 0 - 100
  ratingQuality: number | null; // 0 - 100 or null
  reviewVolumeScore: number | null; // 0 - 100 or null
  trendStrength: number | null; // 0 - 100 or null
  freshnessScore: number; // 0 - 100
  recommendationReasons: string[];
  dataCompletenessRatio: number; // 0.0 to 1.0
}

export interface ScoreComponentResult {
  name: string;
  score: number; // 0 - 100
  weight: number; // raw weight %
  effectiveWeight: number; // adjusted weight % when some fields are missing
  weightedScore: number; // score * effectiveWeight / 100
  explanation: string;
  dataAvailable: boolean;
}

export interface OpportunityScoreCalculation {
  totalScore: number; // 0 - 100
  tier: "HOT" | "HIGH_POTENTIAL" | "MODERATE" | "LOW";
  confidence: ConfidenceLevel;
  dataCompleteness: number; // 0.0 - 1.0
  breakdown: {
    trend: ScoreComponentResult;
    discount: ScoreComponentResult;
    commission: ScoreComponentResult;
    ratingReviews: ScoreComponentResult;
    priceAttractiveness: ScoreComponentResult;
    freshness: ScoreComponentResult;
  };
  reasons: string[];
}

export interface ScanFilterOptions {
  platforms?: MarketplacePlatform[];
  categories?: string[];
  minScore?: number;
  minCommission?: number;
  maxPrice?: number;
  minDiscount?: number;
  maxResults?: number;
}
