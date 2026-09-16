import { MarketplacePlatform } from "@/domain/products/types";
import { OfferStyle } from "@/domain/offers/types";

export type AutomationMode = "MANUAL" | "ASSISTED" | "AUTOPILOT";
export type AutopilotRunStatus = "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED";
export type PriceSignalType = "PRICE_DROP" | "PRICE_INCREASE" | "NO_CHANGE";
export type ChannelBalancingStrategy = "ALL" | "ROUND_ROBIN" | "PRIORITY";

export interface AutopilotConfigData {
  id?: string;
  userId: string;
  enabled: boolean;
  automationMode: AutomationMode;
  scanIntervalMinutes: number;
  minOpportunityScore: number;
  minCommission: number;
  minDiscount: number;
  maxPrice: number | null;
  maxOffersPerDay: number;
  maxOpportunitiesPerCycle: number;
  maxProductsPerCycle: number;
  minPublicationInterval: number;
  autoGenerateOffers: boolean;
  autoApproveOffers: boolean;
  autoPublish: boolean;
  duplicateCooldownHours: number;
  preferredPlatforms: MarketplacePlatform[];
  preferredCategories: string[];
  preferredOfferStyles: OfferStyle[];
  channelBalancingStrategy: ChannelBalancingStrategy;
  isLocked?: boolean;
  lockedAt?: Date | null;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
}

export interface PriceSignalResult {
  signal: PriceSignalType;
  previousPrice: number | null;
  currentPrice: number;
  priceDelta: number;
  percentChange: number;
  isSignificantDrop: boolean;
}

export interface OpportunityDecisionAudit {
  productId: string;
  externalId: string;
  productTitle: string;
  platform: string;
  category: string;
  currentPrice: number;
  score: number;
  isQualified: boolean;
  qualificationReasons: string[];
  rejectionReasons: string[];
  priceSignal: PriceSignalResult;
  offerGenerated?: boolean;
  offerId?: string;
  offerValidationStatus?: "VALID" | "WARNING" | "REJECTED";
  approved?: boolean;
  safetyGatePassed?: boolean;
  safetyGateReasons?: string[];
  publicationsQueued?: number;
  learningSignalsApplied?: string[];
  recommendationReason?: string;
}

export interface AutopilotCycleSummary {
  runId: string;
  status: AutopilotRunStatus;
  startedAt: Date;
  finishedAt: Date;
  productsDiscovered: number;
  productsAnalyzed: number;
  opportunitiesCreated: number;
  opportunitiesQualified: number;
  opportunitiesRejected: number;
  offersGenerated: number;
  offersApproved: number;
  publicationsQueued: number;
  publicationsPublished: number;
  decisions: OpportunityDecisionAudit[];
  errors: { step: string; productId?: string; message: string }[];
}
