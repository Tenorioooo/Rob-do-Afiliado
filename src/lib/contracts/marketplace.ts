/**
 * Marketplace Adapter Contract
 * Defines standard operations for all external marketplace integrations
 * (Shopee, Mercado Livre, Amazon, Magalu, AliExpress, etc.)
 */

export interface MarketplaceProduct {
  id: string;
  externalId: string;
  platform: "SHOPEE" | "MERCADO_LIVRE" | "AMAZON" | "MAGALU" | "ALIEXPRESS" | "CUSTOM";
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  commissionRate: number; // e.g. 0.12 (12%)
  commissionAmount: number; // in BRL
  rating: number; // 0 to 5
  salesCount: number;
  trendScore: number; // 0 to 100
  opportunityScore: number; // 0 to 100
  productUrl: string;
  affiliateUrl?: string;
  inStock: boolean;
  tags: string[];
  opportunityReasons?: string[];
}

export interface MarketplaceCredentials {
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  affiliateId?: string;
  tagId?: string;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "PENDING";
  connectedAt?: Date;
  expiresAt?: Date;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  minCommission?: number;
  limit?: number;
  page?: number;
}

export interface MarketplaceAdapter {
  readonly platformName: string;
  readonly platformId: string;

  /**
   * Connects/Authenticates to the marketplace with credentials
   */
  connect(credentials: MarketplaceCredentials): Promise<ConnectionResult>;

  /**
   * Disconnects and invalidates existing connection tokens
   */
  disconnect(): Promise<boolean>;

  /**
   * Returns health and connection status of integration
   */
  getStatus(): Promise<ConnectionResult>;

  /**
   * Fetches multiple products matching filter criteria
   */
  getProducts(params?: ProductSearchParams): Promise<MarketplaceProduct[]>;

  /**
   * Fetches single product details by its marketplace ID or URL
   */
  getProduct(productIdOrUrl: string): Promise<MarketplaceProduct | null>;

  /**
   * Converts a standard product link into a trackable affiliate link
   */
  generateAffiliateLink(productUrl: string, customParams?: Record<string, string>): Promise<string>;

  /**
   * Calculates current commission for product
   */
  getCommission(productId: string, price: number): Promise<{ rate: number; amount: number }>;

  /**
   * Identifies trending and viral items currently gaining momentum
   */
  searchTrendingProducts(category?: string, limit?: number): Promise<MarketplaceProduct[]>;
}
