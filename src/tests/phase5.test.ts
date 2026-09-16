import test from "node:test";
import assert from "node:assert/strict";
import { PriceSignalService } from "../domain/autopilot/price-signals";
import { ChannelBalancer } from "../domain/autopilot/channel-balancer";
import { AutopilotSafetyGate } from "../domain/autopilot/safety-gate";
import { prisma } from "../lib/db/prisma";
import { AutopilotService } from "../services/autopilot/autopilot-service";
import { NotificationService } from "../services/notifications/notification-service";
import { AutopilotWorker } from "../services/autopilot/autopilot-worker";

test("Phase 5: Price Change Signals & Snapshots", async (t) => {
  await t.test("1. calculates PRICE_DROP and significant drop correctly", () => {
    const snapshots = [
      {
        currentPrice: 150.0,
        originalPrice: 200.0,
        observedAt: new Date(Date.now() - 3600000),
      },
    ];

    const result = PriceSignalService.calculateSignal(120.0, snapshots);
    assert.equal(result.signal, "PRICE_DROP");
    assert.equal(result.previousPrice, 150.0);
    assert.equal(result.currentPrice, 120.0);
    assert.equal(result.priceDelta, -30.0);
    assert.equal(result.percentChange, -20.0);
    assert.equal(result.isSignificantDrop, true);
  });

  await t.test("2. calculates PRICE_INCREASE correctly", () => {
    const snapshots = [
      {
        currentPrice: 100.0,
        originalPrice: 150.0,
        observedAt: new Date(Date.now() - 3600000),
      },
    ];

    const result = PriceSignalService.calculateSignal(130.0, snapshots);
    assert.equal(result.signal, "PRICE_INCREASE");
    assert.equal(result.priceDelta, 30.0);
    assert.equal(result.percentChange, 30.0);
    assert.equal(result.isSignificantDrop, false);
  });

  await t.test("3. returns NO_CHANGE when no previous snapshots or price is identical", () => {
    const resultNoSnapshots = PriceSignalService.calculateSignal(100.0, []);
    assert.equal(resultNoSnapshots.signal, "NO_CHANGE");
    assert.equal(resultNoSnapshots.previousPrice, null);

    const resultSamePrice = PriceSignalService.calculateSignal(100.0, [
      { currentPrice: 100.0, originalPrice: 100.0, observedAt: new Date() },
    ]);
    assert.equal(resultSamePrice.signal, "NO_CHANGE");
    assert.equal(resultSamePrice.priceDelta, 0);
  });
});

test("Phase 5: Channel Balancing Strategies", async (t) => {
  const channels = [
    { id: "ch-1", name: "Telegram VIP", type: "TELEGRAM", active: true, status: "CONNECTED" },
    { id: "ch-2", name: "WhatsApp Grupo", type: "WHATSAPP", active: true, status: "CONNECTED" },
    { id: "ch-3", name: "Discord Promo", type: "DISCORD", active: true, status: "CONNECTED" },
    { id: "ch-4", name: "Inativo", type: "TELEGRAM", active: false, status: "DISABLED" },
  ];

  await t.test("1. strategy ALL returns all active channels", () => {
    const selected = ChannelBalancer.selectChannels(channels, "ALL");
    assert.equal(selected.length, 3);
    assert.deepEqual(selected.map((c) => c.id), ["ch-1", "ch-2", "ch-3"]);
  });

  await t.test("2. strategy ROUND_ROBIN alternates channels sequentially", () => {
    const first = ChannelBalancer.selectChannels(channels, "ROUND_ROBIN", null);
    assert.equal(first.length, 1);
    assert.equal(first[0].id, "ch-1");

    const second = ChannelBalancer.selectChannels(channels, "ROUND_ROBIN", "ch-1");
    assert.equal(second.length, 1);
    assert.equal(second[0].id, "ch-2");

    const third = ChannelBalancer.selectChannels(channels, "ROUND_ROBIN", "ch-2");
    assert.equal(third.length, 1);
    assert.equal(third[0].id, "ch-3");

    const wrapAround = ChannelBalancer.selectChannels(channels, "ROUND_ROBIN", "ch-3");
    assert.equal(wrapAround.length, 1);
    assert.equal(wrapAround[0].id, "ch-1");
  });

  await t.test("3. strategy PRIORITY selects highest priority channel type", () => {
    const selected = ChannelBalancer.selectChannels(channels, "PRIORITY");
    assert.equal(selected.length, 1);
    assert.equal(selected[0].type, "TELEGRAM");
  });
});

test("Phase 5: AutopilotSafetyGate Deterministic Protection", async (t) => {
  const baseContext = {
    userId: "usr-test-1",
    offer: {
      id: "off-1",
      userId: "usr-test-1",
      status: "APPROVED",
      validationStatus: "VALID",
      affiliateLinkId: "link-1",
      productId: "prod-1",
    },
    affiliateLink: {
      id: "link-1",
      userId: "usr-test-1",
      active: true,
      affiliateUrl: "https://shopee.com.br/item?utm_source=autopilot",
    },
    channel: {
      id: "chan-1",
      userId: "usr-test-1",
      active: true,
      status: "CONNECTED",
    },
    todayPublicationsCount: 2,
    maxOffersPerDay: 20,
    minIntervalMinutes: 15,
    lastPublicationAt: new Date(new Date("2026-09-15T14:30:00Z").getTime() - 30 * 60 * 1000), // 30 min ago
    allowedStartTime: "08:00",
    allowedEndTime: "22:00",
    duplicateCooldownHours: 24,
    currentTime: new Date("2026-09-15T14:30:00Z"),
  };

  await t.test("1. approves publication when all conditions are met", () => {
    const result = AutopilotSafetyGate.evaluate(baseContext as any);
    assert.equal(result.passed, true);
    assert.equal(result.canPublishImmediately, true);
    assert.equal(result.blockingReasons.length, 0);
  });

  await t.test("2. blocks when anti-fabrication copy validation is REJECTED", () => {
    const invalidCopyContext = {
      ...baseContext,
      offer: { ...baseContext.offer, validationStatus: "REJECTED" },
    };
    const result = AutopilotSafetyGate.evaluate(invalidCopyContext as any);
    assert.equal(result.passed, false);
    assert.ok(result.blockingReasons.some((r) => r.includes("anti-fabricação")));
  });

  await t.test("3. blocks when daily publication limit is exceeded", () => {
    const limitReachedContext = {
      ...baseContext,
      todayPublicationsCount: 20,
      maxOffersPerDay: 20,
    };
    const result = AutopilotSafetyGate.evaluate(limitReachedContext as any);
    assert.equal(result.passed, false);
    assert.ok(result.blockingReasons.some((r) => r.includes("Limite diário")));
  });

  await t.test("4. blocks when publication pacing interval is not reached", () => {
    const tooSoonContext = {
      ...baseContext,
      lastPublicationAt: new Date(baseContext.currentTime.getTime() - 5 * 60 * 1000), // 5 min ago (requires 15)
    };
    const result = AutopilotSafetyGate.evaluate(tooSoonContext as any);
    assert.equal(result.passed, false);
    assert.ok(result.blockingReasons.some((r) => r.includes("Intervalo mínimo")));
  });

  await t.test("5. blocks when channel is disabled or belongs to another user", () => {
    const wrongUserContext = {
      ...baseContext,
      channel: { ...baseContext.channel, userId: "other-user" },
    };
    const result = AutopilotSafetyGate.evaluate(wrongUserContext as any);
    assert.equal(result.passed, false);
    assert.ok(result.blockingReasons.some((r) => r.includes("outro usuário")));
  });
});

test("Phase 5: AutopilotService & End-to-End Autonomous Cycle Integration", async (t) => {
  // Setup a test user in DB
  const testUser = await prisma.user.upsert({
    where: { email: "autopilot-test@affiliateai.app" },
    update: { name: "Autopilot Tester" },
    create: {
      email: "autopilot-test@affiliateai.app",
      name: "Autopilot Tester",
      passwordHash: "test_hash",
      role: "USER",
    },
  });

  // Setup a channel for this user
  const testChannel = await prisma.channel.create({
    data: {
      userId: testUser.id,
      name: "Telegram Test Channel",
      type: "TELEGRAM",
      identifier: "-10099999",
      provider: "mock",
      active: true,
      status: "CONNECTED",
    },
  });

  await t.test("1. creates default config with MANUAL mode and starts/pauses", async () => {
    const config = await AutopilotService.getOrCreateConfig(testUser.id);
    assert.equal(config.userId, testUser.id);
    assert.equal(config.enabled, true);

    const paused = await AutopilotService.pause(testUser.id);
    assert.equal(paused.enabled, false);

    const started = await AutopilotService.start(testUser.id);
    assert.equal(started.enabled, true);
  });

  await t.test("2. updates config and presets automation modes cleanly", async () => {
    const updated = await AutopilotService.updateConfig(testUser.id, {
      automationMode: "AUTOPILOT",
      minOpportunityScore: 75,
      minCommission: 4.0,
      minDiscount: 10.0,
      maxOpportunitiesPerCycle: 5,
    });

    assert.equal(updated.automationMode, "AUTOPILOT");
    assert.equal(updated.autoGenerateOffers, true);
    assert.equal(updated.autoApproveOffers, true);
    assert.equal(updated.autoPublish, true);
    assert.equal(updated.minOpportunityScore, 75);
    assert.equal(updated.maxOpportunitiesPerCycle, 5);
  });

  await t.test("3. executes complete autonomous cycle and respects maxOpportunitiesPerCycle", async () => {
    const summary = await AutopilotService.runCycle(testUser.id, {
      isManualTrigger: true,
    });

    assert.ok(summary.status === "COMPLETED" || summary.status === "PARTIAL");
    assert.ok(summary.productsDiscovered > 0);
    assert.ok(summary.productsAnalyzed > 0);
    assert.ok(summary.opportunitiesQualified > 0);
    assert.ok(summary.offersGenerated <= 5); // Capped at 5
    assert.ok(summary.offersApproved > 0);
    assert.ok(summary.publicationsPublished > 0);
    assert.ok(summary.decisions.length > 0);
  });

  await t.test("4. prevents concurrent cycles via cycle lock", async () => {
    // Manually lock user
    await prisma.autopilotConfig.update({
      where: { userId: testUser.id },
      data: { isLocked: true, lockedAt: new Date() },
    });

    await assert.rejects(
      async () => {
        await AutopilotService.runCycle(testUser.id);
      },
      (err: Error) => {
        return err.message.includes("já está em execução");
      }
    );

    // Release lock
    await prisma.autopilotConfig.update({
      where: { userId: testUser.id },
      data: { isLocked: false, lockedAt: null },
    });
  });

  await t.test("5. creates in-app notifications and manages read status", async () => {
    const notif = await NotificationService.createNotification({
      userId: testUser.id,
      title: "Oferta Quente Detectada",
      message: "Produto com 60% OFF encontrado!",
      type: "OPPORTUNITY",
      linkUrl: "/radar",
    });

    assert.ok(notif.id);
    assert.equal(notif.read, false);

    const userNotifs = await NotificationService.listUserNotifications(testUser.id);
    assert.ok(userNotifs.length > 0);

    await NotificationService.markAsRead(testUser.id);
    const unread = await NotificationService.getUnreadCount(testUser.id);
    assert.equal(unread, 0);
  });

  await t.test("6. AutopilotWorker processes due cycles safely", async () => {
    // Set nextRunAt to past
    await prisma.autopilotConfig.update({
      where: { userId: testUser.id },
      data: {
        enabled: true,
        isLocked: false,
        nextRunAt: new Date(Date.now() - 60000),
      },
    });

    const workerResult = await AutopilotWorker.processDueCycles();
    assert.ok(workerResult.evaluatedUsers >= 1);
    assert.ok(workerResult.executedCycles >= 1);
  });

  // Cleanup
  await prisma.channel.deleteMany({ where: { userId: testUser.id } });
  await prisma.autopilotRun.deleteMany({ where: { userId: testUser.id } });
  await prisma.notification.deleteMany({ where: { userId: testUser.id } });
});
