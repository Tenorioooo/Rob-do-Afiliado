import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { TelegramChannelAdapter } from "@/integrations/channels/telegram.adapter";
import { IntegrationActivationService } from "@/services/integrations/activation-service";
import { CredentialService } from "@/services/integrations/credential-service";
import { WebhookPipelineService } from "@/services/integrations/webhook-pipeline";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";

test("Phase 7.3: Assisted Real Homologation, Telegram Production Integration & Immutable Verification Evidence", async (t) => {
  // Helper to create unique user per subtest to respect @@unique([userId, provider])
  const createTestUser = async (suffix: string) => {
    const id = `user_p73_${suffix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await prisma.user.create({
      data: {
        id,
        email: `${id}@example.com`,
        name: `Phase 7.3 User ${suffix}`,
        passwordHash: "hash123",
      },
    });
    return id;
  };

  /* ==========================================================================
     1. TELEGRAM CHANNEL ADAPTER (OFFICIAL TELEGRAM BOT API ENDPOINTS)
     ========================================================================== */
  await t.test("1. Telegram Adapter: getMe, sendMessage, sendPhoto, setWebhook & deleteWebhook", async () => {
    // 1.1 validateConnection (getMe)
    const validMe = await TelegramChannelAdapter.validateConnection("123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567");
    assert.equal(validMe.valid, true);
    assert.ok(validMe.botId);
    assert.ok(validMe.username);

    // 1.2 validateConnection failure with bad token
    const invalidMe = await TelegramChannelAdapter.validateConnection("invalid_token");
    assert.equal(invalidMe.valid, false);
    assert.ok(invalidMe.errorMessage);

    // 1.3 sendMessage with HTML formatting
    const sendRes = await TelegramChannelAdapter.sendMessage({
      botToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567",
      chatId: "-100123456789",
      text: "<b>🤖 Affiliate AI</b> — Oferta Exclusiva!",
      parseMode: "HTML",
    });
    assert.equal(sendRes.success, true);
    assert.ok(sendRes.messageId);

    // 1.4 sendPhoto with caption
    const photoRes = await TelegramChannelAdapter.sendPhoto({
      botToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567",
      chatId: "-100123456789",
      photoUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      caption: "<b>Smartwatch em Promoção</b>",
      parseMode: "HTML",
    });
    assert.equal(photoRes.success, true);
    assert.ok(photoRes.messageId);

    // 1.5 setWebhook with secret token
    const setWebhookRes = await TelegramChannelAdapter.setWebhook({
      botToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567",
      webhookUrl: "https://affiliate.ai/api/webhooks/telegram/conn_123",
      secretToken: "secret_token_abc123",
    });
    assert.equal(setWebhookRes.success, true);

    // 1.6 deleteWebhook
    const deleteWebhookRes = await TelegramChannelAdapter.deleteWebhook("123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567");
    assert.equal(deleteWebhookRes.success, true);
  });

  /* ==========================================================================
     2. 8-STEP GUIDED HOMOLOGATION PIPELINE & EVIDENCE PERSISTENCE
     ========================================================================== */
  await t.test("2. Complete 8-Step Homologation Flow with Stored Verifications", async () => {
    const testUserId = await createTestUser("step_flow");

    // Create unconfigured Telegram connection in DB
    const conn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "NOT_CONFIGURED",
        authType: "BOT_TOKEN",
      },
    });

    // Step 1: Configure Credentials
    const step1 = await IntegrationActivationService.configureCredentials({
      userId: testUserId,
      connectionId: conn.id,
      credentials: {
        botToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567",
        webhookSecret: "secret_token_phase73",
      },
      ipAddress: "127.0.0.1",
    });
    assert.equal(step1.success, true);
    assert.ok(step1.progress.stepsCompleted.includes("CONFIGURE"));

    // Verify evidence was stored in DB
    const verif1 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "CONFIGURE" },
    });
    assert.ok(verif1);
    assert.equal(verif1.status, "PASSED");
    assert.equal(verif1.capability, "CREDENTIALS_ENCRYPTED");

    // Step 2: Preflight Diagnostics
    const step2 = await IntegrationActivationService.runPreflightStep({
      userId: testUserId,
      connectionId: conn.id,
      ipAddress: "127.0.0.1",
    });
    assert.equal(step2.success, true);
    assert.equal(step2.preflight.overallStatus, "PASS");
    assert.ok(step2.progress.stepsCompleted.includes("PREFLIGHT"));

    const verif2 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "PREFLIGHT" },
    });
    assert.ok(verif2);
    assert.equal(verif2.status, "PASSED");

    // Step 3: Health Check (getMe)
    const step3 = await IntegrationActivationService.runHealthCheckStep({
      userId: testUserId,
      connectionId: conn.id,
      ipAddress: "127.0.0.1",
    });
    assert.equal(step3.success, true);
    assert.ok(step3.progress.stepsCompleted.includes("HEALTH_CHECK"));
    assert.ok(step3.progress.botUsername);

    const verif3 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "HEALTH_CHECK" },
    });
    assert.ok(verif3);
    assert.equal(verif3.status, "PASSED");

    // Step 4: Configure Destination
    // 4.1 Rejects invalid destination
    await assert.rejects(
      async () => {
        await IntegrationActivationService.configureDestinationStep({
          userId: testUserId,
          connectionId: conn.id,
          destination: "invalid destination with spaces",
        });
      },
      { message: /Formato de destino inválido para o Telegram/ }
    );

    // 4.2 Valid Chat ID
    const step4 = await IntegrationActivationService.configureDestinationStep({
      userId: testUserId,
      connectionId: conn.id,
      destination: "-1001234567890",
      ipAddress: "127.0.0.1",
    });
    assert.equal(step4.success, true);
    assert.equal(step4.destination, "-1001234567890");
    assert.ok(step4.progress.stepsCompleted.includes("DESTINATION"));
    assert.equal(step4.progress.targetDestination, "-1001234567890");

    const verif4 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "DESTINATION" },
    });
    assert.ok(verif4);
    assert.equal(verif4.status, "PASSED");
    assert.equal(verif4.externalReference, "-1001234567890");

    // Step 5: Test Send Message
    // 5.1 Rejects without confirmed: true
    await assert.rejects(
      async () => {
        await IntegrationActivationService.executeTestSend({
          userId: testUserId,
          connectionId: conn.id,
          confirmed: false,
        });
      },
      { message: /Confirmação explícita necessária/ }
    );

    // 5.2 Dispatches with confirmed: true
    const step5 = await IntegrationActivationService.executeTestSend({
      userId: testUserId,
      connectionId: conn.id,
      confirmed: true,
      ipAddress: "127.0.0.1",
    });
    assert.equal(step5.success, true);
    assert.ok(step5.messageId);
    assert.ok(step5.progress.stepsCompleted.includes("TEST_SEND"));

    const verif5 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "TEST_SEND" },
    });
    assert.ok(verif5);
    assert.equal(verif5.status, "PASSED");
    assert.ok(verif5.externalReference);

    // Step 6: Configure Webhook
    const step6 = await IntegrationActivationService.configureWebhookStep({
      userId: testUserId,
      connectionId: conn.id,
      webhookUrl: "https://affiliate.ai/api/webhooks/telegram/" + conn.id,
      secretToken: "secret_token_phase73",
      ipAddress: "127.0.0.1",
    });
    assert.equal(step6.success, true);
    assert.ok(step6.progress.stepsCompleted.includes("WEBHOOK"));

    // Step 7: Validate Webhook
    const step7 = await IntegrationActivationService.validateWebhookStep({
      userId: testUserId,
      connectionId: conn.id,
      ipAddress: "127.0.0.1",
    });
    assert.equal(step7.success, true);
    assert.ok(step7.progress.stepsCompleted.includes("WEBHOOK_VALIDATE"));

    // Step 8: Promote to VERIFIED_REAL
    const step8 = await IntegrationActivationService.promoteToVerifiedReal({
      userId: testUserId,
      connectionId: conn.id,
      enableForAutopilot: true,
      ipAddress: "127.0.0.1",
    });
    assert.equal(step8.success, true);
    assert.equal(step8.progress.isVerifiedReal, true);
    assert.equal(step8.progress.currentStatus, "VERIFIED_REAL");
    assert.equal(step8.progress.enabledForAutopilot, true);

    const verif8 = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "PROMOTE_TO_VERIFIED_REAL" },
    });
    assert.ok(verif8);
    assert.equal(verif8.status, "PASSED");

    // Fetch all verifications
    const allVerifications = await IntegrationActivationService.getVerifications(testUserId, conn.id);
    assert.ok(allVerifications.length >= 7);
  });

  /* ==========================================================================
     3. STRICT ANTI-FABRICATION / EVIDENCE CHECK IN PROMOTION
     ========================================================================== */
  await t.test("3. Promotion Guard: Refuses promotion if no physical verification evidence exists", async () => {
    const testUserId = await createTestUser("anti_fake");

    // Create a connection that fakes completed steps in metadata but has 0 records in integration_verifications table
    const fakeConn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "CONNECTED",
        authType: "BOT_TOKEN",
        metadata: JSON.stringify({
          stepsCompleted: ["CONFIGURE", "PREFLIGHT", "HEALTH_CHECK", "DESTINATION", "TEST_SEND"],
        }),
      },
    });

    // Attempting to promote without stored verifications in DB must throw!
    await assert.rejects(
      async () => {
        await IntegrationActivationService.promoteToVerifiedReal({
          userId: testUserId,
          connectionId: fakeConn.id,
        });
      },
      { message: /nenhuma evidência imutável de verificação registrada no banco de dados/ }
    );
  });

  /* ==========================================================================
     4. TELEGRAM WEBHOOK SECRET TOKEN VALIDATION
     ========================================================================== */
  await t.test("4. Telegram Webhook: Validates X-Telegram-Bot-Api-Secret-Token securely", async () => {
    const testUserId = await createTestUser("webhook_test");

    const encCreds = CredentialService.encrypt({
      botToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567",
      webhookSecret: "super_secret_telegram_token_123",
    });

    const conn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "VERIFIED_REAL",
        authType: "BOT_TOKEN",
        encryptedCredentials: encCreds,
      },
    });

    const payload = {
      update_id: 99887766,
      message: {
        message_id: 101,
        chat: { id: -100123456789, title: "Canal Promo" },
        text: "/start",
        date: Math.floor(Date.now() / 1000),
      },
    };
    const rawBody = JSON.stringify(payload);

    // 4.1 Rejects update with incorrect secret token
    const badHeaders = new Headers();
    badHeaders.set("x-telegram-bot-api-secret-token", "wrong_secret_token");

    const badRes = await WebhookPipelineService.ingestWebhook({
      connectionId: conn.id,
      provider: "TELEGRAM",
      rawBody,
      parsedPayload: payload,
      headers: badHeaders,
    });
    assert.equal(badRes.success, false);
    assert.match(badRes.errorMessage || "", /Assinatura/);

    // 4.2 Accepts update with matching secret token
    const goodHeaders = new Headers();
    goodHeaders.set("x-telegram-bot-api-secret-token", "super_secret_telegram_token_123");

    const goodRes = await WebhookPipelineService.ingestWebhook({
      connectionId: conn.id,
      provider: "TELEGRAM",
      rawBody,
      parsedPayload: payload,
      headers: goodHeaders,
    });
    assert.equal(goodRes.success, true);
    assert.ok(goodRes.eventId);
  });

  /* ==========================================================================
     5. DISPATCH GUARD INTEGRATION & KILL SWITCH FOR TELEGRAM
     ========================================================================== */
  await t.test("5. Dispatch Guard: Checks kill switches and channel verification status", async () => {
    const testUserId = await createTestUser("dispatch_guard");

    // Set Telegram connection
    await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "VERIFIED_REAL",
        authType: "BOT_TOKEN",
        metadata: JSON.stringify({ enabledForAutopilot: true }),
      },
    });

    const chan = await prisma.channel.create({
      data: {
        userId: testUserId,
        name: "Canal Telegram Produção",
        type: "TELEGRAM",
        provider: "telegram-api",
        identifier: "@canal_prod",
        active: true,
        status: "CONNECTED",
      },
    });

    // 5.1 When global switch is false -> dispatch blocked
    DispatchGuardService.setGlobalRealDispatchEnabled(false);
    const check1 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: chan.id,
      provider: "TELEGRAM",
    });
    assert.equal(check1.allowed, false);
    assert.match(check1.blockingReason || "", /REAL_DISPATCH_ENABLED/);

    // 5.2 When global is true but telegram kill switch is false -> blocked
    DispatchGuardService.setGlobalRealDispatchEnabled(true);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", false);
    const check2 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: chan.id,
      provider: "TELEGRAM",
    });
    assert.equal(check2.allowed, false);
    assert.match(check2.blockingReason || "", /desativado individualmente/);

    // 5.3 When both enabled -> allowed
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", true);
    const check3 = await DispatchGuardService.canDispatchLive({
      userId: testUserId,
      channelId: chan.id,
      provider: "TELEGRAM",
    });
    assert.equal(check3.allowed, true);

    // Reset back to safe defaults
    DispatchGuardService.setGlobalRealDispatchEnabled(false);
    DispatchGuardService.setProviderRealDispatchEnabled("TELEGRAM", false);
  });

  /* ==========================================================================
     6. LIVE_INTEGRATION_TEST HANDLING
     ========================================================================== */
  await t.test("6. LIVE_INTEGRATION_TEST flag assigns appropriate source on verifications", async () => {
    const testUserId = await createTestUser("live_flag");

    const conn = await prisma.integrationConnection.create({
      data: {
        userId: testUserId,
        provider: "TELEGRAM",
        type: "CHANNEL",
        status: "CONNECTING",
        authType: "BOT_TOKEN",
      },
    });

    // Default mock execution
    process.env.LIVE_INTEGRATION_TEST = "false";
    await IntegrationActivationService.recordVerification({
      userId: testUserId,
      connectionId: conn.id,
      provider: "TELEGRAM",
      capability: "HEALTH_CHECK",
      step: "HEALTH_CHECK",
      status: "PASSED",
      performedBy: "TEST_RUNNER",
    });

    const mockVerif = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "HEALTH_CHECK" },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(mockVerif?.source, "MOCK");

    // Live execution simulated
    process.env.LIVE_INTEGRATION_TEST = "true";
    await IntegrationActivationService.recordVerification({
      userId: testUserId,
      connectionId: conn.id,
      provider: "TELEGRAM",
      capability: "HEALTH_CHECK",
      step: "HEALTH_CHECK",
      status: "PASSED",
      performedBy: "TEST_RUNNER",
    });

    const realVerif = await prisma.integrationVerification.findFirst({
      where: { connectionId: conn.id, step: "HEALTH_CHECK" },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(realVerif?.source, "REAL");

    // Reset env
    delete process.env.LIVE_INTEGRATION_TEST;
  });
});
