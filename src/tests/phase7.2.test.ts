import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";
import { IntegrationActivationService } from "@/services/integrations/activation-service";
import { CredentialService } from "@/services/integrations/credential-service";
import { AutopilotSafetyGate } from "@/domain/autopilot/safety-gate";
import { ChannelDispatcher } from "@/domain/dispatcher/channel-dispatcher";

test("Phase 7.2: Controlled Real Activation, Kill Switches & Production Homologation", async (t) => {
  const testUserId = `user_phase7_2_${Date.now()}`;

  // Setup: Create test user
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `${testUserId}@example.com`,
      name: "Phase 7.2 Test User",
      passwordHash: "hash123",
    },
  });

  // Ensure clean runtime state for tests
  DispatchGuardService.resetRuntimeState();

  /* ==========================================================================
     1. GLOBAL & PROVIDER KILL SWITCHES
     ========================================================================== */
  await t.test("1. Global and Provider Kill Switch Enforcement", async () => {
    // 1.1 By default, global real dispatch is disabled
    DispatchGuardService.setGlobalRealDispatchEnabled(false);
    assert.equal(DispatchGuardService.isGlobalRealDispatchEnabled(), false);

    // Create a real channel in database
    const realChannel = await prisma.channel.create({
      data: {
        userId: testUserId,
        name: "Canal Telegram VIP",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "@ofertas_vip",
        active: true,
        status: "CONNECTED",
      },
    });

    // Create a connection in DB (unverified initially)
    const conn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "CONNECTING",
        authType: "BOT_TOKEN",
      },
    });

    // 1.2 Dispatch blocked because global switch is false
    const check1 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: realChannel.id,
      provider: "TELEGRAM",
    });
    assert.equal(check1.allowed, false);
    assert.ok(check1.blockingReason?.includes("REAL_DISPATCH_ENABLED = false"));

    // 1.3 Enable global switch, but provider switch is disabled
    DispatchGuardService.setGlobalRealDispatchEnabled(true);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", false);

    const check2 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: realChannel.id,
      provider: "TELEGRAM",
    });
    assert.equal(check2.allowed, false);
    assert.ok(check2.blockingReason?.includes("desativado individualmente"));

    // 1.4 Enable provider switch, but connection is not VERIFIED_REAL
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", true);

    const check3 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: realChannel.id,
      provider: "TELEGRAM",
    });
    assert.equal(check3.allowed, false);
    assert.ok(check3.blockingReason?.includes("VERIFIED_REAL"));

    // 1.5 Update connection to VERIFIED_REAL with Autopilot permission
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: {
        status: "VERIFIED_REAL",
        metadata: JSON.stringify({ enabledForAutopilot: true }),
      },
    });

    const check4 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: realChannel.id,
      provider: "TELEGRAM",
    });
    assert.equal(check4.allowed, true);

    // 1.6 If Autopilot permission is revoked in connection metadata, block
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: {
        metadata: JSON.stringify({ enabledForAutopilot: false }),
      },
    });

    const check5 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: realChannel.id,
      provider: "TELEGRAM",
    });
    assert.equal(check5.allowed, false);
    assert.ok(check5.blockingReason?.includes("permissão do Autopiloto"));
  });

  /* ==========================================================================
     2. EMERGENCY STOP MECHANISM
     ========================================================================== */
  await t.test("2. Emergency Stop Execution & Queue Invalidation", async () => {
    // Re-enable live dispatch
    DispatchGuardService.setGlobalRealDispatchEnabled(true);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", true);

    // Create a dummy live scheduled publication
    const product = await prisma.product.create({
      data: {
        externalId: `prod_phase72_${Date.now()}`,
        platform: "SHOPEE",
        title: "Smartphone Pro Max",
        category: "Eletrônicos",
        imageUrl: "https://example.com/phone.jpg",
        originalPrice: 2000,
        currentPrice: 1500,
        discountPercent: 25,
        commissionRate: 0.1,
        commissionAmount: 150,
        url: "https://shopee.com.br/product-123",
      },
    });

    const offer = await prisma.offer.create({
      data: {
        userId: testUserId,
        productId: product.id,
        title: "Promoção Imperdível!",
        body: "Aproveite 25% OFF",
        cta: "Compre agora",
        status: "APPROVED",
      },
    });

    const channel = await prisma.channel.findFirst({
      where: { userId: testUserId },
    });

    const pub = await prisma.publication.create({
      data: {
        idempotencyKey: `pub_emergency_${Date.now()}`,
        userId: testUserId,
        offerId: offer.id,
        channelId: channel!.id,
        status: "SCHEDULED",
        source: "real",
        provider: "telegram-api",
        scheduledAt: new Date(Date.now() + 3600000),
      },
    });

    // Trigger Emergency Stop
    const stopResult = await DispatchGuardService.triggerEmergencyStop({
      userId: testUserId,
      reason: "Auditoria de segurança de teste acionada.",
    });

    assert.equal(stopResult.success, true);
    assert.ok(stopResult.canceledJobsCount >= 1);
    assert.equal(DispatchGuardService.isGlobalRealDispatchEnabled(), false);
    assert.equal(DispatchGuardService.isProviderRealDispatchEnabled("TELEGRAM"), false);

    // Verify publication status was transitioned to FAILED with emergency reason
    const canceledPub = await prisma.publication.findUnique({
      where: { id: pub.id },
    });
    assert.equal(canceledPub?.status, "FAILED");
    assert.equal(canceledPub?.errorCode, "EMERGENCY_STOP");

    // Verify audit log record exists
    const auditRecord = await prisma.integrationAuditLog.findFirst({
      where: { userId: testUserId, action: "EMERGENCY_STOP" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(auditRecord);
  });

  /* ==========================================================================
     3. ACTIVATION STATE MACHINE (STEPS 1 TO 6)
     ========================================================================== */
  await t.test("3. Step-by-Step Activation Lifecycle Engine", async () => {
    // Create new connection for activation test
    const testConn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "DISCORD",
        type: "CHANNEL",
        status: "NOT_CONFIGURED",
        authType: "WEBHOOK_URL",
      },
    });

    // Step 1: Configure Credentials
    const step1 = await IntegrationActivationService.configureCredentials({
      userId: testUserId,
      connectionId: testConn.id,
      credentials: {
        webhookUrl: "https://discord.com/api/webhooks/1234567890/test_token_abcdefg",
      },
    });
    assert.equal(step1.success, true);
    assert.ok(step1.progress.stepsCompleted.includes("CONFIGURE"));

    // Step 2: Preflight
    const step2 = await IntegrationActivationService.runPreflightStep({
      userId: testUserId,
      connectionId: testConn.id,
    });
    assert.ok(step2.preflight.checks.length > 0);
    assert.ok(step2.progress.stepResults.PREFLIGHT);

    // Step 3: Health Check
    const step3 = await IntegrationActivationService.runHealthCheckStep({
      userId: testUserId,
      connectionId: testConn.id,
    });
    assert.ok(step3.progress.stepResults.HEALTH_CHECK);

    // Step 4: Test Send requires explicit confirmation
    await assert.rejects(
      async () => {
        await IntegrationActivationService.executeTestSend({
          userId: testUserId,
          connectionId: testConn.id,
          confirmed: false, // Fails because unconfirmed
        });
      },
      /confirmação explícita/i
    );

    // Step 5: Promotion to VERIFIED_REAL is blocked when preflight/health check didn't pass with dummy creds
    await assert.rejects(
      async () => {
        await IntegrationActivationService.promoteToVerifiedReal({
          userId: testUserId,
          connectionId: testConn.id,
          enableForAutopilot: true,
        });
      },
      /etapas pendentes/i
    );

    // Simulate completion of verification steps in metadata
    const currentConn = await prisma.integrationConnection.findUnique({ where: { id: testConn.id } });
    const meta = JSON.parse(currentConn?.metadata || "{}");
    meta.stepsCompleted = ["CONFIGURE", "PREFLIGHT", "HEALTH_CHECK"];
    await prisma.integrationConnection.update({
      where: { id: testConn.id },
      data: { metadata: JSON.stringify(meta) },
    });

    const promotion = await IntegrationActivationService.promoteToVerifiedReal({
      userId: testUserId,
      connectionId: testConn.id,
      enableForAutopilot: true,
    });
    assert.equal(promotion.success, true);
    assert.equal(promotion.progress.isVerifiedReal, true);
    assert.equal(promotion.progress.enabledForAutopilot, true);

    // Step 6: Toggle Autopilot Permission
    const toggle = await IntegrationActivationService.toggleAutopilotPermission({
      userId: testUserId,
      connectionId: testConn.id,
      enabled: false,
    });
    assert.equal(toggle.enabledForAutopilot, false);

    // Step 7: Disconnect cleanly
    const disconnect = await IntegrationActivationService.disconnectConnection({
      userId: testUserId,
      connectionId: testConn.id,
    });
    assert.equal(disconnect.success, true);

    const afterDisconnect = await prisma.integrationConnection.findUnique({
      where: { id: testConn.id },
    });
    assert.equal(afterDisconnect?.status, "DISCONNECTED");
    assert.equal(afterDisconnect?.encryptedCredentials, null);
  });

  /* ==========================================================================
     4. AUTOPILOT SAFETY GATE LIVE GATING
     ========================================================================== */
  await t.test("4. AutopilotSafetyGate Real Dispatch Gating", () => {
    // 4.1 Mock channel passes safely
    const mockEvaluation = AutopilotSafetyGate.evaluate({
      userId: testUserId,
      offer: {
        id: "offer_1",
        userId: testUserId,
        status: "APPROVED",
        validationStatus: "PASS",
        productId: "prod_1",
      },
      affiliateLink: {
        id: "link_1",
        userId: testUserId,
        active: true,
        affiliateUrl: "https://shopee.com.br/link",
      },
      channel: {
        id: "chan_mock",
        userId: testUserId,
        active: true,
        status: "CONNECTED",
        provider: "mock",
      },
      allowedStartTime: "00:00",
      allowedEndTime: "23:59",
      todayPublicationsCount: 0,
      maxOffersPerDay: 10,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(mockEvaluation.passed, true);

    // 4.2 Real channel blocked when global real dispatch is disabled
    const liveEvaluationBlocked = AutopilotSafetyGate.evaluate({
      userId: testUserId,
      offer: {
        id: "offer_1",
        userId: testUserId,
        status: "APPROVED",
        validationStatus: "PASS",
        productId: "prod_1",
      },
      affiliateLink: {
        id: "link_1",
        userId: testUserId,
        active: true,
        affiliateUrl: "https://shopee.com.br/link",
      },
      channel: {
        id: "chan_real",
        userId: testUserId,
        active: true,
        status: "CONNECTED",
        provider: "telegram-api",
        isVerifiedReal: true,
      },
      allowedStartTime: "00:00",
      allowedEndTime: "23:59",
      isGlobalRealDispatchEnabled: false, // Blocked
      todayPublicationsCount: 0,
      maxOffersPerDay: 10,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(liveEvaluationBlocked.passed, false);
    assert.ok(liveEvaluationBlocked.blockingReasons.some((r) => r.includes("envio real global está desativado")));

    // 4.3 Real channel blocked when not VERIFIED_REAL
    const liveUnverifiedBlocked = AutopilotSafetyGate.evaluate({
      userId: testUserId,
      offer: {
        id: "offer_1",
        userId: testUserId,
        status: "APPROVED",
        validationStatus: "PASS",
        productId: "prod_1",
      },
      affiliateLink: {
        id: "link_1",
        userId: testUserId,
        active: true,
        affiliateUrl: "https://shopee.com.br/link",
      },
      channel: {
        id: "chan_real",
        userId: testUserId,
        active: true,
        status: "CONNECTED",
        provider: "telegram-api",
        isVerifiedReal: false, // Unverified
      },
      allowedStartTime: "00:00",
      allowedEndTime: "23:59",
      isGlobalRealDispatchEnabled: true,
      todayPublicationsCount: 0,
      maxOffersPerDay: 10,
      minIntervalMinutes: 15,
      duplicateCooldownHours: 24,
    });
    assert.equal(liveUnverifiedBlocked.passed, false);
    assert.ok(liveUnverifiedBlocked.blockingReasons.some((r) => r.includes("não está homologada como VERIFIED_REAL")));
  });

  /* ==========================================================================
     5. CHANNEL DISPATCHER GUARD INTEGRATION
     ========================================================================== */
  await t.test("5. ChannelDispatcher Blocks Live Dispatch When Kill Switch Is Disabled", async () => {
    DispatchGuardService.setGlobalRealDispatchEnabled(false);

    const dummyProduct = await prisma.product.create({
      data: {
        externalId: `prod_disp_${Date.now()}`,
        platform: "SHOPEE",
        title: "Test Product",
        category: "Geral",
        imageUrl: "https://example.com/img.jpg",
        originalPrice: 100,
        currentPrice: 80,
        discountPercent: 20,
        commissionRate: 0.1,
        commissionAmount: 8,
        url: "https://shopee.com.br/item-123",
      },
    });

    const dummyOffer = await prisma.offer.create({
      data: {
        userId: testUserId,
        productId: dummyProduct.id,
        title: "Super Oferta",
        body: "Confira já",
        cta: "Link",
        status: "APPROVED",
      },
    });

    const dummyChannel = await prisma.channel.create({
      data: {
        userId: testUserId,
        name: "Telegram Canal Real",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "@test_canal",
        active: true,
        status: "CONNECTED",
      },
    });

    await assert.rejects(
      async () => {
        await ChannelDispatcher.dispatch({
          userId: testUserId,
          offerId: dummyOffer.id,
          channelId: dummyChannel.id,
        });
      },
      /Disparo real bloqueado/i
    );
  });
});
