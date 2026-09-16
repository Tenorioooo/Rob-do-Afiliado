import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { MercadoLivreMarketplaceAdapter } from "@/integrations/marketplaces/mercadolivre.adapter";
import { OAuthService } from "@/services/integrations/oauth-service";
import { ConnectionService } from "@/services/integrations/connection-service";
import { ProductNormalizer } from "@/domain/products/product-normalizer";
import { ProviderCapabilityAuditRegistry } from "@/domain/integrations/provider-capability-audit";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";

test("Phase 9A: Mercado Livre Real — OAuth 2.0, Catalog, Products, Health Check & Radar Integration", async (t) => {
  const testUserId = `user_p9a_ml_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Create test user in DB
  const testUser = await prisma.user.create({
    data: {
      id: testUserId,
      email: `${testUserId}@example.com`,
      name: "Phase 9A ML User",
      passwordHash: "test_hash",
      role: "USER",
    },
  });

  t.after(async () => {
    await prisma.integrationAuditLog.deleteMany({ where: { userId: testUserId } });
    await prisma.integrationVerification.deleteMany({ where: { userId: testUserId } });
    await prisma.integrationConnection.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  // 1. OAUTH 2.0 AUTHORIZATION FLOW
  await t.test("1. generates official OAuth authorization URL with secure state and CSRF token", () => {
    const authData = OAuthService.generateAuthUrl({
      provider: "MERCADO_LIVRE",
      appId: "1234567890123456",
      redirectUri: "https://affiliateai.app/api/integrations/oauth/mercadolivre/callback",
      userId: testUserId,
    });

    assert.ok(authData.url.startsWith("https://auth.mercadolivre.com.br/authorization"));
    assert.ok(authData.url.includes("client_id=1234567890123456"));
    assert.ok(authData.url.includes("response_type=code"));
    assert.ok(authData.url.includes(`state=${authData.state}`));

    // Valid state test
    const validState = OAuthService.validateState(authData.state);
    assert.equal(validState.valid, true);
    assert.equal(validState.userId, testUserId);

    // PKCE authorization URL generation test
    const pkceAuthData = OAuthService.generateAuthUrl({
      provider: "MERCADO_LIVRE",
      clientId: "1234567890123456",
      redirectUri: "https://affiliateai.app/api/integrations/oauth/mercadolivre/callback",
      userId: testUserId,
      codeChallenge: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      codeChallengeMethod: "S256",
    });
    assert.ok(pkceAuthData.url.includes("code_challenge=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"));
    assert.ok(pkceAuthData.url.includes("code_challenge_method=S256"));

    // Invalid / tempered states
    assert.equal(OAuthService.validateState("invalid_state").valid, false);
    assert.equal(OAuthService.validateState("ml_fake").valid, false);
    assert.equal(OAuthService.validateState("").valid, false);
    assert.equal(OAuthService.validateState(undefined).valid, false);
  });

  // 2. TOKEN EXCHANGE & REFRESH
  await t.test("2. exchanges code for tokens and refreshes expired tokens via official adapter", async () => {
    // Mock-mode response for unit tests
    const exchangeResult = await MercadoLivreMarketplaceAdapter.exchangeCodeForToken({
      clientId: "test_client_id",
      clientSecret: "test_client_secret",
      code: "test_code_12345",
      redirectUri: "https://affiliateai.app/api/integrations/oauth/mercadolivre/callback",
    });

    assert.ok(exchangeResult.accessToken.length > 0);
    assert.ok(exchangeResult.refreshToken.length > 0);
    assert.equal(exchangeResult.expiresIn, 21600);
    assert.equal(exchangeResult.userId, 123456789);

    // Refresh token
    const refreshResult = await MercadoLivreMarketplaceAdapter.refreshAccessToken({
      clientId: "test_client_id",
      clientSecret: "test_client_secret",
      refreshToken: exchangeResult.refreshToken,
    });

    assert.ok(refreshResult.accessToken.length > 0);
    assert.ok(refreshResult.refreshToken.length > 0);
  });

  // 3. SECURE CONNECTION STORAGE & HEALTH CHECK
  await t.test("3. stores encrypted tokens, executes health check and updates account nickname", async () => {
    // Save connection
    const saved = await ConnectionService.saveConnection({
      userId: testUserId,
      provider: "MERCADO_LIVRE",
      credentials: {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        accessToken: "ml_live_token_mock_test_123456",
        refreshToken: "ml_live_refresh_mock_test_123456",
        expiresIn: 21600,
        mlUserId: 123456789,
      },
      status: "CONNECTING",
    });

    assert.ok(saved.connection);
    assert.equal(saved.connection.provider, "MERCADO_LIVRE");

    // Execute testConnection / health check
    const testRes = await ConnectionService.testConnection(testUserId, saved.connection.id);
    assert.equal(testRes.success, true);
    assert.equal(testRes.connection.externalAccountName, "@TESTUSER_ML");
    assert.equal(testRes.connection.externalAccountId, "123456789");

    // Verify DB record status and metadata
    const dbConn = await prisma.integrationConnection.findUnique({
      where: { id: saved.connection.id },
    });
    assert.equal(dbConn?.status, "CONNECTED");
    assert.equal(dbConn?.externalAccountName, "@TESTUSER_ML");
    assert.equal(dbConn?.externalAccountId, "123456789");
    assert.ok(dbConn?.lastValidatedAt !== null);

    // Check that sensitive tokens are never in plain text in DB
    assert.ok(!dbConn?.encryptedCredentials?.includes("ml_live_token_mock_test_123456"));
  });

  // 4. OFFICIAL CATALOG SEARCH & ITEM DETAILS NORMALIZATION
  await t.test("4. searches MLB catalog and normalizes structured product details without fabrication", async () => {
    const items = await MercadoLivreMarketplaceAdapter.searchItems("test_query");
    assert.ok(items.length > 0);

    const firstItem = items[0];
    assert.equal(firstItem.id, "MLB1234567890");
    assert.equal(firstItem.price, 1299.9);
    assert.equal(firstItem.currency_id, "BRL");

    const singleItem = await MercadoLivreMarketplaceAdapter.getItem("MLB1234567890");
    assert.ok(singleItem !== null);
    assert.equal(singleItem?.id, "MLB1234567890");

    const normalized = MercadoLivreMarketplaceAdapter.normalizeItem(singleItem!);
    assert.equal(normalized.externalId, "MLB1234567890");
    assert.equal(normalized.price, 1299.9);
    assert.equal(normalized.originalPrice, 1599.9);
    assert.equal(normalized.discountPercent, 19);
    assert.equal(normalized.marketplace, "MERCADO_LIVRE");
    assert.equal(normalized.source, "real");
  });

  // 5. RADAR PRODUCT NORMALIZATION & UNKNOWN COMMISSION HANDLING
  await t.test("5. handles official API items with transparent UNKNOWN commission in Radar", () => {
    const rawRealItem = {
      externalId: "MLB1234567890",
      platform: "MERCADO_LIVRE" as const,
      title: "Smartphone Teste 128GB",
      price: 1299.9,
      originalPrice: 1599.9,
      productUrl: "https://produto.mercadolivre.com.br/MLB-1234567890",
      dataSource: "official_api",
      category: "Celulares",
    };

    const normalized = ProductNormalizer.normalize(rawRealItem as any);
    assert.equal(normalized.dataSource, "official_api");
    assert.equal(normalized.platform, "MERCADO_LIVRE");
    assert.equal(normalized.commissionRate, 0);
    assert.equal(normalized.commissionAmount, 0);
    assert.equal(normalized.sourceMetadata.commissionStatus, "UNKNOWN");
  });

  // 6. CAPABILITIES AUDIT INTEGRITY
  await t.test("6. verifies capabilities audit classifies affiliate link as UNVERIFIED / manual action", () => {
    const mlAudit = ProviderCapabilityAuditRegistry.getByProviderId("MERCADOLIVRE");
    assert.ok(mlAudit !== undefined);

    const oauthCap = mlAudit?.capabilities.find((c) => c.capability === "OAUTH2");
    assert.equal(oauthCap?.isOfficialApiConfirmed, true);

    const readProdCap = mlAudit?.capabilities.find((c) => c.capability === "READ_PRODUCTS");
    assert.equal(readProdCap?.isOfficialApiConfirmed, true);

    const affLinkCap = mlAudit?.capabilities.find((c) => c.capability === "GENERATE_AFFILIATE_LINK");
    assert.equal(affLinkCap?.status, "UNVERIFIED");
    assert.equal(affLinkCap?.isOfficialApiConfirmed, false);
    assert.equal(affLinkCap?.implementationStatus, "PENDING_OFFICIAL_API");
  });

  // 7. TELEGRAM REGRESSION SAFETY
  await t.test("7. guarantees Telegram integration remains VERIFIED_REAL and Autopilot remains OFF", async () => {
    const demoTelegramConn = await prisma.integrationConnection.findFirst({
      where: { userId: "usr-demo-01", provider: "TELEGRAM" },
    });

    assert.ok(demoTelegramConn !== null);
    assert.equal(demoTelegramConn?.status, "VERIFIED_REAL");
    assert.equal(demoTelegramConn?.externalAccountName, "@Teste12313Bot");

    const realPublication = await prisma.publication.findFirst({
      where: { userId: "usr-demo-01", source: "real", status: "PUBLISHED" },
    });
    assert.ok(realPublication !== null);
    assert.equal(realPublication?.providerMessageId, "3");

    const autopilotConfig = await prisma.autopilotConfig.findUnique({
      where: { userId: "usr-demo-01" },
    });
    assert.equal(autopilotConfig?.enabled, false);
  });
});
