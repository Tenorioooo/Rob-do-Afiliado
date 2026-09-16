import { OfferStyle } from "@/domain/offers/types";
import { MarketplacePlatform } from "@/domain/products/types";
import { ChannelType } from "@/domain/channels/types";

export type AnalyticsEventType =
  | "CLICK"
  | "CONVERSION"
  | "COMMISSION"
  | "REFUND"
  | "CANCELLATION"
  | "PUBLICATION";

export type EventSource = "mock" | "real";

export type ConversionStatus = "PENDING" | "APPROVED" | "CANCELLED" | "REFUNDED";

export type CommissionStatus = "ESTIMATED" | "CONFIRMED" | "CANCELLED";

export type LearningSignalType =
  | "BEST_CHANNEL"
  | "BEST_COPY_STYLE"
  | "BEST_TIME_SLOT"
  | "BEST_PLATFORM"
  | "BEST_CATEGORY"
  | "PRICE_DROP_PERFORMING"
  | "HIGH_COMMISSION_PERFORMING";

export type SignalConfidence = "WEAK" | "RELIABLE" | "STRONG";

export type ProductPerformanceClassification = "WINNER" | "NEUTRAL" | "UNDERPERFORMER";

export interface ClickEventInput {
  userId: string;
  affiliateLinkId: string;
  offerId?: string | null;
  publicationId?: string | null;
  channelId?: string | null;
  platform?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  source?: EventSource;
  metadata?: Record<string, any>;
}

export interface ConversionEventInput {
  userId: string;
  affiliateLinkId?: string | null;
  offerId?: string | null;
  publicationId?: string | null;
  channelId?: string | null;
  platform: MarketplacePlatform | string;
  externalOrderId?: string | null;
  orderValue: number;
  commissionValue: number;
  currency?: string;
  status?: ConversionStatus;
  source?: EventSource;
  occurredAt?: Date;
  metadata?: Record<string, any>;
}

export interface AttributionHierarchy {
  conversionId?: string;
  affiliateLinkId: string | null;
  offerId: string | null;
  publicationId: string | null;
  channelId: string | null;
  opportunityId: string | null;
  productId: string | null;
  platform: string | null;
  resolvedAt: Date;
  completenessLevel: "FULL" | "PARTIAL" | "MINIMAL";
  attributionPath: string[];
}

export interface EntityPerformanceSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // percentage (0 - 100)
  conversionRate: number; // percentage (0 - 100)
  revenue: number;
  estimatedCommission: number;
  confirmedCommission: number;
  cancelledCommission: number;
  performanceScore: number; // 0 - 100
  roi: number | null; // null if cost unavailable
  sampleSize: number;
  confidence: SignalConfidence;
}

export interface ChannelPerformance {
  channelId: string;
  name: string;
  type: ChannelType | string;
  metrics: EntityPerformanceSummary;
  scoreBreakdown: {
    ctrScore: number;
    conversionScore: number;
    commissionScore: number;
    consistencyScore: number;
  };
}

export interface OfferPerformance {
  offerId: string;
  title: string;
  style: OfferStyle | string;
  platform: string;
  metrics: EntityPerformanceSummary;
  analysisReason: string;
}

export interface CopyStylePerformance {
  style: OfferStyle | string;
  offersCount: number;
  publicationsCount: number;
  metrics: EntityPerformanceSummary;
  rank: number | null;
}

export interface PlatformPerformance {
  platform: MarketplacePlatform | string;
  productsCount: number;
  offersCount: number;
  publicationsCount: number;
  metrics: EntityPerformanceSummary;
}

export interface ProductPerformance {
  productId: string;
  title: string;
  category: string;
  platform: string;
  opportunityScore: number;
  metrics: EntityPerformanceSummary;
  classification: ProductPerformanceClassification;
  reason: string;
}

export interface TimeSlotPerformance {
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  hourSlot: string; // e.g. "20:00-21:00"
  clicks: number;
  conversions: number;
  conversionRate: number;
  commission: number;
  performanceScore: number;
  hasSufficientData: boolean;
}

export interface LearningSignalData {
  id?: string;
  userId: string;
  signalType: LearningSignalType;
  targetEntity: string;
  score: number;
  confidence: SignalConfidence;
  sampleSize: number;
  reason: string;
  metadata?: Record<string, any>;
  active?: boolean;
}

export interface ExperimentVariantInput {
  style: OfferStyle;
  trafficWeight?: number;
}

export interface CreateExperimentInput {
  userId: string;
  name: string;
  description?: string;
  targetMetric?: "CTR" | "CONVERSION_RATE" | "COMMISSION";
  cooldownHours?: number;
  maxExposure?: number;
  variants: ExperimentVariantInput[];
}
