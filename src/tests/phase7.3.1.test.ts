import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { ProviderRegistry } from "@/integrations/provider-registry";
import { ConnectionService } from "@/services/integrations/connection-service";
import { CredentialService } from "@/services/integrations/credential-service";

test("Phase 7.3.1: Integrations Hub, Provider Catalog & Secure Connection Flow", async (t) => {
  const testUserA = `user_p731_a_${Date.now()}`;
  const testUserB = `user_p731_b_${Date.now()}`;

  // Setup test users
  await prisma.user.createMany({
    data: [
      { id: testUserA, email: `${testUserA}@example.com`, name: "User A", passwordHash: "hash" },
      { id: testUserB, email: `${testUserB}@example.com`, name: "User B", passwordHash: "hash" },
    ],
  });

  /* ==========================================================================
     1. PROVIDER CATALOG INTEGRITY (ALL 6 PROVIDERS ALWAYS AVAILABLE)
     ========================================================================== */
  await t.test("1. Provider Catalog returns all 6 providers even with 0 database connections", async () => {
    const providers = ProviderRegistry.getAll();
    assert.equal(providers.length, 6);

    const providerIds = providers.map((p) => p.id);
    assert.ok(providerIds.includes("TELEGRAM"));
    assert.ok(providerIds.includes("DISCORD"));
    assert.ok(providerIds.includes("WHATSAPP"));
    assert.ok(providerIds.includes("MERCADO_LIVRE"));
    assert.ok(providerIds.includes("SHOPEE"));
    assert.ok(providerIds.includes("AMAZON"));

    // Channels
    const channels = ProviderRegistry.getChannels();
    assert.equal(channels.length, 3);
    assert.ok(channels.some((c) => c.id === "TELEGRAM"));
    assert.ok(channels.some((c) => c.id === "DISCORD"));
    assert.ok(channels.some((c) => c.id === "WHATSAPP"));

    // Marketplaces
    const marketplaces = ProviderRegistry.getMarketplaces();
    assert.equal(marketplaces.length, 3);
    assert.ok(marketplaces.some((m) => m.id === "MERCADO_LIVRE"));
    assert.ok(marketplaces.some((m) => m.id === "SHOPEE"));
    assert.ok(marketplaces.some((m) => m.id === "AMAZON"));
  });

  /* ==========================================================================
     2. SECURE CONNECTION CREATION WITH AES-256-GCM ENCRYPTION
     ========================================================================== */
  await t.test("2. ConnectionService saves encrypted credentials and sanitizes output", async () => {
    const secretBotToken = "987654321:AAEF_secret_telegram_token_xyz";

    const saveResult = await ConnectionService.saveConnection({
      userId: testUserA,
      provider: "TELEGRAM",
      credentials: {
        botToken: secretBotToken,
        chatId: "-1009988776655",
      },
    });

    assert.ok(saveResult.connection?.id);
    assert.equal(saveResult.connection.provider, "TELEGRAM");
    assert.equal(saveResult.connection.type, "CHANNEL");

    // Retrieve via getConnection(..., returnSanitized: true)
    const sanitizedConn = await ConnectionService.getConnection(testUserA, saveResult.connection.id, true);
    assert.ok(sanitizedConn);
    // Output must be masked/sanitized
    assert.notEqual(sanitizedConn.credentials.botToken, secretBotToken);
    assert.ok(
      sanitizedConn.credentials.botToken.startsWith("••••") ||
      sanitizedConn.credentials.botToken.includes("••")
    );

    // Verify in database: raw field is encrypted
    const dbRecord = await prisma.integrationConnection.findUnique({
      where: { id: saveResult.connection.id },
    });
    assert.ok(dbRecord?.encryptedCredentials);
    assert.notEqual(dbRecord.encryptedCredentials, secretBotToken);

    // Verify decryption
    const decrypted = CredentialService.decrypt<Record<string, any>>(dbRecord.encryptedCredentials);
    assert.equal(decrypted.botToken, secretBotToken);
    assert.equal(decrypted.chatId, "-1009988776655");
  });

  /* ==========================================================================
     3. MULTI-TENANT ISOLATION
     ========================================================================== */
  await t.test("3. Multi-tenant Isolation: User A cannot view User B connections", async () => {
    // Create connection for User B
    await ConnectionService.saveConnection({
      userId: testUserB,
      provider: "DISCORD",
      credentials: {
        webhookUrl: "https://discord.com/api/webhooks/123/secret_discord_url",
      },
    });

    // User A lists connections
    const userAConnections = await ConnectionService.getUserConnections(testUserA);
    const userBConnections = await ConnectionService.getUserConnections(testUserB);

    assert.ok(userAConnections.every((c) => c.userId === testUserA));
    assert.ok(userBConnections.every((c) => c.userId === testUserB));

    // User A cannot fetch User B connection by ID
    const connBId = userBConnections[0].id;
    const directFetch = await ConnectionService.getConnection(testUserA, connBId);
    assert.equal(directFetch, null);
  });
});
