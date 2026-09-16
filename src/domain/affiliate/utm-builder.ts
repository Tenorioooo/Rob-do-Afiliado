import { UtmTrackingConfig } from "./types";

/**
 * Builds or enriches a URL with UTM tracking and affiliate parameters.
 * Validates the base URL, preserves existing query params, and prevents duplicates.
 */
export function buildAffiliateTrackingUrl(
  baseUrl: string,
  config: UtmTrackingConfig
): string {
  try {
    // Normalize url if protocol is missing
    let normalized = baseUrl.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }

    const parsedUrl = new URL(normalized);

    // Set standard UTM parameters if provided
    if (config.utmSource) {
      parsedUrl.searchParams.set("utm_source", config.utmSource);
    }
    if (config.utmMedium) {
      parsedUrl.searchParams.set("utm_medium", config.utmMedium);
    }
    if (config.utmCampaign) {
      parsedUrl.searchParams.set("utm_campaign", config.utmCampaign);
    }
    if (config.utmContent) {
      parsedUrl.searchParams.set("utm_content", config.utmContent);
    }

    // Set internal tracking attributes
    if (config.userId) {
      parsedUrl.searchParams.set("aff_uid", config.userId);
    }
    if (config.opportunityId) {
      parsedUrl.searchParams.set("aff_opp", config.opportunityId);
    }
    if (config.offerId) {
      parsedUrl.searchParams.set("aff_off", config.offerId);
    }

    // Add extra params without overriding
    if (config.extraParams) {
      for (const [key, value] of Object.entries(config.extraParams)) {
        if (value && !parsedUrl.searchParams.has(key)) {
          parsedUrl.searchParams.set(key, value);
        }
      }
    }

    return parsedUrl.toString();
  } catch (err) {
    // Fallback if URL parsing failed
    console.error("[UtmBuilder:Error] Invalid URL:", baseUrl, err);
    return baseUrl;
  }
}
