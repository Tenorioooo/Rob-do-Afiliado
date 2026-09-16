export type OpportunitySortOption =
  | "score_desc"
  | "commission_desc"
  | "discount_desc"
  | "recent_desc"
  | "rating_desc"
  | "price_asc"
  | "price_desc";

export interface RankedOpportunityItem {
  id: string;
  score: number;
  confidence: string;
  reasons: string[];
  product: {
    id: string;
    externalId: string;
    platform: string;
    title: string;
    imageUrl: string;
    currentPrice: number;
    originalPrice: number;
    discountPercent: number;
    commissionRate: number;
    commissionAmount: number;
    rating: number | null;
    salesCount: number;
    trendScore: number | null;
    category: string;
    url: string;
    dataSource: string;
    createdAt: Date;
  };
  detectedAt: Date;
}

export class OpportunityRankingService {
  /**
   * Sorts an in-memory list of opportunity records according to sort option
   */
  static rank(
    items: RankedOpportunityItem[],
    sortBy: OpportunitySortOption = "score_desc"
  ): RankedOpportunityItem[] {
    const list = [...items];

    switch (sortBy) {
      case "commission_desc":
        return list.sort((a, b) => b.product.commissionAmount - a.product.commissionAmount);
      case "discount_desc":
        return list.sort((a, b) => b.product.discountPercent - a.product.discountPercent);
      case "recent_desc":
        return list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
      case "rating_desc":
        return list.sort((a, b) => (b.product.rating || 0) - (a.product.rating || 0));
      case "price_asc":
        return list.sort((a, b) => a.product.currentPrice - b.product.currentPrice);
      case "price_desc":
        return list.sort((a, b) => b.product.currentPrice - a.product.currentPrice);
      case "score_desc":
      default:
        return list.sort((a, b) => b.score - a.score);
    }
  }
}
