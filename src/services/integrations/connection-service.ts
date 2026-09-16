import { prisma } from "@/lib/db/prisma";
import { CredentialService } from "./credential-service";
import { ProviderRegistry } from "@/integrations/provider-registry";
import { TelegramChannelAdapter } from "@/integrations/channels/telegram.adapter";
import { DiscordChannelAdapter } from "@/integrations/channels/discord.adapter";
import { WhatsAppCloudAdapter } from "@/integrations/channels/whatsapp.adapter";
import { MercadoLivreMarketplaceAdapter } from "@/integrations/marketplaces/mercadolivre.adapter";
import { ShopeeMarketplaceAdapter } from "@/integrations/marketplaces/shopee.adapter";
import { AmazonMarketplaceAdapter } from "@/integrations/marketplaces/amazon.adapter";

export class ConnectionService {
  /**
   * Lists all connections for a user, sanitized with safety masks.
   */
  static async getUserConnections(userId: string) {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId },
      include: {
        _count: { select: { events: true, auditLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return connections.map((conn) => {
      let rawCreds: Record<string, any> = {};
      if (conn.encryptedCredentials) {
        try {
          rawCreds = CredentialService.decrypt(conn.encryptedCredentials);
        } catch {
          rawCreds = {};
        }
      }

      return {
        id: conn.id,
        userId: conn.userId,
        provider: conn.provider,
        type: conn.type,
        status: conn.status,
        authType: conn.authType,
        credentials: CredentialService.sanitizeCredentials(rawCreds),
        externalAccountId: conn.externalAccountId,
        externalAccountName: conn.externalAccountName,
        capabilities: JSON.parse(conn.capabilities || "[]"),
        lastValidatedAt: conn.lastValidatedAt,
        lastSyncAt: conn.lastSyncAt,
        lastWebhookAt: conn.lastWebhookAt,
        lastErrorCode: conn.lastErrorCode,
        lastErrorMessage: conn.lastErrorMessage,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        eventsCount: conn._count.events,
      };
    });
  }

  /**
   * Retrieves a single connection by ID with decrypted secrets for internal use or sanitized for API.
   */
  static async getConnection(userId: string, connectionId: string, returnSanitized: boolean = true) {
    const conn = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId },
      include: {
        auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!conn) return null;

    let rawCreds: Record<string, any> = {};
    if (conn.encryptedCredentials) {
      try {
        rawCreds = CredentialService.decrypt(conn.encryptedCredentials);
      } catch {
        rawCreds = {};
      }
    }

    return {
      ...conn,
      capabilities: JSON.parse(conn.capabilities || "[]"),
      credentials: returnSanitized
        ? CredentialService.sanitizeCredentials(rawCreds)
        : rawCreds,
    };
  }

  /**
   * Retrieves raw decrypted credentials for a given connection by ID.
   */
  static async getDecryptedCredentials(connectionId: string): Promise<Record<string, any>> {
    const conn = await prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });

    if (!conn?.encryptedCredentials) return {};
    try {
      return CredentialService.decrypt(conn.encryptedCredentials);
    } catch {
      return {};
    }
  }

  /**
   * Creates or updates an integration connection with encrypted credentials.
   */
  static async saveConnection(params: {
    userId: string;
    provider: string;
    credentials: Record<string, any>;
    status?: string;
  }) {
    const providerDef = ProviderRegistry.getById(params.provider);
    if (!providerDef) {
      throw new Error(`Provedor "${params.provider}" não registrado no sistema`);
    }

    // Merge with existing credentials if updating masked fields
    const existing = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId: params.userId, provider: providerDef.id } },
    });

    let mergedCredentials = { ...params.credentials };
    if (existing?.encryptedCredentials) {
      try {
        const existingCreds = CredentialService.decrypt(existing.encryptedCredentials);
        for (const [k, v] of Object.entries(params.credentials)) {
          if (typeof v === "string" && v.startsWith("••••")) {
            mergedCredentials[k] = existingCreds[k];
          }
        }
      } catch {}
    }

    const encrypted = CredentialService.encrypt(mergedCredentials);

    const connection = await prisma.integrationConnection.upsert({
      where: { userId_provider: { userId: params.userId, provider: providerDef.id } },
      update: {
        encryptedCredentials: encrypted,
        type: providerDef.type,
        authType: providerDef.authType,
        capabilities: JSON.stringify(providerDef.capabilities),
        status: params.status || "CONNECTING",
      },
      create: {
        userId: params.userId,
        provider: providerDef.id,
        type: providerDef.type,
        authType: providerDef.authType,
        encryptedCredentials: encrypted,
        capabilities: JSON.stringify(providerDef.capabilities),
        status: params.status || "CONNECTING",
      },
    });

    // Create Audit Log
    await prisma.integrationAuditLog.create({
      data: {
        userId: params.userId,
        connectionId: connection.id,
        provider: providerDef.id,
        action: existing ? "CREDENTIAL_ROTATED" : "CONNECT",
        details: JSON.stringify({ provider: providerDef.id }),
      },
    });

    // Run connection test automatically
    return await this.testConnection(params.userId, connection.id);
  }

  /**
   * Tests connection connectivity and updates health status accordingly.
   */
  static async testConnection(userId: string, connectionId: string) {
    const conn = await this.getConnection(userId, connectionId, false);
    if (!conn) {
      throw new Error("Conexão não encontrada.");
    }

    let isValid = false;
    let errorMsg: string | undefined;
    let accountId: string | undefined;
    let accountName: string | undefined;

    const creds = conn.credentials as Record<string, any>;

    switch (conn.provider) {
      case "TELEGRAM": {
        const res = await TelegramChannelAdapter.validateConnection(creds.botToken);
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = res.botId;
        accountName = res.username ? `@${res.username}` : res.firstName;
        break;
      }

      case "DISCORD": {
        const res = await DiscordChannelAdapter.validateConnection(creds.webhookUrl);
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = res.channelId;
        accountName = res.name;
        break;
      }

      case "WHATSAPP": {
        const res = await WhatsAppCloudAdapter.validateConnection({
          phoneNumberId: creds.phoneNumberId,
          accessToken: creds.accessToken,
        });
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = creds.phoneNumberId;
        accountName = res.displayPhoneNumber || res.verifiedName;
        break;
      }

      case "MERCADO_LIVRE": {
        const token = creds.accessToken;
        if (!token) {
          isValid = false;
          errorMsg = "Requer autorização OAuth 2.0 (Access Token ausente)";
          break;
        }

        const res = await MercadoLivreMarketplaceAdapter.validateConnection(token);
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = res.userId;
        accountName = res.nickname ? `@${res.nickname}` : "Mercado Livre";
        break;
      }

      case "SHOPEE": {
        const res = await ShopeeMarketplaceAdapter.validateConnection(creds.appId, creds.secretKey);
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = creds.appId;
        break;
      }

      case "AMAZON": {
        const res = await AmazonMarketplaceAdapter.validateConnection({
          accessKey: creds.accessKey,
          secretKey: creds.secretKey,
          partnerTag: creds.partnerTag,
        });
        isValid = res.valid;
        errorMsg = res.errorMessage;
        accountId = creds.partnerTag;
        break;
      }

      default:
        isValid = false;
        errorMsg = "Provedor sem validador oficial implementado";
    }

    const newStatus = isValid ? "CONNECTED" : "ERROR";
    const now = new Date();

    const updated = await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: newStatus,
        lastValidatedAt: now,
        externalAccountId: accountId || conn.externalAccountId,
        externalAccountName: accountName || conn.externalAccountName,
        lastErrorCode: isValid ? null : "VALIDATION_FAILED",
        lastErrorMessage: isValid ? null : errorMsg,
      },
    });

    // Audit Log
    await prisma.integrationAuditLog.create({
      data: {
        userId,
        connectionId,
        provider: conn.provider,
        action: "VALIDATE",
        details: JSON.stringify({ success: isValid, error: errorMsg }),
      },
    });

    return {
      success: isValid,
      status: newStatus,
      errorMessage: errorMsg,
      connection: updated,
    };
  }

  /**
   * Disconnects an active integration.
   */
  static async disconnect(userId: string, connectionId: string) {
    const conn = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!conn) throw new Error("Conexão não encontrada.");

    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: "DISCONNECTED",
        lastErrorMessage: null,
      },
    });

    await prisma.integrationAuditLog.create({
      data: {
        userId,
        connectionId,
        provider: conn.provider,
        action: "DISCONNECT",
      },
    });

    return { success: true, status: "DISCONNECTED" };
  }

  static async disconnectConnection(userId: string, connectionId: string) {
    return this.disconnect(userId, connectionId);
  }
}
