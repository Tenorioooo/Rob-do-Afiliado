import { ShopeeAdapter } from "@/lib/adapters/shopee.adapter";
import { MercadoLivreAdapter } from "@/lib/adapters/mercadolivre.adapter";
import { AmazonAdapter } from "@/lib/adapters/amazon.adapter";
import { ProductNormalizer } from "@/domain/products/product-normalizer";
import { NormalizedProduct, RawMarketplaceItem, MarketplacePlatform } from "@/domain/products/types";

export interface DiscoveryParams {
  platforms?: MarketplacePlatform[];
  categories?: string[];
  maxPerPlatform?: number;
}

export interface DiscoveryResult {
  products: NormalizedProduct[];
  errors: { platform: string; error: string }[];
  scannedPlatforms: string[];
}

export class DiscoveryService {
  private shopeeAdapter = new ShopeeAdapter();
  private mlAdapter = new MercadoLivreAdapter();
  private amazonAdapter = new AmazonAdapter();

  /**
   * Executes discovery across enabled marketplace adapters safely
   */
  async discoverAll(params?: DiscoveryParams): Promise<DiscoveryResult> {
    const targetPlatforms = params?.platforms || ["SHOPEE", "MERCADO_LIVRE", "AMAZON"];
    const allRawItems: RawMarketplaceItem[] = [];
    const errors: { platform: string; error: string }[] = [];
    const scannedPlatforms: string[] = [];

    // 1. Shopee
    if (targetPlatforms.includes("SHOPEE")) {
      try {
        scannedPlatforms.push("SHOPEE");
        const items = await this.shopeeAdapter.getRawItems();
        allRawItems.push(...items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido na Shopee";
        errors.push({ platform: "SHOPEE", error: msg });
      }
    }

    // 2. Mercado Livre
    if (targetPlatforms.includes("MERCADO_LIVRE")) {
      try {
        scannedPlatforms.push("MERCADO_LIVRE");
        const items = await this.mlAdapter.getRawItems();
        allRawItems.push(...items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido no Mercado Livre";
        errors.push({ platform: "MERCADO_LIVRE", error: msg });
      }
    }

    // 3. Amazon
    if (targetPlatforms.includes("AMAZON")) {
      try {
        scannedPlatforms.push("AMAZON");
        const items = await this.amazonAdapter.getRawItems();
        allRawItems.push(...items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido na Amazon";
        errors.push({ platform: "AMAZON", error: msg });
      }
    }

    // Filter by categories if specified
    let filteredRaw = allRawItems;
    if (params?.categories && params.categories.length > 0) {
      const allowedCategories = params.categories.map((c) => c.toLowerCase());
      filteredRaw = allRawItems.filter(
        (item) => item.category && allowedCategories.includes(item.category.toLowerCase())
      );
      // Fallback if none matched
      if (filteredRaw.length === 0) {
        filteredRaw = allRawItems;
      }
    }

    // Normalize all products
    const normalizedProducts = ProductNormalizer.normalizeBatch(filteredRaw);

    return {
      products: normalizedProducts,
      errors,
      scannedPlatforms,
    };
  }
}

export const discoveryService = new DiscoveryService();
