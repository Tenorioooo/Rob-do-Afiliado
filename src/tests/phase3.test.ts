import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAffiliateTrackingUrl } from "../domain/affiliate/utm-builder";
import { ShopeeAffiliateAdapter, MercadoLivreAffiliateAdapter, AmazonAffiliateAdapter } from "../domain/affiliate/affiliate-adapters";
import { OfferValidator } from "../domain/offers/offer-validator";
import { MockAIProvider } from "../integrations/ai/ai-provider";
import { OfferStructuredInput } from "../domain/offers/types";

describe("Phase 3: Affiliate Links & Anti-Fabrication AI Offers", () => {
  const sampleProduct: OfferStructuredInput = {
    productId: "prod-test-1",
    title: "Fone de Ouvido Bluetooth TWS Pro Max",
    category: "Eletrônicos",
    platform: "SHOPEE",
    originalPrice: 199.9,
    currentPrice: 89.9,
    discountPercent: 55,
    commissionAmount: 12.58,
    commissionRate: 0.14,
    rating: 4.9,
    reviewCount: 4320,
    salesCount: 4320,
    opportunityScore: 97,
    tags: ["Frete Grátis", "Mais Vendido"],
    reasons: ["Desconto de 55%", "Comissão alta de 14%"],
    affiliateUrl: "https://mock.shopee.com.br/aff/l/shopee-849302",
    inStock: true,
  };

  it("1. builds robust UTM tracking URLs without duplicating parameters", () => {
    const baseUrl = "https://shopee.com.br/product-example?existing_param=123";
    const trackingUrl = buildAffiliateTrackingUrl(baseUrl, {
      utmSource: "telegram_channel",
      utmMedium: "affiliate_bot",
      utmCampaign: "black_friday_2026",
      userId: "user_123",
      opportunityId: "opp_456",
    });

    const parsed = new URL(trackingUrl);
    assert.equal(parsed.searchParams.get("existing_param"), "123");
    assert.equal(parsed.searchParams.get("utm_source"), "telegram_channel");
    assert.equal(parsed.searchParams.get("utm_medium"), "affiliate_bot");
    assert.equal(parsed.searchParams.get("utm_campaign"), "black_friday_2026");
    assert.equal(parsed.searchParams.get("aff_uid"), "user_123");
    assert.equal(parsed.searchParams.get("aff_opp"), "opp_456");
  });

  it("2. generates deterministic affiliate links for Shopee, Mercado Livre, and Amazon", async () => {
    const shopeeAdapter = new ShopeeAffiliateAdapter();
    const mlAdapter = new MercadoLivreAffiliateAdapter();
    const amzAdapter = new AmazonAffiliateAdapter();

    const shopeeRes = await shopeeAdapter.generateLink("https://shopee.com.br/item", "shopee-12345", { utmSource: "test" });
    const mlRes = await mlAdapter.generateLink("https://www.mercadolivre.com.br/item", "ml-67890", { utmSource: "test" });
    const amzRes = await amzAdapter.generateLink("https://www.amazon.com.br/item", "amz-11223", { utmSource: "test" });

    assert.equal(shopeeRes.source, "real");
    assert.equal(mlRes.source, "real");
    assert.equal(amzRes.source, "real");

    assert.ok(shopeeRes.url?.includes("shopee.com.br"));
    assert.ok(mlRes.url?.includes("mercadolivre.com.br"));
    assert.ok(amzRes.url?.includes("amazon.com.br"));
  });

  it("3. generates all 5 copy styles (DIRETO, DESCONTO, URGENCIA, PREMIUM, CURTO) with valid data", async () => {
    const aiProvider = new MockAIProvider();
    const variants = await aiProvider.generateVariants(sampleProduct);

    assert.equal(variants.length, 5);
    const styles = variants.map((v) => v.style);
    assert.deepEqual(styles, ["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"]);

    // Verify all 5 variants passed anti-fabrication validation
    for (const v of variants) {
      assert.notEqual(v.validationStatus, "REJECTED");
      assert.ok(v.body.includes("89,90")); // Exact current price
    }
  });

  it("4. Anti-Fabrication: blocks 'últimas unidades' when product is in stock and has no scarcity tag", () => {
    const fabricatedTitle = "🔥 Corra! Últimas unidades disponíveis!";
    const body = "De R$ 199,90 por R$ 89,90. Quase esgotado!";
    const cta = "👉 Compre agora antes que acabe";

    const validation = OfferValidator.validate(fabricatedTitle, body, cta, {
      ...sampleProduct,
      tags: [], // No flash/scarcity tag
      inStock: true,
    });

    assert.equal(validation.isValid, false);
    assert.equal(validation.status, "REJECTED");
    assert.ok(validation.violations.some((v) => v.claim === "últimas unidades"));
  });

  it("5. Anti-Fabrication: blocks 'mais vendido' for products with low sales count", () => {
    const fabricatedTitle = "🔥 O Mais Vendido da Categoria!";
    const body = "De R$ 199,90 por R$ 89,90.";
    const cta = "👉 Compre agora";

    const validation = OfferValidator.validate(fabricatedTitle, body, cta, {
      ...sampleProduct,
      salesCount: 15, // Low sales count
      tags: [],
    });

    assert.equal(validation.isValid, false);
    assert.equal(validation.status, "REJECTED");
    assert.ok(validation.violations.some((v) => v.claim === "mais vendido"));
  });

  it("6. Anti-Fabrication: blocks 'frete grátis' when product does not include free shipping", () => {
    const fabricatedTitle = "🔥 Promoção Imperdível!";
    const body = "Aproveite com frete grátis para todo o Brasil.";
    const cta = "👉 Compre agora";

    const validation = OfferValidator.validate(fabricatedTitle, body, cta, {
      ...sampleProduct,
      tags: ["Eletrônicos"], // No free shipping tag
    });

    assert.equal(validation.isValid, false);
    assert.equal(validation.status, "REJECTED");
    assert.ok(validation.violations.some((v) => v.claim === "frete grátis"));
  });
});
