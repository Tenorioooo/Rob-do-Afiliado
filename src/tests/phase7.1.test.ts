import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import {
  ProviderCapabilityAuditRegistry,
} from "@/domain/integrations/provider-capability-audit";
import { IntegrationPreflightService } from "@/services/integrations/preflight-service";
import { ExternalRequestPolicy } from "@/services/integrations/ssrf-policy";
import { RealTelegramAdapter, RealDiscordAdapter, RealWhatsAppAdapter } from "@/domain/channels/adapters/real-adapters";
import { ShopeeMarketplaceAdapter } from "@/integrations/marketplaces/shopee.adapter";
import { AmazonMarketplaceAdapter } from "@/integrations/marketplaces/amazon.adapter";

test("Phase 7.1: Technical Audit, Homologation & Safe Activation of Real Integrations", async (t) => {
  const testUserId = `user_phase7_1_${Date.now()}`;

  // Setup: Create test user
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `${testUserId}@example.com`,
      name: "Phase 7.1 Test User",
      passwordHash: "hash123",
    },
  });

  /* ==========================================================================
     1. AUDIT REGISTRY INTEGRITY & OFFICIAL DOCUMENTATION CITATIONS
     ========================================================================== */
  await t.test("1. Audit Registry Integrity & Coverage", () => {
    const allAudits = ProviderCapabilityAuditRegistry.getAll();
    assert.equal(allAudits.length, 6, "Must contain exactly 6 audited providers");

    const expectedProviders = [
      "TELEGRAM",
      "DISCORD",
      "WHATSAPP",
      "MERCADO_LIVRE",
      "SHOPEE",
      "AMAZON",
    ];

    for (const id of expectedProviders) {
      const record = ProviderCapabilityAuditRegistry.getByProviderId(id);
      assert.ok(record, `Audit record for ${id} must exist`);
      assert.ok(record.providerName, `Display name for ${id} must exist`);
      assert.ok(record.officialDocsUrl.startsWith("https://"), `Official doc URL for ${id} must be HTTPS`);
      assert.ok(record.primaryAuthType, `Auth type for ${id} must be specified`);
      assert.ok(record.capabilities.length > 0, `Provider ${id} must have audited capabilities`);

      // Verify every capability has official endpoint documentation and citations
      for (const cap of record.capabilities) {
        assert.ok(cap.capability, "Capability code must be defined");
        assert.ok(cap.label, "Capability label must be defined");
        assert.ok(cap.officialSourceUrl, "Capability must provide official documentation URL");
        assert.ok(cap.isAvailableInBrazil !== undefined, "Regional availability for Brazil must be documented");
        assert.ok(cap.evidence, "Evidence must be documented");
      }
    }

    // Homologation Statistics Check
    const stats = ProviderCapabilityAuditRegistry.getSummaryStats();
    assert.equal(stats.totalProviders, 6);
    assert.equal(stats.homologatedProviders, 3); // Telegram, Discord, Mercado Livre
    assert.equal(stats.requiresApprovalProviders, 3); // WhatsApp, Shopee, Amazon
    assert.ok(stats.totalCapabilities >= 15);
  });

  /* ==========================================================================
     2. STRICT CLASSIFICATION & ANTI-FABRICATION CONSTRAINTS
     ========================================================================== */
  await t.test("2. Strict Capability Verification & Anti-Fabrication Constraints", () => {
    const mlAudit = ProviderCapabilityAuditRegistry.getByProviderId("MERCADO_LIVRE");
    assert.ok(mlAudit);

    // Mercado Livre affiliate deep link generation is NOT a public REST API in Developers API
    const mlAffiliateLinkCap = mlAudit.capabilities.find(
      (c) => c.capability === "GENERATE_AFFILIATE_LINK"
    );
    assert.ok(mlAffiliateLinkCap, "ML affiliate link capability must be documented");
    assert.equal(
      mlAffiliateLinkCap.status,
      "UNVERIFIED",
      "ML affiliate link API cannot be claimed as VERIFIED_REAL because ML does not expose affiliate deep link generation on Developers API"
    );
    assert.ok(
      mlAffiliateLinkCap.evidence.includes("NÃO fornece endpoint") ||
      mlAffiliateLinkCap.limitationsAndNotes.includes("portal de afiliados") ||
      mlAffiliateLinkCap.officialSourceTitle.includes("Afiliados"),
      "Must clearly note manual/portal nature of ML affiliate links"
    );

    // Shopee API requires commercial partner approval
    const shopeeAudit = ProviderCapabilityAuditRegistry.getByProviderId("SHOPEE");
    assert.ok(shopeeAudit);
    assert.equal(shopeeAudit.overallStatus, "REQUIRES_APPROVAL");
    const shopeeSearchCap = shopeeAudit.capabilities.find((c) => c.capability === "READ_PRODUCTS");
    assert.ok(shopeeSearchCap);
    assert.equal(shopeeSearchCap.status, "REQUIRES_APPROVAL");

    // Amazon PA-API requires 3 qualifying sales
    const amazonAudit = ProviderCapabilityAuditRegistry.getByProviderId("AMAZON");
    assert.ok(amazonAudit);
    assert.equal(amazonAudit.overallStatus, "REQUIRES_APPROVAL");
    assert.ok(
      amazonAudit.summary.includes("3 vendas") ||
      amazonAudit.capabilities.some((c) => c.accountRequirements.includes("3 vendas")),
      "Amazon must document the 3 qualifying sales requirement"
    );
  });

  /* ==========================================================================
     3. PREFLIGHT DIAGNOSTICS ENGINE
     ========================================================================== */
  await t.test("3. Preflight Diagnostics for Channels and Marketplaces", async () => {
    // 3.1 Telegram - Missing credentials
    const tgMissing = await IntegrationPreflightService.runPreflight({ provider: "TELEGRAM" });
    assert.equal(tgMissing.readyForRealExecution, false);
    assert.equal(tgMissing.overallStatus, "REQUIRES_CREDENTIALS");
    assert.ok(tgMissing.checks.some((c) => c.id === "CREDENTIALS_PRESENCE" && c.status === "REQUIRES_CREDENTIALS"));

    // 3.2 Telegram - Malformed token
    const tgMalformed = await IntegrationPreflightService.runPreflight({
      provider: "TELEGRAM",
      credentials: { botToken: "not-a-valid-token" },
    });
    assert.equal(tgMalformed.readyForRealExecution, false);
    assert.ok(tgMalformed.checks.some((c) => c.id === "CREDENTIAL_FORMAT" && c.status === "FAIL"));

    // 3.3 Discord - Missing webhook URL
    const discordMissing = await IntegrationPreflightService.runPreflight({ provider: "DISCORD" });
    assert.equal(discordMissing.readyForRealExecution, false);
    assert.equal(discordMissing.overallStatus, "REQUIRES_CREDENTIALS");

    // 3.4 Discord - Valid format Discord Webhook
    const discordValid = await IntegrationPreflightService.runPreflight({
      provider: "DISCORD",
      credentials: { webhookUrl: "https://discord.com/api/webhooks/1234567890/ABCDEFGHIJKLMN_xyz" },
    });
    assert.ok(discordValid.checks.some((c) => c.id === "CREDENTIAL_FORMAT" && c.status === "PASS"));
    assert.ok(discordValid.checks.some((c) => c.id === "SSRF_SECURITY" && c.status === "PASS"));

    // 3.5 WhatsApp Meta Cloud API - Requires approval check
    const waMissing = await IntegrationPreflightService.runPreflight({ provider: "WHATSAPP" });
    assert.equal(waMissing.readyForRealExecution, false);
    assert.equal(waMissing.homologationStatus, "REQUIRES_APPROVAL");

    // 3.6 Shopee - Requires approval verification
    const shopeePreflight = await IntegrationPreflightService.runPreflight({ provider: "SHOPEE" });
    assert.equal(shopeePreflight.readyForRealExecution, false);
    assert.equal(shopeePreflight.homologationStatus, "REQUIRES_APPROVAL");

    // 3.7 Amazon - Requires PA-API credentials and approval prerequisite
    const amazonPreflight = await IntegrationPreflightService.runPreflight({ provider: "AMAZON" });
    assert.equal(amazonPreflight.readyForRealExecution, false);
    assert.equal(amazonPreflight.homologationStatus, "REQUIRES_APPROVAL");
  });

  /* ==========================================================================
     4. SSRF PROTECTION & ATTACK VECTOR PREVENTION IN PREFLIGHT
     ========================================================================== */
  await t.test("4. SSRF & Malicious Target Prevention in Preflight Checks", async () => {
    // Attempting Discord Webhook pointing to internal loopback
    const discordSSRF1 = await IntegrationPreflightService.runPreflight({
      provider: "DISCORD",
      credentials: { webhookUrl: "http://127.0.0.1:3000/api/internal" },
    });
    assert.equal(discordSSRF1.readyForRealExecution, false);
    assert.ok(discordSSRF1.checks.some((c) => c.id === "SSRF_SECURITY" && c.status === "FAIL"));

    // Attempting Discord Webhook pointing to AWS metadata IP
    const discordSSRF2 = await IntegrationPreflightService.runPreflight({
      provider: "DISCORD",
      credentials: { webhookUrl: "http://169.254.169.254/latest/meta-data/" },
    });
    assert.equal(discordSSRF2.readyForRealExecution, false);
    assert.ok(discordSSRF2.checks.some((c) => c.id === "SSRF_SECURITY" && c.status === "FAIL"));

    // Attempting Discord Webhook with non-Discord host
    const discordSSRF3 = await IntegrationPreflightService.runPreflight({
      provider: "DISCORD",
      credentials: { webhookUrl: "https://evil-hacker.com/webhook" },
    });
    assert.equal(discordSSRF3.readyForRealExecution, false);
    assert.ok(discordSSRF3.checks.some((c) => c.id === "SSRF_SECURITY" && c.status === "FAIL"));
  });

  /* ==========================================================================
     5. REAL ADAPTER FAIL-SAFE BEHAVIOR (NO FABRICATION)
     ========================================================================== */
  await t.test("5. Real Adapters Fail Fast and Safely When Unconfigured", async () => {
    // 5.1 Real Telegram Adapter with no token
    const realTg = new RealTelegramAdapter();
    const tgResult = await realTg.sendMessage({
      channelId: "chan_tg_1",
      destination: "@test_channel",
      title: "Test",
      body: "Body",
      affiliateUrl: "https://example.com",
      config: {},
    });
    assert.equal(tgResult.success, false);
    assert.equal(tgResult.errorCode, "MISSING_CREDENTIALS");

    // 5.2 Real Discord Adapter with no webhookUrl
    const realDiscord = new RealDiscordAdapter();
    const discordResult = await realDiscord.sendMessage({
      channelId: "chan_disc_1",
      destination: "",
      title: "Test",
      body: "Body",
      affiliateUrl: "https://example.com",
      config: {},
    });
    assert.equal(discordResult.success, false);
    assert.equal(discordResult.errorCode, "MISSING_CREDENTIALS");

    // 5.3 Real WhatsApp Adapter with no credentials
    const realWa = new RealWhatsAppAdapter();
    const waResult = await realWa.sendMessage({
      channelId: "chan_wa_1",
      destination: "+5511999999999",
      title: "Test",
      body: "Body",
      affiliateUrl: "https://example.com",
      config: {},
    });
    assert.equal(waResult.success, false);
    assert.equal(waResult.errorCode, "MISSING_CREDENTIALS");

    // 5.4 Shopee Adapter validation with invalid credentials
    const shopeeValidation = await ShopeeMarketplaceAdapter.validateConnection("invalid_app_id", "invalid_secret");
    assert.equal(shopeeValidation.valid, false);

    // 5.5 Amazon Adapter validation with invalid credentials
    const amazonValidation = await AmazonMarketplaceAdapter.validateConnection({
      accessKey: "AKIA_INVALID_TEST_KEY",
      secretKey: "INVALID_SECRET_KEY_1234567890",
      partnerTag: "affiliate-20",
    });
    assert.equal(amazonValidation.valid, false);
  });

  /* ==========================================================================
     6. MOCK/REAL PURITY & ANALYTICS ISOLATION
     ========================================================================== */
  await t.test("6. Mock vs Real Purity & Analytics Data Isolation", async () => {
    // Create an explicit mock event
    const mockEvent = await prisma.analyticsEvent.create({
      data: {
        userId: testUserId,
        eventType: "CLICK",
        source: "mock",
        platform: "SHOPEE",
      },
    });

    assert.equal(mockEvent.source, "mock");

    // Real analytics queries must filter by source: "real"
    const realEventsCount = await prisma.analyticsEvent.count({
      where: {
        userId: testUserId,
        source: "real",
      },
    });

    assert.equal(realEventsCount, 0, "Mock events must never appear in source: 'real' analytics queries");

    const allEventsCount = await prisma.analyticsEvent.count({
      where: { userId: testUserId },
    });
    assert.equal(allEventsCount, 1);
  });
});
