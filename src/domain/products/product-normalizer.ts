import { RawMarketplaceItem, NormalizedProduct, MarketplacePlatform } from "./types";

export class ProductNormalizer {
  /**
   * Normalizes a raw marketplace product item into our internal canonical NormalizedProduct
   */
  static normalize(raw: RawMarketplaceItem): NormalizedProduct {
    const externalId = String(raw.externalId || "").trim();
    const platform: MarketplacePlatform = raw.platform || "CUSTOM";
    const title = String(raw.title || "Produto sem título").trim();
    const description = String(raw.description || "").trim();
    const category = String(raw.category || "Geral").trim();
    const subcategory = raw.subcategory ? String(raw.subcategory).trim() : null;
    const brand = raw.brand ? String(raw.brand).trim() : null;
    const imageUrl = String(
      raw.imageUrl ||
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60"
    ).trim();
    const url = String(raw.productUrl || "").trim();
    const currency = String(raw.currency || "BRL").toUpperCase();
    const inStock = raw.inStock !== false;

    // Price Normalization
    const currentPrice = typeof raw.price === "number" && raw.price > 0 ? Number(raw.price.toFixed(2)) : 0.01;
    let originalPrice =
      typeof raw.originalPrice === "number" && raw.originalPrice >= currentPrice
        ? Number(raw.originalPrice.toFixed(2))
        : currentPrice;

    // Discount Calculation
    let discountPercent = 0;
    if (typeof raw.discountPercentage === "number" && raw.discountPercentage > 0) {
      discountPercent = Math.min(Math.round(raw.discountPercentage), 99);
      if (originalPrice === currentPrice && discountPercent > 0) {
        originalPrice = Number((currentPrice / (1 - discountPercent / 100)).toFixed(2));
      }
    } else if (originalPrice > currentPrice) {
      discountPercent = Math.min(Math.round(((originalPrice - currentPrice) / originalPrice) * 100), 99);
    }

    // Rating & Reviews Normalization (handle nulls if missing)
    let rating: number | null = null;
    if (typeof raw.rating === "number" && raw.rating >= 0 && raw.rating <= 5) {
      rating = Number(raw.rating.toFixed(1));
    }

    let reviewCount: number | null = null;
    if (typeof raw.reviewCount === "number" && raw.reviewCount >= 0) {
      reviewCount = Math.floor(raw.reviewCount);
    }

    const salesCount = typeof raw.salesCount === "number" && raw.salesCount >= 0 ? Math.floor(raw.salesCount) : 0;

    // Trend Indicator
    let trendScore: number | null = null;
    if (typeof raw.trendIndicator === "number" && raw.trendIndicator >= 0 && raw.trendIndicator <= 100) {
      trendScore = Math.round(raw.trendIndicator);
    }

    // Commission Normalization
    const isOfficialApi = (raw as any).dataSource === "official_api";
    let commissionRate = 0.08; // default 8% for mock
    let isCommissionKnown = true;

    if (typeof raw.commissionRate === "number" && raw.commissionRate >= 0 && raw.commissionRate <= 1) {
      commissionRate = Number(raw.commissionRate.toFixed(4));
    } else if (isOfficialApi && platform === "MERCADO_LIVRE") {
      commissionRate = 0;
      isCommissionKnown = false;
    } else if (platform === "SHOPEE") {
      commissionRate = 0.14;
    } else if (platform === "MERCADO_LIVRE") {
      commissionRate = 0.09;
    } else if (platform === "AMAZON") {
      commissionRate = 0.1;
    }

    let commissionAmount = isCommissionKnown ? Number((currentPrice * commissionRate).toFixed(2)) : 0;
    if (typeof raw.commissionAmount === "number" && raw.commissionAmount >= 0) {
      commissionAmount = Number(raw.commissionAmount.toFixed(2));
      isCommissionKnown = true;
    }

    // Assess completeness & data transparency
    const availableFields: string[] = ["title", "currentPrice", "originalPrice", "category", "url"];
    const missingFields: string[] = [];

    if (rating !== null) availableFields.push("rating");
    else missingFields.push("rating");

    if (reviewCount !== null) availableFields.push("reviewCount");
    else missingFields.push("reviewCount");

    if (trendScore !== null) availableFields.push("trendScore");
    else missingFields.push("trendScore");

    if (brand !== null) availableFields.push("brand");
    if (subcategory !== null) availableFields.push("subcategory");

    const isDataComplete = missingFields.length === 0;

    const sourceMetadata = {
      ...(raw.rawMetadata || {}),
      commissionStatus: isCommissionKnown ? "KNOWN" : "UNKNOWN",
    };

    return {
      externalId,
      platform,
      title,
      description,
      category,
      subcategory,
      brand,
      imageUrl,
      originalPrice,
      currentPrice,
      currency,
      discountPercent,
      commissionRate,
      commissionAmount,
      rating,
      reviewCount,
      salesCount,
      trendScore,
      url,
      inStock,
      dataSource: (raw as any).dataSource || "mock",
      sourceMetadata,
      isDataComplete,
      availableFields,
      missingFields,
    };
  }

  /**
   * Normalizes a batch of items
   */
  static normalizeBatch(rawItems: RawMarketplaceItem[]): NormalizedProduct[] {
    return rawItems.map((item) => this.normalize(item));
  }
}
