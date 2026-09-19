import assert from "node:assert";
import { test, describe, before, after } from "node:test";
import { prisma } from "@/lib/db/prisma";
import { AffiliateLinkService } from "@/services/affiliate/affiliate-link-service";
import { CredentialService } from "@/services/integrations/credential-service";

describe("Marketplace Affiliate Commission & Tag Injection Tests", () => {
  const testUserId = `user_aff_test_${Date.now()}`;
  let mlProduct: any;
  let amzProduct: any;

  before(async () => {
    // 1. Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: "Test Affiliate User",
        passwordHash: "hash123",
      },
    });

    // 2. Create sample products
    mlProduct = await prisma.product.create({
      data: {
        externalId: `ml_prod_${Date.now()}`,
        platform: "MERCADO_LIVRE",
        title: "Smartphone Teste ML",
        category: "Eletrônicos",
        currentPrice: 1500,
        originalPrice: 2000,
        discountPercent: 25,
        commissionRate: 0.12,
        commissionAmount: 180,
        url: "https://produto.mercadolivre.com.br/MLB-12345678-smartphone",
        imageUrl: "https://http2.mlstatic.com/D_NQ_NP_test.webp",
        dataSource: "mercadolivre_real",
      },
    });

    amzProduct = await prisma.product.create({
      data: {
        externalId: `amz_prod_${Date.now()}`,
        platform: "AMAZON",
        title: "Echo Dot Teste Amazon",
        category: "Eletrônicos",
        currentPrice: 350,
        originalPrice: 450,
        discountPercent: 22,
        commissionRate: 0.1,
        commissionAmount: 35,
        url: "https://www.amazon.com.br/dp/B09B8V1LZ3",
        imageUrl: "https://m.media-amazon.com/images/I/test.jpg",
        dataSource: "amazon_real",
      },
    });
  });

  after(async () => {
    await prisma.affiliateLink.deleteMany({ where: { userId: testUserId } });
    await prisma.integrationConnection.deleteMany({ where: { userId: testUserId } });
    if (mlProduct) await prisma.product.delete({ where: { id: mlProduct.id } });
    if (amzProduct) await prisma.product.delete({ where: { id: amzProduct.id } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  test("1. Injects user Mercado Livre affiliate tag into generated affiliate link", async () => {
    // Save ML connection with user's affiliate tag
    const encCreds = CredentialService.encrypt({
      affiliateTag: "MLB-AFF-TESTE-999",
    });

    await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "MERCADO_LIVRE",
        type: "MARKETPLACE",
        status: "VERIFIED_REAL",
        authType: "OAUTH2",
        encryptedCredentials: encCreds,
      },
    });

    const result = await AffiliateLinkService.generateOrGetLink(
      {
        userId: testUserId,
        productId: mlProduct.id,
        platform: "MERCADO_LIVRE",
        originalUrl: mlProduct.url,
      },
      true
    );

    assert.ok(result.link.affiliateUrl.includes("matt_tool=MLB-AFF-TESTE-999"));
    assert.ok(result.link.affiliateUrl.includes("aff_id=MLB-AFF-TESTE-999"));
    assert.ok(result.link.affiliateUrl.includes("utm_source="));
  });

  test("2. Injects user Amazon Associate tag into generated affiliate link", async () => {
    // Save Amazon connection with user's partner tag
    const encCreds = CredentialService.encrypt({
      partnerTag: "minhaloja-associado-20",
    });

    await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "AMAZON",
        type: "MARKETPLACE",
        status: "CONNECTED",
        authType: "AWS_SIGV4",
        encryptedCredentials: encCreds,
      },
    });

    const result = await AffiliateLinkService.generateOrGetLink(
      {
        userId: testUserId,
        productId: amzProduct.id,
        platform: "AMAZON",
        originalUrl: amzProduct.url,
      },
      true
    );

    assert.ok(result.link.affiliateUrl.includes("tag=minhaloja-associado-20"));
    assert.ok(result.link.affiliateUrl.includes("utm_source="));
  });
});
