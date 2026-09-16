/**
 * Affiliate Domain Types & Interfaces
 */

export type AffiliateLinkStatus =
  | "PENDING"
  | "GENERATING"
  | "GENERATED"
  | "FAILED"
  | "EXPIRED";

export type AffiliateDataSource = "mock" | "official_api" | "real";

export interface UtmTrackingConfig {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  userId?: string;
  opportunityId?: string;
  offerId?: string;
  extraParams?: Record<string, string>;
}

export interface AffiliateLinkInput {
  userId: string;
  productId: string;
  opportunityId?: string;
  platform: string;
  externalProductId?: string;
  originalUrl: string;
  customCampaign?: string;
  customMedium?: string;
  customSource?: string;
}

export interface GeneratedAffiliateLinkResult {
  success: boolean;
  url: string | null;
  shortCode: string;
  platform: string;
  externalProductId: string;
  source: AffiliateDataSource;
  generatedAt: Date;
  tracking: UtmTrackingConfig;
  error?: string;
}

export interface IAffiliateLinkAdapter {
  readonly platform: string;
  generateLink(
    originalUrl: string,
    externalProductId: string,
    tracking: UtmTrackingConfig
  ): Promise<GeneratedAffiliateLinkResult>;
}
