import assert from "node:assert";
import { test, describe } from "node:test";
import { ProductNormalizer } from "../domain/products/product-normalizer";
import { ProductAnalysisService } from "../domain/products/product-analysis";
import { OpportunityScoringService } from "../domain/products/opportunity-score";
import { OpportunityRankingService, RankedOpportunityItem } from "../domain/products/opportunity-ranking";
import { RawMarketplaceItem } from "../domain/products/types";

describe("Phase 2 Domain Unit Tests", () => {
  // --- 1. NORMALIZATION TESTS ---
  describe("ProductNormalizer", () => {
    test("should correctly normalize a standard raw item with discount calculation", () => {
      const raw: RawMarketplaceItem = {
        externalId: "test-01",
        platform: "SHOPEE",
        title: "  Produto Teste Limpeza   ",
        price: 100.0,
        originalPrice: 200.0,
        productUrl: "https://shopee.com.br/item-1",
        category: "Eletrônicos",
      };

      const normalized = ProductNormalizer.normalize(raw);

      assert.strictEqual(normalized.externalId, "test-01");
      assert.strictEqual(normalized.platform, "SHOPEE");
      assert.strictEqual(normalized.title, "Produto Teste Limpeza");
      assert.strictEqual(normalized.currentPrice, 100.0);
      assert.strictEqual(normalized.originalPrice, 200.0);
      assert.strictEqual(normalized.discountPercent, 50);
      assert.strictEqual(normalized.commissionRate, 0.14); // Shopee default 14%
      assert.strictEqual(normalized.commissionAmount, 14.0);
      assert.strictEqual(normalized.dataSource, "mock");
      assert.strictEqual(normalized.rating, null); // missing
      assert.ok(normalized.missingFields.includes("rating"));
    });

    test("should handle edge case: zero/negative prices safely", () => {
      const raw: RawMarketplaceItem = {
        externalId: "test-zero",
        platform: "AMAZON",
        title: "Item Preco Zero",
        price: 0,
        productUrl: "https://amazon.com.br/item-zero",
      };

      const normalized = ProductNormalizer.normalize(raw);
      assert.ok(normalized.currentPrice > 0, "Price should fallback to minimal valid number");
      assert.strictEqual(normalized.commissionRate, 0.1); // Amazon default 10%
    });

    test("should handle missing optional fields without throwing errors", () => {
      const raw: RawMarketplaceItem = {
        externalId: "test-missing",
        platform: "MERCADO_LIVRE",
        title: "Item Sem Metadados",
        price: 50.0,
        productUrl: "https://mercadolivre.com.br/item-missing",
      };

      const normalized = ProductNormalizer.normalize(raw);
      assert.strictEqual(normalized.rating, null);
      assert.strictEqual(normalized.reviewCount, null);
      assert.strictEqual(normalized.trendScore, null);
      assert.strictEqual(normalized.isDataComplete, false);
      assert.ok(normalized.missingFields.includes("rating"));
      assert.ok(normalized.missingFields.includes("trendScore"));
    });
  });

  // --- 2. PRODUCT ANALYSIS & OPPORTUNITY SCORING TESTS ---
  describe("OpportunityScoringService", () => {
    test("should produce high score and HOT tier for items with deep discount and high commission", () => {
      const raw: RawMarketplaceItem = {
        externalId: "test-hot",
        platform: "SHOPEE",
        title: "Fone Bluetooth Alta Conversão",
        price: 90.0,
        originalPrice: 200.0,
        discountPercentage: 55,
        rating: 4.9,
        reviewCount: 4000,
        trendIndicator: 95,
        commissionRate: 0.15,
        productUrl: "https://shopee.com.br/test-hot",
      };

      const normalized = ProductNormalizer.normalize(raw);
      const analysis = ProductAnalysisService.analyze(normalized);
      const scoreResult = OpportunityScoringService.calculate(normalized, analysis);

      assert.ok(scoreResult.totalScore >= 85, `Expected score >= 85, got ${scoreResult.totalScore}`);
      assert.strictEqual(scoreResult.tier, "HOT");
      assert.strictEqual(scoreResult.confidence, "ALTA");
      assert.ok(scoreResult.reasons.length > 0);
      assert.ok(scoreResult.reasons.some((r) => r.includes("55%")));
    });

    test("should redistribute weights proportionally when trend and ratings are missing", () => {
      const raw: RawMarketplaceItem = {
        externalId: "test-missing-trend",
        platform: "MERCADO_LIVRE",
        title: "Produto Sem Tendência",
        price: 150.0,
        originalPrice: 300.0,
        discountPercentage: 50,
        productUrl: "https://mercadolivre.com.br/test-missing",
      };

      const normalized = ProductNormalizer.normalize(raw);
      const analysis = ProductAnalysisService.analyze(normalized);
      const scoreResult = OpportunityScoringService.calculate(normalized, analysis);

      assert.strictEqual(scoreResult.breakdown.trend.dataAvailable, false);
      assert.strictEqual(scoreResult.breakdown.trend.effectiveWeight, 0);
      assert.ok(scoreResult.breakdown.discount.effectiveWeight > 20, "Discount weight should increase proportionally");
      assert.ok(scoreResult.totalScore > 0 && scoreResult.totalScore <= 100);
      assert.strictEqual(scoreResult.confidence, "BAIXA", "50% completeness corresponds to BAIXA confidence");
    });
  });

  // --- 3. RANKING TESTS ---
  describe("OpportunityRankingService", () => {
    test("should correctly rank opportunities by score, commission, and discount", () => {
      const items: RankedOpportunityItem[] = [
        {
          id: "1",
          score: 80,
          confidence: "ALTA",
          reasons: [],
          detectedAt: new Date("2026-09-10"),
          product: {
            id: "p1",
            externalId: "ext-1",
            platform: "SHOPEE",
            title: "Item 1",
            imageUrl: "",
            currentPrice: 100,
            originalPrice: 120,
            discountPercent: 16,
            commissionRate: 0.1,
            commissionAmount: 10,
            rating: 4.5,
            salesCount: 100,
            trendScore: 80,
            category: "Tech",
            url: "",
            dataSource: "mock",
            createdAt: new Date(),
          },
        },
        {
          id: "2",
          score: 95,
          confidence: "ALTA",
          reasons: [],
          detectedAt: new Date("2026-09-12"),
          product: {
            id: "p2",
            externalId: "ext-2",
            platform: "MERCADO_LIVRE",
            title: "Item 2",
            imageUrl: "",
            currentPrice: 300,
            originalPrice: 600,
            discountPercent: 50,
            commissionRate: 0.15,
            commissionAmount: 45,
            rating: 4.9,
            salesCount: 500,
            trendScore: 95,
            category: "Tech",
            url: "",
            dataSource: "mock",
            createdAt: new Date(),
          },
        },
      ];

      const byScore = OpportunityRankingService.rank(items, "score_desc");
      assert.strictEqual(byScore[0].id, "2");

      const byCommission = OpportunityRankingService.rank(items, "commission_desc");
      assert.strictEqual(byCommission[0].id, "2");

      const byDiscount = OpportunityRankingService.rank(items, "discount_desc");
      assert.strictEqual(byDiscount[0].id, "2");

      const byRecent = OpportunityRankingService.rank(items, "recent_desc");
      assert.strictEqual(byRecent[0].id, "2");
    });
  });
});
