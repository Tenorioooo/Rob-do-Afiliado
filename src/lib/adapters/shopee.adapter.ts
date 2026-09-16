import {
  MarketplaceAdapter,
  MarketplaceCredentials,
  ConnectionResult,
  ProductSearchParams,
  MarketplaceProduct,
} from "../contracts/marketplace";
import { MOCK_MARKETPLACE_CATALOG } from "../mock/marketplace-data";
import { RawMarketplaceItem } from "@/domain/products/types";

export class ShopeeAdapter implements MarketplaceAdapter {
  readonly platformName = "Shopee";
  readonly platformId = "SHOPEE";
  private isConnected = true; // In mock mode, enabled by default for tests

  async connect(credentials: MarketplaceCredentials): Promise<ConnectionResult> {
    return {
      success: true,
      message: "Conexão com Shopee (Mock Provider) estabelecida com sucesso.",
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
        ? "Shopee Mock Provider ativo e pronto para varreduras."
        : "Shopee desconectada.",
      status: this.isConnected ? "CONNECTED" : "DISCONNECTED",
    };
  }

  /**
   * Fetches raw marketplace items matching filter criteria
   */
  async getRawItems(params?: ProductSearchParams): Promise<RawMarketplaceItem[]> {
    let items = MOCK_MARKETPLACE_CATALOG.filter((p) => p.platform === "SHOPEE");

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
      platform: "SHOPEE",
      title: item.title,
      description: item.description || "",
      category: item.category || "Geral",
      imageUrl: item.imageUrl || "",
      originalPrice: item.originalPrice || item.price || 0,
      currentPrice: item.price || 0,
      discountPercent: item.discountPercentage || 0,
      commissionRate: item.commissionRate || 0.14,
      commissionAmount: item.commissionAmount || 0,
      rating: item.rating || 4.5,
      salesCount: item.salesCount || 0,
      trendScore: item.trendIndicator || 80,
      opportunityScore: 85,
      productUrl: item.productUrl,
      inStock: item.inStock !== false,
      tags: ["Shopee", "Mock Data"],
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
    const cleanId = productUrl.split("/").pop() || "item";
    const sub = customParams?.sub_id ? `&sub_id=${customParams.sub_id}` : "";
    return `https://affiliateai.app/l/shp-${cleanId}?source=affiliate_ai${sub}`;
  }

  async getCommission(productId: string, price: number): Promise<{ rate: number; amount: number }> {
    const rate = 0.14;
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
