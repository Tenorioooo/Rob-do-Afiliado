import test from "node:test";
import assert from "node:assert/strict";
import { SecretStorage } from "../lib/security/secret-storage";
import { ChannelFactory } from "../domain/channels/adapters/channel-factory";
import { MockTelegramAdapter } from "../domain/channels/adapters/telegram.adapter";
import { MockWhatsAppAdapter } from "../domain/channels/adapters/whatsapp.adapter";
import { MockDiscordAdapter } from "../domain/channels/adapters/discord.adapter";
import { MessageFormatter } from "../domain/dispatcher/message-formatter";
import { AutomationEngine } from "../domain/automation/automation-engine";
import { AutomationRuleConfig, AutomationEvaluationContext } from "../domain/automation/types";

test("Phase 4 - Security & Secret Storage", async (t) => {
  await t.test("SecretStorage masks tokens and sensitive URLs", () => {
    const rawConfig = JSON.stringify({
      botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      apiKey: "ev_live_sec_999888777666",
      webhookUrl: "https://discord.com/api/webhooks/12345/abcdefg_secret",
      customPrefix: "🔥 Super Oferta",
    });

    const sanitized = SecretStorage.sanitizeConfig(rawConfig);
    assert.ok(sanitized.botToken.includes("••••"));
    assert.ok(sanitized.apiKey.includes("••••"));
    assert.ok(sanitized.webhookUrl.includes("••••"));
    assert.equal(sanitized.customPrefix, "🔥 Super Oferta");
    assert.equal(sanitized.botToken_configured, true);
  });

  await t.test("SecretStorage preserves existing secrets when updating other fields", () => {
    const existing = JSON.stringify({
      botToken: "real_token_12345",
      customPrefix: "Old Prefix",
    });
    const incoming = {
      botToken: "Configurado (••••••••2345)",
      customPrefix: "New Prefix",
    };

    const mergedStr = SecretStorage.mergeConfig(existing, incoming);
    const merged = JSON.parse(mergedStr);
    assert.equal(merged.botToken, "real_token_12345");
    assert.equal(merged.customPrefix, "New Prefix");
  });
});

test("Phase 4 - Channel Adapters & Mock Contracts", async (t) => {
  await t.test("ChannelFactory returns correct adapter instance with source: mock", () => {
    const tg = ChannelFactory.getAdapter("TELEGRAM");
    const wa = ChannelFactory.getAdapter("WHATSAPP");
    const dc = ChannelFactory.getAdapter("DISCORD");

    assert.equal(tg.type, "TELEGRAM");
    assert.equal(wa.type, "WHATSAPP");
    assert.equal(dc.type, "DISCORD");
    assert.equal(tg.isMock, true);
  });

  await t.test("MockTelegramAdapter testConnection and dispatch return deterministic results", async () => {
    const adapter = new MockTelegramAdapter();
    const testRes = await adapter.testConnection("@ofertas_vip", {});
    assert.equal(testRes.success, true);
    assert.equal(testRes.source, "mock");

    const dispatchRes = await adapter.sendMessage({
      publicationId: "pub-123",
      offerId: "off-123",
      title: "Fone Bluetooth",
      body: "50% OFF",
      cta: "Compre já",
      affiliateUrl: "https://affiliateai.app/r/test",
      destination: "@ofertas_vip",
      formattedMessage: "🔥 Fone Bluetooth TWS com 50% OFF!\nhttps://shope.ee/test",
      config: {},
    });

    assert.equal(dispatchRes.success, true);
    assert.equal(dispatchRes.source, "mock");
    assert.ok(dispatchRes.providerMessageId?.startsWith("mock_tg_"));
  });

  await t.test("MockWhatsAppAdapter testConnection and dispatch succeed", async () => {
    const adapter = new MockWhatsAppAdapter();
    const testRes = await adapter.testConnection("5511999998888-group@g.us", {});
    assert.equal(testRes.success, true);
    assert.equal(testRes.source, "mock");

    const dispatchRes = await adapter.sendMessage({
      publicationId: "pub-124",
      offerId: "off-124",
      title: "Oferta",
      body: "Corpo",
      cta: "CTA",
      affiliateUrl: "https://affiliateai.app/r/test2",
      destination: "5511999998888-group@g.us",
      formattedMessage: "*Oferta Imperdível* no WhatsApp",
      config: {},
    });

    assert.equal(dispatchRes.success, true);
    assert.equal(dispatchRes.source, "mock");
    assert.ok(dispatchRes.providerMessageId?.startsWith("mock_wa_"));
  });

  await t.test("MockDiscordAdapter testConnection and dispatch succeed", async () => {
    const adapter = new MockDiscordAdapter();
    const testRes = await adapter.testConnection("https://discord.com/api/webhooks/mock12345", {});
    assert.equal(testRes.success, true);
    assert.equal(testRes.source, "mock");

    const dispatchRes = await adapter.sendMessage({
      publicationId: "pub-125",
      offerId: "off-125",
      title: "Oferta",
      body: "Corpo",
      cta: "CTA",
      affiliateUrl: "https://affiliateai.app/r/test3",
      destination: "https://discord.com/api/webhooks/mock12345",
      formattedMessage: "**Oferta Imperdível** no Discord",
      config: {},
    });

    assert.equal(dispatchRes.success, true);
    assert.equal(dispatchRes.source, "mock");
    assert.ok(dispatchRes.providerMessageId?.startsWith("mock_dc_"));
  });
});

test("Phase 4 - Message Formatter", async (t) => {
  const offer = {
    title: "Smart TV 50 Polegadas 4K Ultra HD",
    body: "Excelente imagem e som cinema. Aproveite a queima de estoque!",
    cta: "👉 Garanta a sua com frete grátis:",
    affiliateUrl: "https://affiliateai.app/r/shopee123",
  };

  await t.test("Formats for Telegram with bold formatting and clean links", () => {
    const formatted = MessageFormatter.format(offer, "TELEGRAM");
    assert.ok(formatted.includes("*Smart TV 50 Polegadas 4K Ultra HD*"));
    assert.ok(formatted.includes("https://affiliateai.app/r/shopee123"));
  });

  await t.test("Formats for WhatsApp with bold formatting and CTA", () => {
    const formatted = MessageFormatter.format(offer, "WHATSAPP");
    assert.ok(formatted.includes("*Smart TV 50 Polegadas 4K Ultra HD*"));
    assert.ok(formatted.includes(offer.affiliateUrl));
  });

  await t.test("Formats for Discord with markdown block quotes", () => {
    const formatted = MessageFormatter.format(offer, "DISCORD");
    assert.ok(formatted.includes("**Smart TV 50 Polegadas 4K Ultra HD**"));
    assert.ok(formatted.includes(offer.affiliateUrl));
  });
});

test("Phase 4 - Automation Engine Logic", async (t) => {
  const baseRule: AutomationRuleConfig = {
    id: "rule-1",
    name: "Regra Promoções Quentes",
    active: true,
    minOpportunityScore: 85,
    minCommission: 5,
    minDiscount: 15,
    maxPrice: null,
    platforms: ["SHOPEE", "MERCADO_LIVRE"],
    categories: [],
    offerStyle: "DESCONTO",
    channelIds: ["chan-1"],
    autoApprove: true,
    maxOffersPerDay: 10,
    minIntervalMinutes: 30,
    duplicateCooldownHours: 24,
    allowedStartTime: "08:00",
    allowedEndTime: "22:00",
    allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
  };

  await t.test("Rejects offer when score is below minimum threshold", () => {
    const context: AutomationEvaluationContext = {
      product: {
        id: "prod-1",
        title: "Item A",
        platform: "SHOPEE",
        category: "Eletrônicos",
        currentPrice: 100,
        originalPrice: 200,
        discountPercent: 50,
        commissionRate: 0.1,
        commissionAmount: 10,
        url: "https://shopee.com",
      },
      opportunityScore: 70, // Below minOpportunityScore 85
      todayPublicationsCount: 2,
      lastPublicationAt: null,
      recentProductPublications: [],
    };

    const decision = AutomationEngine.evaluate(baseRule, context);
    assert.equal(decision.isMatch, false);
    assert.equal(decision.canPublishImmediately, false);
    assert.ok(decision.rejectionReasons.some((r) => r.includes("Score (70) abaixo")));
  });

  await t.test("Accepts offer and allows immediate publishing when all criteria match", () => {
    const noonDate = new Date();
    noonDate.setHours(14, 0, 0, 0);

    const context: AutomationEvaluationContext = {
      product: {
        id: "prod-2",
        title: "Fone TWS Bluetooth 5.3",
        platform: "SHOPEE",
        category: "Eletrônicos",
        currentPrice: 89.9,
        originalPrice: 179.8,
        discountPercent: 50,
        commissionRate: 0.12,
        commissionAmount: 10.78,
        url: "https://shopee.com/item",
      },
      opportunityScore: 92,
      todayPublicationsCount: 3,
      lastPublicationAt: new Date(noonDate.getTime() - 45 * 60 * 1000), // 45 min ago >= 30 min interval
      recentProductPublications: [],
      currentDate: noonDate,
    };

    const decision = AutomationEngine.evaluate(baseRule, context);
    assert.equal(decision.isMatch, true);
    assert.equal(decision.canPublishImmediately, true);
    assert.equal(decision.targetChannelIds.length, 1);
  });
});
