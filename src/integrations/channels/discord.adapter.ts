import { ExternalRequestClient } from "@/services/integrations/http-client";

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // decimal RGB (e.g. 0x5865F2)
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: { text: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

export class DiscordChannelAdapter {
  /**
   * Validates connectivity to a Discord Incoming Webhook URL.
   */
  static async validateConnection(webhookUrl: string): Promise<{
    valid: boolean;
    channelId?: string;
    guildId?: string;
    name?: string;
    errorMessage?: string;
  }> {
    try {
      const res = await ExternalRequestClient.request(webhookUrl, {
        method: "GET",
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.id) {
        return {
          valid: true,
          channelId: res.data.channel_id,
          guildId: res.data.guild_id,
          name: res.data.name,
        };
      }

      return {
        valid: false,
        errorMessage: res.data?.message || `Webhook inválido (HTTP ${res.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao validar webhook do Discord";
      return { valid: false, errorMessage: msg };
    }
  }

  /**
   * Sends a message with text and/or rich Embeds to a Discord webhook.
   */
  static async sendWebhookMessage(params: {
    webhookUrl: string;
    content?: string;
    username?: string;
    avatarUrl?: string;
    embeds?: DiscordEmbed[];
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    try {
      const url = `${params.webhookUrl}?wait=true`;
      const res = await ExternalRequestClient.request(url, {
        method: "POST",
        body: {
          content: params.content,
          username: params.username || "Robô do Afiliado",
          avatar_url: params.avatarUrl,
          embeds: params.embeds,
        },
      });

      if (res.ok && (res.status === 200 || res.status === 204)) {
        return {
          success: true,
          messageId: res.data?.id || `disc_${Date.now()}`,
        };
      }

      return {
        success: false,
        errorMessage: res.data?.message || `Falha ao enviar webhook (HTTP ${res.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar para o Discord";
      return { success: false, errorMessage: msg };
    }
  }

  /**
   * Sends a message to a Discord channel via Bot REST API v10.
   */
  static async sendBotMessage(params: {
    botToken: string;
    channelId: string;
    content: string;
  }): Promise<{ success: boolean; messageId?: string; errorMessage?: string }> {
    try {
      const url = `https://discord.com/api/v10/channels/${params.channelId}/messages`;
      const res = await ExternalRequestClient.request(url, {
        method: "POST",
        headers: {
          Authorization: `Bot ${params.botToken}`,
        },
        body: {
          content: params.content,
        },
      });

      if (res.ok && res.data?.id) {
        return {
          success: true,
          messageId: res.data.id,
        };
      }

      return {
        success: false,
        errorMessage: res.data?.message || `Erro Bot Discord (HTTP ${res.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar via Bot Discord";
      return { success: false, errorMessage: msg };
    }
  }
}
