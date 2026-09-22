import { prisma } from "@/lib/db/prisma";
import { ChannelFactory } from "@/domain/channels/adapters/channel-factory";
import { ChannelType, ConnectionTestResult } from "@/domain/channels/types";
import { SecretStorage } from "@/lib/security/secret-storage";

export interface CreateChannelInput {
  userId: string;
  name: string;
  type: ChannelType | string;
  provider?: string;
  destination: string;
  config: Record<string, any>;
}

export interface UpdateChannelInput {
  name?: string;
  destination?: string;
  config?: Record<string, any>;
}

export class ChannelService {
  /**
   * List all channels for a user with sanitized configs (secrets masked)
   */
  static async listUserChannels(userId: string) {
    const channels = await prisma.channel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { publications: true },
        },
      },
    });

    return channels.map((c) => ({
      ...c,
      config: SecretStorage.sanitizeConfig(c.config),
    }));
  }

  /**
   * Get single channel with ownership check and sanitized config
   */
  static async getChannelById(channelId: string, userId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        _count: {
          select: { publications: true },
        },
      },
    });

    if (!channel || channel.userId !== userId) {
      return null;
    }

    return {
      ...channel,
      config: SecretStorage.sanitizeConfig(channel.config),
    };
  }

  /**
   * Create a new channel
   */
  static async createChannel(input: CreateChannelInput) {
    const channelType = input.type as ChannelType;
    // Validate adapter exists
    ChannelFactory.getAdapter(channelType);

    const channel = await prisma.channel.create({
      data: {
        userId: input.userId,
        name: input.name,
        type: channelType,
        identifier: input.destination || input.name,
        provider: input.provider || (channelType === "TELEGRAM" ? "telegram-api" : channelType === "WHATSAPP" ? "meta-cloud-api" : "discord-webhook-api"),
        destination: input.destination,
        config: JSON.stringify(input.config || {}),
        status: "CONNECTED",
        active: true,
      },
    });

    return {
      ...channel,
      config: SecretStorage.sanitizeConfig(channel.config),
    };
  }

  /**
   * Update channel details and securely merge secrets
   */
  static async updateChannel(channelId: string, userId: string, input: UpdateChannelInput) {
    const existing = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    let updatedConfigStr = existing.config || "{}";
    if (input.config) {
      updatedConfigStr = SecretStorage.mergeConfig(existing.config, input.config);
    }

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        destination: input.destination !== undefined ? input.destination : existing.destination,
        identifier: input.destination !== undefined ? input.destination : existing.identifier,
        config: updatedConfigStr,
      },
    });

    return {
      ...updated,
      config: SecretStorage.sanitizeConfig(updated.config),
    };
  }

  /**
   * Delete channel
   */
  static async deleteChannel(channelId: string, userId: string) {
    const existing = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    await prisma.channel.delete({
      where: { id: channelId },
    });

    return { success: true };
  }

  /**
   * Test channel connection
   */
  static async testChannelConnection(channelId: string, userId: string): Promise<ConnectionTestResult> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel || channel.userId !== userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    let config = SecretStorage.getRawConfig(channel.config) || {};

    // If channel config doesn't have credentials, look up user's active IntegrationConnection for this provider
    try {
      const connection = await prisma.integrationConnection.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: channel.type.toUpperCase(),
          },
        },
      });

      if (connection) {
        const { ConnectionService } = await import("@/services/integrations/connection-service");
        const connCreds = await ConnectionService.getDecryptedCredentials(connection.id);
        config = { ...connCreds, ...config };
      }
    } catch (e) {
      console.warn("[ChannelService:testChannelConnection] Error fetching integration credentials:", e);
    }

    const adapter = ChannelFactory.getAdapter(channel.type as ChannelType, "real");

    const startTime = Date.now();
    let testResult: ConnectionTestResult;
    try {
      testResult = await adapter.testConnection(channel.destination || channel.identifier, config);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao testar conexão do canal";
      testResult = {
        success: false,
        source: "real",
        provider: channel.provider || channel.type,
        message: msg,
        timestamp: new Date(),
      };
    }
    const latencyMs = Date.now() - startTime;
    testResult.latencyMs = latencyMs;

    // Save test result to database
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        lastTestedAt: new Date(),
        testResult: JSON.stringify(testResult),
        status: testResult.success ? "CONNECTED" : "ERROR",
      },
    });

    return testResult;
  }

  /**
   * Activate channel
   */
  static async activateChannel(channelId: string, userId: string) {
    const existing = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: { active: true },
    });

    return {
      ...updated,
      config: SecretStorage.sanitizeConfig(updated.config),
    };
  }

  /**
   * Deactivate channel
   */
  static async deactivateChannel(channelId: string, userId: string) {
    const existing = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Canal não encontrado ou acesso não autorizado.");
    }

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: { active: false },
    });

    return {
      ...updated,
      config: SecretStorage.sanitizeConfig(updated.config),
    };
  }
}
