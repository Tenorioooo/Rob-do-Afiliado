import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsService } from "@/services/analytics/analytics-service";
import { AnalyticsAttributionService } from "@/domain/analytics/attribution";
import { PerformanceScoreService } from "@/domain/analytics/performance-score";
import { LearningSignalService } from "@/domain/analytics/learning-signals";
import { SmartSchedulingService } from "@/domain/analytics/smart-scheduling";
import { ExperimentService } from "@/domain/analytics/experiments";
import { CopyStylePerformanceService } from "@/services/analytics/copy-style-performance-service";
import { AutopilotService } from "@/services/autopilot/autopilot-service";

test("Phase 6: Conversion Intelligence, Analytics, Attribution & Continuous Learning", async (t) => {
  const testUserId = `user_phase6_test_${Date.now()}`;

  // Setup: Create test user
  await prisma.user.create({
    data: {
      id: testUserId,
      email: `${testUserId}@example.com`,
      name: "Phase 6 Test User",
      passwordHash: "hash123",
    },
  });

  // Setup: Create test channel, product, link, offer, publication
  const channel = await prisma.channel.create({
    data: {
      userId: testUserId,
      name: "Canal Telegram VIP",
      type: "TELEGRAM",
      identifier: "@test_telegram",
      provider: "mock",
      active: true,
      status: "CONNECTED",
    },
  });

  const product = await prisma.product.create({
    data: {
      externalId: `prod_p6_${Date.now()}`,
      platform: "SHOPEE",
      title: "Headset Gamer Sem Fio RGB Ultra 7.1",
      category: "Eletrônicos",
      imageUrl: "https://example.com/img.jpg",
      originalPrice: 300,
      currentPrice: 150,
      discountPercent: 50,
      commissionRate: 0.1,
      commissionAmount: 15,
      url: "https://shopee.com.br/item1",
    },
  });

  const link = await prisma.affiliateLink.create({
    data: {
      userId: testUserId,
      productId: product.id,
      platform: "SHOPEE",
      originalUrl: product.url,
      affiliateUrl: "https://shp.ee/test1234",
      shortCode: `p6_${Date.now()}`,
      status: "GENERATED",
      source: "mock",
      clicks: 0,
      conversions: 0,
    },
  });

  const offer = await prisma.offer.create({
    data: {
      userId: testUserId,
      productId: product.id,
      affiliateLinkId: link.id,
      channelId: channel.id,
      title: "OFERTA HEADSET",
      body: "50% OFF no Headset Gamer",
      cta: "Compre já",
      style: "DESCONTO",
      status: "APPROVED",
      validationStatus: "VALID",
    },
  });

  const publication = await prisma.publication.create({
    data: {
      userId: testUserId,
      offerId: offer.id,
      channelId: channel.id,
      status: "PUBLISHED",
      provider: "mock",
      source: "mock",
      idempotencyKey: `pub_p6_${Date.now()}`,
      publishedAt: new Date(),
    },
  });

  t.after(async () => {
    // Cleanup
    await prisma.analyticsEvent.deleteMany({ where: { userId: testUserId } });
    await prisma.commission.deleteMany({ where: { userId: testUserId } });
    await prisma.conversion.deleteMany({ where: { userId: testUserId } });
    await prisma.experimentVariant.deleteMany({ where: { experiment: { userId: testUserId } } });
    await prisma.experiment.deleteMany({ where: { userId: testUserId } });
    await prisma.learningSignal.deleteMany({ where: { userId: testUserId } });
    await prisma.publication.deleteMany({ where: { userId: testUserId } });
    await prisma.offer.deleteMany({ where: { userId: testUserId } });
    await prisma.affiliateLink.deleteMany({ where: { userId: testUserId } });
    await prisma.productSnapshot.deleteMany({ where: { product: { externalId: product.externalId } } });
    await prisma.opportunity.deleteMany({ where: { userId: testUserId } });
    await prisma.product.deleteMany({ where: { externalId: product.externalId } });
    await prisma.channel.deleteMany({ where: { userId: testUserId } });
    await prisma.autopilotRun.deleteMany({ where: { userId: testUserId } });
    await prisma.autopilotConfig.deleteMany({ where: { userId: testUserId } });
    await prisma.notification.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  await t.test("1. Click tracking & central counter increment", async () => {
    const clickEvent = await AnalyticsService.trackClick({
      userId: testUserId,
      affiliateLinkId: link.id,
      offerId: offer.id,
      publicationId: publication.id,
      channelId: channel.id,
      ipAddress: "10.0.0.1",
      source: "mock",
    });

    assert.ok(clickEvent.id);
    assert.equal(clickEvent.eventType, "CLICK");
    assert.equal(clickEvent.affiliateLinkId, link.id);
    assert.equal(clickEvent.publicationId, publication.id);
    assert.equal(clickEvent.channelId, channel.id);

    // Verify counter increment
    const updatedLink = await prisma.affiliateLink.findUnique({ where: { id: link.id } });
    assert.equal(updatedLink?.clicks, 1);
  });

  await t.test("2. Attribution hierarchy resolution", async () => {
    const attribution = await AnalyticsAttributionService.resolveAttribution({
      publicationId: publication.id,
    });

    assert.equal(attribution.publicationId, publication.id);
    assert.equal(attribution.offerId, offer.id);
    assert.equal(attribution.channelId, channel.id);
    assert.equal(attribution.productId, product.id);
    assert.equal(attribution.completenessLevel, "FULL");
  });

  await t.test("3. Conversion & Commission tracking with idempotency", async () => {
    const orderId = `ORDER_P6_${Date.now()}`;

    // First conversion recording
    const res1 = await AnalyticsService.recordConversion({
      userId: testUserId,
      affiliateLinkId: link.id,
      offerId: offer.id,
      publicationId: publication.id,
      channelId: channel.id,
      platform: "SHOPEE",
      externalOrderId: orderId,
      orderValue: 150.0,
      commissionValue: 15.0,
      status: "APPROVED",
      source: "mock",
    });

    assert.equal(res1.isDuplicate, false);
    assert.equal(res1.conversion.status, "APPROVED");
    assert.equal(res1.conversion.orderValue, 150.0);
    assert.equal(res1.conversion.commissionValue, 15.0);

    // Verify commission record was created with status CONFIRMED
    const commission = await prisma.commission.findFirst({
      where: { conversionId: res1.conversion.id },
    });
    assert.ok(commission);
    assert.equal(commission.status, "CONFIRMED");
    assert.equal(commission.amount, 15.0);

    // Verify AffiliateLink conversion count
    const updatedLink = await prisma.affiliateLink.findUnique({ where: { id: link.id } });
    assert.equal(updatedLink?.conversions, 1);
    assert.equal(updatedLink?.estimatedEarnings, 15.0);

    // Second conversion recording with identical externalOrderId -> Idempotency check
    const res2 = await AnalyticsService.recordConversion({
      userId: testUserId,
      affiliateLinkId: link.id,
      platform: "SHOPEE",
      externalOrderId: orderId,
      orderValue: 150.0,
      commissionValue: 15.0,
    });

    assert.equal(res2.isDuplicate, true);
    assert.equal(res2.conversion.id, res1.conversion.id);
  });

  await t.test("4. Performance score calculation & confidence evaluation", async () => {
    // Evaluation: 50 clicks, 5 conversions, R$ 50 commission
    const scoreResult = PerformanceScoreService.calculateScore({
      clicks: 50,
      conversions: 5,
      impressions: 500,
      commission: 50,
    });

    assert.ok(scoreResult.totalScore > 0 && scoreResult.totalScore <= 100);
    assert.equal(scoreResult.confidence, "RELIABLE"); // 30-99 -> RELIABLE
    assert.ok(scoreResult.reason.includes("Score"));

    // Weak sample evaluation (< 30)
    const weakConfidence = PerformanceScoreService.evaluateConfidence(12);
    assert.equal(weakConfidence, "WEAK");

    // Strong sample evaluation (>= 100)
    const strongConfidence = PerformanceScoreService.evaluateConfidence(150);
    assert.equal(strongConfidence, "STRONG");
  });

  await t.test("5. Continuous learning signals generation with minimum data rule", async () => {
    // Inject 35 clicks to satisfy minimumClicksForLearning threshold (30)
    for (let i = 0; i < 35; i++) {
      await prisma.analyticsEvent.create({
        data: {
          userId: testUserId,
          eventType: "CLICK",
          affiliateLinkId: link.id,
          offerId: offer.id,
          channelId: channel.id,
          platform: "SHOPEE",
          source: "mock",
        },
      });
    }

    const signals = await LearningSignalService.computeSignals(testUserId, {
      minClicksForLearning: 30,
      reliableThreshold: 100,
    });

    assert.ok(signals.length > 0);
    const channelSignal = signals.find((s) => s.signalType === "BEST_CHANNEL");
    assert.ok(channelSignal);
    assert.equal(channelSignal.targetEntity, channel.name);
    assert.equal(channelSignal.confidence, "RELIABLE");
    assert.ok(channelSignal.reason.includes("desempenho"));
  });

  await t.test("6. Smart scheduling time slot analysis", async () => {
    const scheduling = await SmartSchedulingService.analyzeTimeSlots(testUserId, 5);

    assert.equal(scheduling.slots.length, 24);
    assert.ok(scheduling.recommendationReason);
  });

  await t.test("7. Copy style rankings", async () => {
    const rankings = await CopyStylePerformanceService.getStyleRankings(testUserId, 10);

    assert.equal(rankings.styles.length, 5);
    const descontoStyle = rankings.styles.find((s) => s.style === "DESCONTO");
    assert.ok(descontoStyle);
    assert.ok(descontoStyle.metrics.clicks > 0);
  });

  await t.test("8. A/B Copy Experiment Lifecycle", async () => {
    // Create experiment
    const exp = await ExperimentService.createExperiment({
      userId: testUserId,
      name: "Teste A/B: Desconto vs Urgência",
      targetMetric: "CTR",
      maxExposure: 10,
      variants: [
        { style: "DESCONTO", trafficWeight: 0.5 },
        { style: "URGENCIA", trafficWeight: 0.5 },
      ],
    });

    assert.ok(exp.id);
    assert.equal(exp.variants.length, 2);

    // Record metrics on variant 0
    const var0 = exp.variants[0];
    await ExperimentService.recordVariantMetric(var0.id, "IMPRESSION", 10);
    await ExperimentService.recordVariantMetric(var0.id, "CLICK", 5);
    await ExperimentService.recordVariantMetric(var0.id, "CONVERSION", 1, 20.0);

    // Conclude experiment
    const concluded = await ExperimentService.evaluateAndConcludeExperiment(exp.id);
    assert.equal(concluded?.status, "COMPLETED");
    assert.equal(concluded?.winningStyle, var0.style);
    assert.ok(concluded?.analysisReason?.includes("venceu"));
  });

  await t.test("9. Autopilot integration with learning signals & Safety Gate", async () => {
    const cycle = await AutopilotService.runCycle(testUserId, { isManualTrigger: true });

    assert.ok(cycle.runId);
    assert.ok(["COMPLETED", "PARTIAL"].includes(cycle.status), `Cycle status should be COMPLETED or PARTIAL, got ${cycle.status}`);
    assert.ok(cycle.decisions.length > 0);

    // Verify decision was audited
    const decision = cycle.decisions[0];
    assert.ok(decision.productId);
    assert.ok(typeof decision.score === "number");
  });

  await t.test("10. Analytics Overview & Data Source Badge", async () => {
    const overview = await AnalyticsService.getOverview(testUserId, 30);

    assert.ok(overview.summary);
    assert.ok(overview.summary.clicks > 0);
    assert.equal(overview.dataSource, "MOCK"); // Mock data correctly tagged
    assert.ok(overview.summary.performanceScore >= 0);
  });
});
