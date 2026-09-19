import { IAffiliateLinkAdapter, GeneratedAffiliateLinkResult, UtmTrackingConfig } from "./types";
import { buildAffiliateTrackingUrl } from "./utm-builder";

function generateDeterministicShortCode(platform: string, externalId: string): string {
  const cleanId = externalId.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  const prefix = platform.toLowerCase().slice(0, 3);
  return `${prefix}-${cleanId}`;
}

export class ShopeeAffiliateAdapter implements IAffiliateLinkAdapter {
  readonly platform = "SHOPEE";

  async generateLink(
    originalUrl: string,
    externalProductId: string,
    tracking: UtmTrackingConfig
  ): Promise<GeneratedAffiliateLinkResult> {
    const shortCode = generateDeterministicShortCode("shopee", externalProductId || "prod");
    const baseUrl = originalUrl && originalUrl.startsWith("http")
      ? originalUrl
      : `https://shopee.com.br/product/${externalProductId}`;

    const finalUrl = buildAffiliateTrackingUrl(baseUrl, {
      ...tracking,
      utmSource: tracking.utmSource || "shopee_affiliate",
      utmMedium: tracking.utmMedium || "affiliate_ai_robot",
      utmCampaign: tracking.utmCampaign || "promo_radar",
      extraParams: {
        platform: "SHOPEE",
        ext_pid: externalProductId,
      },
    });

    return {
      success: true,
      url: finalUrl,
      shortCode,
      platform: this.platform,
      externalProductId,
      source: "real",
      generatedAt: new Date(),
      tracking,
    };
  }
}

export class MercadoLivreAffiliateAdapter implements IAffiliateLinkAdapter {
  readonly platform = "MERCADO_LIVRE";

  async generateLink(
    originalUrl: string,
    externalProductId: string,
    tracking: UtmTrackingConfig
  ): Promise<GeneratedAffiliateLinkResult> {
    const shortCode = generateDeterministicShortCode("ml", externalProductId || "prod");
    const baseUrl = originalUrl && originalUrl.startsWith("http")
      ? originalUrl
      : `https://www.mercadolivre.com.br/p/${externalProductId}`;

    const finalUrl = buildAffiliateTrackingUrl(baseUrl, {
      ...tracking,
      utmSource: tracking.utmSource || "mercadolivre_affiliate",
      utmMedium: tracking.utmMedium || "affiliate_ai_robot",
      utmCampaign: tracking.utmCampaign || "radar_deals",
      extraParams: {
        platform: "MERCADO_LIVRE",
        ext_pid: externalProductId,
      },
    });

    return {
      success: true,
      url: finalUrl,
      shortCode,
      platform: this.platform,
      externalProductId,
      source: "real",
      generatedAt: new Date(),
      tracking,
    };
  }
}

export class AmazonAffiliateAdapter implements IAffiliateLinkAdapter {
  readonly platform = "AMAZON";

  async generateLink(
    originalUrl: string,
    externalProductId: string,
    tracking: UtmTrackingConfig
  ): Promise<GeneratedAffiliateLinkResult> {
    const shortCode = generateDeterministicShortCode("amz", externalProductId || "prod");
    const baseUrl = originalUrl && originalUrl.startsWith("http")
      ? originalUrl
      : `https://www.amazon.com.br/dp/${externalProductId}`;

    const finalUrl = buildAffiliateTrackingUrl(baseUrl, {
      ...tracking,
      utmSource: tracking.utmSource || "amazon_associates",
      utmMedium: tracking.utmMedium || "affiliate_ai_robot",
      utmCampaign: tracking.utmCampaign || "amazon_radar",
      extraParams: {
        tag: "affiliateai-20",
        platform: "AMAZON",
        ext_pid: externalProductId,
      },
    });

    return {
      success: true,
      url: finalUrl,
      shortCode,
      platform: this.platform,
      externalProductId,
      source: "real",
      generatedAt: new Date(),
      tracking,
    };
  }
}

export class GenericAffiliateAdapter implements IAffiliateLinkAdapter {
  readonly platform = "GENERIC";

  async generateLink(
    originalUrl: string,
    externalProductId: string,
    tracking: UtmTrackingConfig
  ): Promise<GeneratedAffiliateLinkResult> {
    const shortCode = generateDeterministicShortCode("aff", externalProductId || "prod");
    const baseUrl = originalUrl && originalUrl.startsWith("http")
      ? originalUrl
      : `https://affiliateai.app/l/${shortCode}`;

    const finalUrl = buildAffiliateTrackingUrl(baseUrl, {
      ...tracking,
      utmSource: tracking.utmSource || "affiliate_ai",
      utmMedium: tracking.utmMedium || "generic_link",
      utmCampaign: tracking.utmCampaign || "default",
    });

    return {
      success: true,
      url: finalUrl,
      shortCode,
      platform: this.platform,
      externalProductId: externalProductId || "generic",
      source: "real",
      generatedAt: new Date(),
      tracking,
    };
  }
}

export function getAffiliateAdapter(platform: string): IAffiliateLinkAdapter {
  const norm = platform.toUpperCase().replace(/\s+/g, "_");
  switch (norm) {
    case "SHOPEE":
      return new ShopeeAffiliateAdapter();
    case "MERCADO_LIVRE":
    case "MERCADOLIVRE":
      return new MercadoLivreAffiliateAdapter();
    case "AMAZON":
      return new AmazonAffiliateAdapter();
    default:
      return new GenericAffiliateAdapter();
  }
}
