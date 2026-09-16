import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { CredentialService } from "@/services/integrations/credential-service";
import { ExternalRequestPolicy } from "@/services/integrations/ssrf-policy";
import { ProviderRegistry } from "@/integrations/provider-registry";
import { CapabilityHelper, IntegrationCapability } from "@/domain/integrations/capabilities";
import { TelegramChannelAdapter } from "@/integrations/channels/telegram.adapter";
import { DiscordChannelAdapter } from "@/integrations/channels/discord.adapter";
import { WhatsAppCloudAdapter } from "@/integrations/channels/whatsapp.adapter";
import { ShopeeMarketplaceAdapter } from "@/integrations/marketplaces/shopee.adapter";
import { IntegrationIdempotencyService } from "@/services/integrations/idempotency-service";
import { IntegrationRetryService } from "@/services/integrations/retry-service";
import { OAuthService } from "@/services/integrations/oauth-service";
import { ChannelFactory } from "@/domain/channels/adapters/channel-factory";
import { RealTelegramAdapter, RealDiscordAdapter, RealWhatsAppAdapter } from "@/domain/channels/adapters/real-adapters";
import { ConnectionService } from "@/services/integrations/connection-service";
import { WebhookPipeline } from "@/services/integrations/webhook-pipeline";

test("Phase 7: Real External Integrations, Webhooks, Central de Conexões & Security", async (t) => {
  const testUserId = `user_phase7_test_${Date.now()}`;

  // Setup: Create test user
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `${testUserId}@example.com`,
      name: "Phase 7 Test User",
      passwordHash: "hash123",
    },
  });

  /* ==========================================================================
     1. SECURITY & CRYPTOGRAPHY (AES-256-GCM + SSRF)
     ========================================================================== */
  await t.test("1. Credential Security & AES-256-GCM Encryption", () => {
    const rawCredentials = {
      bot_token: "123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ1234",
      api_key: "shopee_live_secret_key_998877",
      webhook_secret: "meta_wa_webhook_verify_token_secure",
    };

    const encrypted = CredentialService.encrypt(rawCredentials);
    assert.equal(typeof encrypted, "string");
    assert.ok(!encrypted.includes("123456789"), "Encrypted text must not contain plain token");
    assert.ok(!encrypted.includes("shopee_live_secret"), "Encrypted text must not contain secret key");

    const decrypted = CredentialService.decrypt<typeof rawCredentials>(encrypted);
    assert.equal(decrypted.bot_token, rawCredentials.bot_token);
    assert.equal(decrypted.api_key, rawCredentials.api_key);
    assert.equal(decrypted.webhook_secret, rawCredentials.webhook_secret);

    // Masking test
    const sanitized = CredentialService.sanitizeCredentials(rawCredentials);
    assert.equal(sanitized.bot_token, "••••••••1234");
    assert.equal(sanitized.api_key, "••••••••8877");
    assert.equal(sanitized.webhook_secret, "••••••••cure");

    // Redaction test
    const logMessage = "Request failed with 123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ1234 and token=secret_xyz123";
    const redacted = CredentialService.redactLog(logMessage);
    assert.ok(!redacted.includes("123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ1234"));
    assert.ok(redacted.includes("[REDACTED_BOT_TOKEN]"));
  });

  await t.test("2. SSRF Policy & Hostname Allowlist Protection", () => {
    const allowedUrls = [
      "https://api.telegram.org/bot123/sendMessage",
      "https://discord.com/api/webhooks/123/abc",
      "https://discordapp.com/api/v10/channels/123/messages",
      "https://graph.facebook.com/v19.0/123/messages",
      "https://api.mercadolibre.com/sites/MLB/search?q=notebook",
      "https://open-api.affiliate.shopee.com.br/graphql",
      "https://webservices.amazon.com.br/paapi5/searchitems",
    ];

    for (const url of allowedUrls) {
      assert.equal(ExternalRequestPolicy.isAllowedUrl(url), true, `URL ${url} should be allowed`);
    }

    const forbiddenUrls = [
      "http://localhost:3000/api/admin",
      "http://127.0.0.1:8080/metrics",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.1/internal",
      "http://192.168.1.1/router-login",
      "https://evil-attacker.com/steal-token",
      "ftp://api.telegram.org/file",
      "file:///etc/passwd",
    ];

    for (const url of forbiddenUrls) {
      assert.equal(ExternalRequestPolicy.isAllowedUrl(url), false, `URL ${url} must be blocked`);
    }
  });

  /* ==========================================================================
     2. PROVIDER REGISTRY & CAPABILITIES CATALOG
     ========================================================================== */
  await t.test("3. Provider Registry & Capabilities Catalogue", () => {
    const providers = ProviderRegistry.getAll();
    assert.equal(providers.length, 6);

    const providerIds = providers.map((p) => p.id.toUpperCase());
    assert.ok(providerIds.includes("TELEGRAM"));
    assert.ok(providerIds.includes("DISCORD"));
    assert.ok(providerIds.includes("WHATSAPP"));
    assert.ok(providerIds.includes("MERCADO_LIVRE"));
    assert.ok(providerIds.includes("SHOPEE"));
    assert.ok(providerIds.includes("AMAZON"));

    const tgProvider = ProviderRegistry.getById("TELEGRAM");
    assert.ok(tgProvider);
    assert.equal(CapabilityHelper.supportsCapability(tgProvider.capabilities, "SEND_MESSAGE"), true);
    assert.equal(CapabilityHelper.supportsCapability(tgProvider.capabilities, "WEBHOOKS"), true);
    assert.equal(CapabilityHelper.supportsCapability(tgProvider.capabilities, "READ_PRODUCTS"), false);

    const shopeeProvider = ProviderRegistry.getById("SHOPEE");
    assert.ok(shopeeProvider);
    assert.equal(CapabilityHelper.supportsCapability(shopeeProvider.capabilities, "GENERATE_AFFILIATE_LINK"), true);
    assert.equal(CapabilityHelper.supportsCapability(shopeeProvider.capabilities, "READ_PRODUCTS"), true);
    assert.equal(CapabilityHelper.supportsCapability(shopeeProvider.capabilities, "SEND_MESSAGE"), false);

    const mlProvider = ProviderRegistry.getById("MERCADO_LIVRE");
    assert.ok(mlProvider);
    assert.equal(CapabilityHelper.supportsCapability(mlProvider.capabilities, "READ_PRODUCTS"), true);
    assert.equal(CapabilityHelper.supportsCapability(mlProvider.capabilities, "WEBHOOKS"), true);
  });

  /* ==========================================================================
     3. OFFICIAL ADAPTER CONFIG & SIGNATURES
     ========================================================================== */
  await t.test("4. Official Channel & Marketplace Config Validation", () => {
    const realTg = new RealTelegramAdapter();
    assert.equal(realTg.validateConfig({}).valid, false);
    assert.equal(realTg.validateConfig({ botToken: "123:ABC" }).valid, true);
    assert.equal(realTg.validateConfig({ bot_token: "123:ABC" }).valid, true);

    const realDiscord = new RealDiscordAdapter();
    assert.equal(realDiscord.validateConfig({}).valid, false);
    assert.equal(realDiscord.validateConfig({ webhookUrl: "https://discord.com/api/webhooks/123/abc" }).valid, true);

    const realWa = new RealWhatsAppAdapter();
    assert.equal(realWa.validateConfig({}).valid, false);
    assert.equal(
      realWa.validateConfig({
        accessToken: "EAAB...",
        phoneNumberId: "1234567890",
      }).valid,
      true
    );

    // Shopee Signature Generation
    const payload = JSON.stringify({ query: "{ affiliateProductSearch(page: 1) { nodes { itemId } } }" });
    const timestamp = 1700000000;
    const appId = "123456";
    const secret = "my_shopee_secret_key";

    const signature = ShopeeMarketplaceAdapter.generateSignature({
      appId,
      secret,
      timestamp,
      payload,
    });

    assert.equal(typeof signature, "string");
    assert.equal(signature.length, 64);
  });

  await t.test("5. Mercado Livre OAuth State Generation & Validation", () => {
    const { url, state } = OAuthService.generateAuthUrl({
      provider: "mercadolivre",
      appId: "APP_USR_123456789",
      redirectUri: "https://affiliateai.com/api/integrations/oauth/mercadolivre/callback",
      userId: testUserId,
    });

    assert.ok(url.includes("auth.mercadolivre.com.br/authorization"));
    assert.ok(url.includes("client_id=APP_USR_123456789"));
    assert.ok(url.includes(`state=${state}`));

    const validation = OAuthService.validateState(state);
    assert.equal(validation.valid, true);
    assert.equal(validation.userId, testUserId);

    assert.equal(OAuthService.validateState("invalid_fake_state").valid, false);
  });

  /* ==========================================================================
     4. INGESTION WEBHOOK PIPELINE & IDEMPOTENCY
     ========================================================================== */
  await t.test("6. Ingestion Webhook Pipeline & Idempotency", async () => {
    const appSecret = "meta_test_secret_123";
    const rawBody = JSON.stringify({ entry: [{ id: "123", changes: [] }] });

    const validHmac = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const signatureHeader = `sha256=${validHmac}`;

    const isValid = WhatsAppCloudAdapter.validateWebhookSignature(
      rawBody,
      signatureHeader,
      appSecret
    );

    assert.equal(isValid, true);

    const isInvalid = WhatsAppCloudAdapter.validateWebhookSignature(
      rawBody,
      "sha256=invalid_hash",
      appSecret
    );

    assert.equal(isInvalid, false);

    // Idempotency check with recordEvent
    const externalId = `test_evt_${Date.now()}_abc`;
    const firstRecord = await IntegrationIdempotencyService.recordEvent({
      userId: testUserId,
      provider: "TEST_PROVIDER",
      externalEventId: externalId,
      eventType: "order.created",
      payload: { id: externalId, amount: 100 },
    });

    assert.equal(firstRecord.isDuplicate, false);
    assert.ok(firstRecord.event.id);

    const secondRecord = await IntegrationIdempotencyService.recordEvent({
      userId: testUserId,
      provider: "TEST_PROVIDER",
      externalEventId: externalId,
      eventType: "order.created",
      payload: { id: externalId, amount: 100 },
    });

    assert.equal(secondRecord.isDuplicate, true);
    assert.equal(secondRecord.event.id, firstRecord.event.id);

    // Retry Service error classification
    const rateLimitError = IntegrationRetryService.classifyError(429, "Too Many Requests");
    assert.equal(rateLimitError, "RATE_LIMIT");

    const retryableError = IntegrationRetryService.classifyError(504, "Gateway Timeout");
    assert.equal(retryableError, "TEMPORARY_ERROR");

    const authError = IntegrationRetryService.classifyError(401, "Unauthorized - Invalid token");
    assert.equal(authError, "AUTH_ERROR");
  });

  /* ==========================================================================
     5. DB CONNECTION CRUD & LIFECYCLE
     ========================================================================== */
  await t.test("7. IntegrationConnection DB Persistence & Health Check Flow", async () => {
    // 1. Create a Telegram connection
    const testResult = await ConnectionService.saveConnection({
      userId: testUserId,
      provider: "TELEGRAM",
      credentials: {
        botToken: "123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ1234",
      },
    });

    const conn = testResult.connection;
    assert.ok(conn.id);
    assert.equal(conn.provider, "TELEGRAM");
    assert.equal(conn.type, "CHANNEL");

    // 2. Fetch connection with decrypted credentials internally
    const fetchedConn = await ConnectionService.getConnection(testUserId, conn.id, false);
    assert.equal(fetchedConn?.credentials?.botToken, "123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ1234");

    // 3. Ingest simulated Telegram webhook with unique update_id
    const dynamicUpdateId = Date.now() + Math.floor(Math.random() * 10000);
    const rawWebhookBody = JSON.stringify({
      update_id: dynamicUpdateId,
      message: {
        message_id: 42,
        from: { id: 999, first_name: "John" },
        chat: { id: -100123456789, title: "Ofertas VIP" },
        text: "Novas ofertas disponíveis!",
      },
    });

    const webhookResult = await WebhookPipeline.ingest({
      provider: "telegram",
      connectionId: conn.id,
      headers: { "content-type": "application/json" },
      rawBody: rawWebhookBody,
    });

    assert.equal(webhookResult.success, true);
    assert.equal(webhookResult.status, "PROCESSED");
    assert.ok(webhookResult.eventId);

    // 4. Duplicate webhook test (Idempotency)
    const duplicateWebhookResult = await WebhookPipeline.ingest({
      provider: "telegram",
      connectionId: conn.id,
      headers: { "content-type": "application/json" },
      rawBody: rawWebhookBody,
    });

    assert.equal(duplicateWebhookResult.status, "IGNORED");
    assert.equal(duplicateWebhookResult.isDuplicate, true);

    // 5. Disconnect connection
    const disconnected = await ConnectionService.disconnectConnection(testUserId, conn.id);
    assert.equal(disconnected.status, "DISCONNECTED");
  });

  /* ==========================================================================
     6. CHANNEL FACTORY & ADAPTER DELEGATION
     ========================================================================== */
  await t.test("8. ChannelFactory & Adapter Delegation", () => {
    const mockTg = ChannelFactory.getAdapter("TELEGRAM", "mock");
    assert.equal(mockTg.isMock, true);
    assert.equal(mockTg.provider, "telegram-mock");

    const realTg = ChannelFactory.getAdapter("TELEGRAM", "real");
    assert.equal(realTg.isMock, false);
    assert.equal(realTg.provider, "telegram-api");
    assert.ok(realTg instanceof RealTelegramAdapter);

    const realDiscord = ChannelFactory.getAdapter("DISCORD", "discord-webhook-api");
    assert.equal(realDiscord.isMock, false);
    assert.equal(realDiscord.provider, "discord-webhook-api");
    assert.ok(realDiscord instanceof RealDiscordAdapter);

    const realWa = ChannelFactory.getAdapter("WHATSAPP", "meta-cloud-api");
    assert.equal(realWa.isMock, false);
    assert.equal(realWa.provider, "meta-cloud-api");
    assert.ok(realWa instanceof RealWhatsAppAdapter);
  });
});
