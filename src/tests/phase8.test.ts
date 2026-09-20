import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { AutopilotSafetyGate } from "@/domain/autopilot/safety-gate";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";
import { ChannelDispatcher } from "@/domain/dispatcher/channel-dispatcher";
import { CredentialService } from "@/services/integrations/credential-service";
import { AnalyticsService } from "@/services/analytics/analytics-service";

test("Phase 8: Real Dispatch Telegram, Safety Gate & First Real Autonomous Cycle", async (t) => {
  const createTestUser = async (suffix: string) => {
    const id = `user_p8_${suffix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await prisma.user.create({
      data: {
        id,
        email: `${id}@example.com`,
        name: `Phase 8 User ${suffix}`,
        passwordHash: "hash123",
      },
    });
    return id;
  };

  /* ==========================================================================
     1. SAFETY GATE: DETERMINISTIC REAL DISPATCH GATING & ERROR CODES
     ========================================================================== */
  await t.test("1. Safety Gate strictly enforces kill switches, verification and limits", async () => {
    const userId = await createTestUser("safety");

    // 1.1 Global Real Dispatch Disabled
    const globalBlocked = AutopilotSafetyGate.evaluate({
      userId,
      offer: { id: "off1", userId, status: "APPROVED", validationStatus: "VALID", productId: "prod1" },
      affiliateLink: { id: "link1", userId, active: true, affiliateUrl: "https://shopee.com/aff1" },
      channel: { id: "chan1", userId, active: true, status: "CONNECTED", provider: "telegram-api", type: "TELEGRAM", destination: "@canal_ofertas", isVerifiedReal: true },
      isGlobalRealDispatchEnabled: false,
      isProviderEnabled: true,
      todayPublicationsCount: 0,
      maxOffersPerDay: 20,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(globalBlocked.passed, false);
    assert.equal(globalBlocked.errorCode, "REAL_DISPATCH_DISABLED");

    // 1.2 Individual Provider Disabled
    const providerBlocked = AutopilotSafetyGate.evaluate({
      userId,
      offer: { id: "off1", userId, status: "APPROVED", validationStatus: "VALID", productId: "prod1" },
      affiliateLink: { id: "link1", userId, active: true, affiliateUrl: "https://shopee.com/aff1" },
      channel: { id: "chan1", userId, active: true, status: "CONNECTED", provider: "telegram-api", type: "TELEGRAM", destination: "@canal_ofertas", isVerifiedReal: true },
      isGlobalRealDispatchEnabled: true,
      isProviderEnabled: false,
      todayPublicationsCount: 0,
      maxOffersPerDay: 20,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(providerBlocked.passed, false);
    assert.equal(providerBlocked.errorCode, "TELEGRAM_DISABLED");

    // 1.3 Channel Not VERIFIED_REAL
    const unverifiedBlocked = AutopilotSafetyGate.evaluate({
      userId,
      offer: { id: "off1", userId, status: "APPROVED", validationStatus: "VALID", productId: "prod1" },
      affiliateLink: { id: "link1", userId, active: true, affiliateUrl: "https://shopee.com/aff1" },
      channel: { id: "chan1", userId, active: true, status: "CONNECTED", provider: "telegram-api", type: "TELEGRAM", destination: "@canal_ofertas", isVerifiedReal: false },
      isGlobalRealDispatchEnabled: true,
      isProviderEnabled: true,
      todayPublicationsCount: 0,
      maxOffersPerDay: 20,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(unverifiedBlocked.passed, false);
    assert.equal(unverifiedBlocked.errorCode, "INTEGRATION_NOT_VERIFIED");

    // 1.4 Missing Destination
    const missingDestBlocked = AutopilotSafetyGate.evaluate({
      userId,
      offer: { id: "off1", userId, status: "APPROVED", validationStatus: "VALID", productId: "prod1" },
      affiliateLink: { id: "link1", userId, active: true, affiliateUrl: "https://shopee.com/aff1" },
      channel: { id: "chan1", userId, active: true, status: "CONNECTED", provider: "telegram-api", type: "TELEGRAM", destination: "", isVerifiedReal: true },
      isGlobalRealDispatchEnabled: true,
      isProviderEnabled: true,
      todayPublicationsCount: 0,
      maxOffersPerDay: 20,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(missingDestBlocked.passed, false);
    assert.equal(missingDestBlocked.errorCode, "DESTINATION_NOT_CONFIGURED");

    // 1.5 Emergency Stop Active
    const emergencyBlocked = AutopilotSafetyGate.evaluate({
      userId,
      offer: { id: "off1", userId, status: "APPROVED", validationStatus: "VALID", productId: "prod1" },
      affiliateLink: { id: "link1", userId, active: true, affiliateUrl: "https://shopee.com/aff1" },
      channel: { id: "chan1", userId, active: true, status: "CONNECTED", provider: "telegram-api", type: "TELEGRAM", destination: "@canal", isVerifiedReal: true },
      isGlobalRealDispatchEnabled: true,
      isProviderEnabled: true,
      emergencyStop: true,
      todayPublicationsCount: 0,
      maxOffersPerDay: 20,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(emergencyBlocked.passed, false);
    assert.equal(emergencyBlocked.errorCode, "EMERGENCY_STOP");
  });

  /* ==========================================================================
     2. DISPATCH GUARD SERVICE: PROVIDER WHITELIST & EVIDENCE CHECK
     ========================================================================== */
  await t.test("2. DispatchGuardService validates physical database evidence and restricts non-Telegram channels", async () => {
    const userId = await createTestUser("guard");

    // Reset switches to test state
    DispatchGuardService.setGlobalRealDispatchEnabled(true);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", true);
    DispatchGuardService.setProviderRealDispatchEnabled("WHATSAPP", true);

    // Create Telegram Connection in NOT_CONFIGURED state
    const conn = await prisma.integrationConnection.create({
      data: {
        userId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "NOT_CONFIGURED",
        authType: "BOT_TOKEN",
        encryptedCredentials: CredentialService.encrypt({ botToken: "123456789:ABCdef" }),
      },
    });

    const chan = await prisma.channel.create({
      data: {
        userId,
        name: "Telegram Canal Oficial",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "-100123456789",
        destination: "-100123456789",
        active: true,
        status: "CONNECTED",
      },
    });

    // Check with unverified connection -> BLOCKED
    const checkNoEvidence = await DispatchGuardService.canDispatchLive({
      userId,
      channelId: chan.id,
      provider: "TELEGRAM",
    });
    assert.equal(checkNoEvidence.allowed, false);
    assert.equal(checkNoEvidence.errorCode, "INTEGRATION_NOT_VERIFIED");

    // Promote to VERIFIED_REAL and add physical verification record
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { status: "VERIFIED_REAL" },
    });

    await prisma.integrationVerification.create({
      data: {
        userId,
        connectionId: conn.id,
        provider: "TELEGRAM",
        capability: "HEALTH_CHECK",
        step: "HEALTH_CHECK",
        status: "PASSED",
        source: "REAL",
      },
    });

    // Check with valid verification -> ALLOWED
    const checkWithEvidence = await DispatchGuardService.canDispatchLive({
      userId,
      channelId: chan.id,
      provider: "TELEGRAM",
    });
    assert.equal(checkWithEvidence.allowed, true);

    // Check non-homologated channel (e.g. DISCORD) -> BLOCKED
    const discordChan = await prisma.channel.create({
      data: {
        userId,
        name: "Discord Canal",
        type: "DISCORD",
        provider: "discord-webhook-api",
        identifier: "123456",
        active: true,
      },
    });
    const checkDiscord = await DispatchGuardService.canDispatchLive({
      userId,
      channelId: discordChan.id,
      provider: "DISCORD",
    });
    assert.equal(checkDiscord.allowed, false);
    assert.equal(checkDiscord.errorCode, "DISCORD_DISABLED");

    // Check WhatsApp without verified connection -> INTEGRATION_NOT_FOUND
    const whatsappChan = await prisma.channel.create({
      data: {
        userId,
        name: "WhatsApp Grupo",
        type: "WHATSAPP",
        provider: "whatsapp-universal-api",
        identifier: "1203630283749@g.us",
        active: true,
      },
    });
    const checkWhatsApp = await DispatchGuardService.canDispatchLive({
      userId,
      channelId: whatsappChan.id,
      provider: "WHATSAPP",
    });
    assert.equal(checkWhatsApp.allowed, false);
    assert.equal(checkWhatsApp.errorCode, "INTEGRATION_NOT_FOUND");
  });

  /* ==========================================================================
     3. REAL DISPATCH EXECUTION, TELEGRAM MESSAGE ID & ANALYTICS RECORDING
     ========================================================================== */
  await t.test("3. ChannelDispatcher executes Telegram Real Dispatch, stores telegramMessageId & tracks Analytics", async () => {
    const userId = await createTestUser("dispatch");

    DispatchGuardService.setGlobalRealDispatchEnabled(true);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", true);

    // 1. Create Verified Telegram Connection
    const conn = await prisma.integrationConnection.create({
      data: {
        userId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "VERIFIED_REAL",
        authType: "BOT_TOKEN",
        encryptedCredentials: CredentialService.encrypt({
          botToken: "123456789:ABC_test_token_phase8",
          chatId: "-1009988776655",
        }),
      },
    });

    await prisma.integrationVerification.create({
      data: {
        userId,
        connectionId: conn.id,
        provider: "TELEGRAM",
        capability: "BOT_MESSAGES",
        step: "TEST_SEND",
        status: "PASSED",
        source: "REAL",
      },
    });

    // 2. Create Channel
    const channel = await prisma.channel.create({
      data: {
        userId,
        name: "Ofertas Telegram VIP",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "-1009988776655",
        destination: "-1009988776655",
        active: true,
        status: "CONNECTED",
      },
    });

    // 3. Create Product & AffiliateLink & Offer
    const product = await prisma.product.create({
      data: {
        externalId: `p8_prod_${Date.now()}`,
        platform: "SHOPEE",
        title: "Fone de Ouvido Bluetooth TWS",
        category: "Eletrônicos",
        currentPrice: 89.90,
        originalPrice: 149.90,
        discountPercent: 40.0,
        commissionRate: 0.10,
        commissionAmount: 8.99,
        url: "https://shopee.com.br/product/123",
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      },
    });

    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        userId,
        productId: product.id,
        platform: "SHOPEE",
        originalUrl: product.url,
        affiliateUrl: "https://aff.link/shopee-tws-p8",
        shortCode: `p8_${Date.now()}`,
        source: "mock",
      },
    });

    const offer = await prisma.offer.create({
      data: {
        userId,
        productId: product.id,
        affiliateLinkId: affiliateLink.id,
        channelId: channel.id,
        title: "🔥 SUPER OFERTA: Fone Bluetooth TWS",
        body: "De R$ 149,90 por apenas R$ 89,90! Desconto de 40% por tempo limitado.",
        cta: "🛒 Compre agora com frete reduzido!",
        style: "DESCONTO",
        status: "APPROVED",
        validationStatus: "VALID",
      },
    });

    // 4. Execute Real Dispatch
    const { publication, result } = await ChannelDispatcher.dispatch({
      userId,
      offerId: offer.id,
      channelId: channel.id,
    });

    assert.equal(result.success, true);
    assert.ok(result.providerMessageId);
    assert.equal(publication.status, "PUBLISHED");
    assert.equal(publication.source, "real");
    assert.equal(publication.providerMessageId, result.providerMessageId);

    // 5. Verify Publication DB Record
    const dbPub = await prisma.publication.findUnique({
      where: { id: publication.id },
    });
    assert.ok(dbPub?.publishedAt);
    assert.equal(dbPub?.providerMessageId, result.providerMessageId);

    // 6. Verify Analytics Event
    const analyticsEvents = await prisma.analyticsEvent.findMany({
      where: { publicationId: publication.id, eventType: "PUBLICATION" },
    });
    assert.equal(analyticsEvents.length, 1);
    assert.equal(analyticsEvents[0].source, "real");
    assert.equal(analyticsEvents[0].channelId, channel.id);
    assert.equal(analyticsEvents[0].offerId, offer.id);

    const meta = JSON.parse(analyticsEvents[0].metadata || "{}");
    assert.equal(meta.telegramMessageId, result.providerMessageId);
    assert.equal(meta.provider, "TELEGRAM");
  });

  /* ==========================================================================
     4. IDEMPOTENCY & DUPLICATE DISPATCH PREVENTION
     ========================================================================== */
  await t.test("4. Idempotency prevents duplicate dispatch of same offer to same channel", async () => {
    const userId = await createTestUser("idempotency");

    const channel = await prisma.channel.create({
      data: {
        userId,
        name: "Telegram Idempotency Test",
        type: "TELEGRAM",
        provider: "mock",
        identifier: "-10011223344",
        active: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        externalId: `p8_idem_${Date.now()}`,
        platform: "AMAZON",
        title: "Echo Dot 5ª Geração",
        category: "Eletrônicos",
        currentPrice: 350.0,
        originalPrice: 429.0,
        discountPercent: 18.0,
        commissionRate: 0.08,
        commissionAmount: 28.0,
        url: "https://amazon.com.br/dp/B09B8V1LZ3",
        imageUrl: "https://images.unsplash.com/photo-1543512214-318c7553f230",
      },
    });

    const offer = await prisma.offer.create({
      data: {
        userId,
        productId: product.id,
        title: "Echo Dot 5 em Promoção",
        body: "Smart speaker com Alexa com som incrível.",
        cta: "Garanta já o seu!",
        status: "APPROVED",
      },
    });

    // First dispatch -> OK
    const firstDispatch = await ChannelDispatcher.dispatch({
      userId,
      offerId: offer.id,
      channelId: channel.id,
    });
    assert.equal(firstDispatch.result.success, true);

    // Second dispatch without forceResend -> throws duplicate error
    await assert.rejects(
      async () => {
        await ChannelDispatcher.dispatch({
          userId,
          offerId: offer.id,
          channelId: channel.id,
        });
      },
      (err: any) => err.message.includes("já foi publicada com sucesso")
    );
  });

  /* ==========================================================================
     5. ERROR CLASSIFICATION & FATAL ERROR HANDLING
     ========================================================================== */
  await t.test("5. Fatal 4xx errors are immediately marked as FAILED and not retried", async () => {
    const userId = await createTestUser("errors");

    const channel = await prisma.channel.create({
      data: {
        userId,
        name: "Telegram Broken Token",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "-100123",
        config: JSON.stringify({ botToken: "invalid_token" }),
        active: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        externalId: `p8_err_${Date.now()}`,
        platform: "MERCADO_LIVRE",
        title: "Smart TV 50 4K",
        category: "Eletrônicos",
        currentPrice: 1999.0,
        originalPrice: 2499.0,
        discountPercent: 20.0,
        commissionRate: 0.05,
        commissionAmount: 99.95,
        url: "https://mercadolivre.com.br/item123",
        imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
      },
    });

    const offer = await prisma.offer.create({
      data: {
        userId,
        productId: product.id,
        title: "Smart TV 50 4K em Oferta",
        body: "Excelente imagem 4K UHD com HDR10.",
        cta: "Aproveite a oferta!",
        status: "APPROVED",
      },
    });

    // Mock connection
    await prisma.integrationConnection.create({
      data: {
        userId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "VERIFIED_REAL",
        authType: "BOT_TOKEN",
        encryptedCredentials: CredentialService.encrypt({ botToken: "invalid_token" }),
      },
    });

    await prisma.integrationVerification.create({
      data: {
        userId,
        connectionId: (await prisma.integrationConnection.findFirst({ where: { userId } }))!.id,
        provider: "TELEGRAM",
        capability: "BOT_MESSAGES",
        step: "TEST_SEND",
        status: "PASSED",
        source: "REAL",
      },
    });

    const { publication, result } = await ChannelDispatcher.dispatch({
      userId,
      offerId: offer.id,
      channelId: channel.id,
    });

    assert.equal(result.success, false);
    assert.equal(publication.status, "FAILED");
    assert.equal(publication.retryCount, 1);
  });
});
