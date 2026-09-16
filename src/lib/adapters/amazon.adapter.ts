import {
  MarketplaceAdapter,
  MarketplaceCredentials,
  ConnectionResult,
  ProductSearchParams,
  MarketplaceProduct,
} from "../contracts/marketplace";
import { MOCK_MARKETPLACE_CATALOG } from "../mock/marketplace-data";
import { RawMarketplaceItem } from "@/domain/products/types";

export class AmazonAdapter implements MarketplaceAdapter {
  readonly platformName = "Amazon";
  readonly platformId = "AMAZON";
  private isConnected = true;

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    return {
      success: true,
      message: "Conexão com Amazon (Mock Provider) estabelecida.",
      status: "CONNECTED",
      connectedAt: new Date(),
    };
  }

  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    return true;
  }

  async getStatus(): Promise<ConnectionResult> {
    return {
      success: this.isConnected,
      message: this.isConnected
        ? "Amazon Mock Provider ativo."
        : "Amazon desconectada.",
      status: this.isConnected ? "CONNECTED" : "DISCONNECTED",
    };
  }

  async getRawItems(params?: ProductSearchParams): Promise<RawMarketplaceItem[]> {
    let items = MOCK_MARKETPLACE_CATALOG.filter((p) => p.platform === "AMAZON");

    if (params?.category && params.category !== "ALL") {
      items = items.filter(
        (p) => p.category?.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return items;
  }

  async getProducts(params?: ProductSearchParams): Promise<MarketplaceProduct[]> {
    const rawItems = await this.getRawItems(params);
    return rawItems.map((item) => ({
      id: item.externalId,
      externalId: item.externalId,
      platform: "AMAZON",
      title: item.title,
      description: item.description || "",
      category: item.category || "Geral",
      imageUrl: item.imageUrl || "",
      originalPrice: item.originalPrice || item.price || 0,
      currentPrice: item.price || 0,
      discountPercent: item.discountPercentage || 0,
      commissionRate: item.commissionRate || 0.1,
      commissionAmount: item.commissionAmount || 0,
      rating: item.rating || 4.7,
      salesCount: item.salesCount || 0,
      trendScore: item.trendIndicator || 88,
      opportunityScore: 90,
      productUrl: item.productUrl,
      inStock: item.inStock !== false,
      tags: ["Amazon", "Prime", "Mock Data"],
    }));
  }

  async getProduct(productIdOrUrl: string): Promise<MarketplaceProduct | null> {
    const products = await this.getProducts();
    return (
      products.find(
        (p) => p.id === productIdOrUrl || p.externalId === productIdOrUrl
      ) || null
    );
  }

  async generateAffiliateLink(productUrl: string, customParams?: Record<string, string>): Promise<string> {
    const cleanId = productUrl.split("/").pop() || "asin";
    const tag = customParams?.tag || "affiliateai-20";
    return `https://affiliateai.app/l/amz-${cleanId}?tag=${tag}`;
  }

  async getCommission(productId: string, price: number): Promise<{ rate: number; amount: number }> {
    const rate = 0.1;
    return {
      rate,
      amount: Number((price * rate).toFixed(2)),
    };
  }

  async searchTrendingProducts(category?: string, limit: number = 10): Promise<MarketplaceProduct[]> {
    const products = await this.getProducts({ category });
    return products.sort((a, b) => b.trendScore - a.trendScore).slice(0, limit);
  }
}
