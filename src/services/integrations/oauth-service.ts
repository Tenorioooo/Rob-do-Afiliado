import { prisma } from "@/lib/db/prisma";
import { MercadoLivreMarketplaceAdapter } from "@/integrations/marketplaces/mercadolivre.adapter";
import { ConnectionService } from "./connection-service";
import crypto from "crypto";

export class OAuthService {
  /**
   * Generates authorization URL with secure state token.
   * Treats Client ID as the official Mercado Livre App ID.
   */
  static generateAuthUrl(params: {
    provider: string;
    appId?: string;
    clientId?: string;
    redirectUri: string;
    userId: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
  }): { url: string; state: string } {
    const effectiveClientId = params.clientId || params.appId || "";
    const state = `ml_${params.userId}_${crypto.randomBytes(8).toString("hex")}`;
    const url = MercadoLivreMarketplaceAdapter.getAuthorizationUrl({
      clientId: effectiveClientId,
      redirectUri: params.redirectUri,
      state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
    });
    return { url, state };
  }

  /**
   * Validates state parameter format and returns associated userId.
   */
  static validateState(state: string | null | undefined): { valid: boolean; userId?: string } {
    if (!state || !state.startsWith("ml_")) return { valid: false };
    const parts = state.split("_");
    if (parts.length < 3) return { valid: false };
    const userId = parts.slice(1, -1).join("_");
    return { valid: true, userId };
  }

  /**
   * Generates authorization URL with secure state token from saved connection.
   */
  static async getMercadoLivreAuthorizationUrl(userId: string, redirectUri: string) {
    const conn = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: "MERCADO_LIVRE" } },
    });

    const connData = conn ? await ConnectionService.getConnection(userId, conn.id, false) : null;
    const creds = connData?.credentials as Record<string, any> || {};

    const clientId = creds.clientId || process.env.MERCADOLIVRE_CLIENT_ID;
    if (!clientId) {
      throw new Error("Client ID do Mercado Livre não configurado. Adicione-o na Central de Conexões.");
    }

    return this.generateAuthUrl({
      provider: "MERCADO_LIVRE",
      appId: clientId,
      redirectUri,
      userId,
    });
  }

  /**
   * Exchanges code for tokens and persists encrypted credentials.
   */
  static async handleMercadoLivreCallback(params: {
    userId: string;
    code: string;
    redirectUri: string;
    clientId?: string;
    clientSecret?: string;
  }): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      const conn = await prisma.integrationConnection.findUnique({
        where: { userId_provider: { userId: params.userId, provider: "MERCADO_LIVRE" } },
      });

      const connData = conn ? await ConnectionService.getConnection(params.userId, conn.id, false) : null;
      const creds = connData?.credentials as Record<string, any> || {};

      const clientId = params.clientId || creds.clientId || process.env.MERCADOLIVRE_CLIENT_ID;
      const clientSecret = params.clientSecret || creds.clientSecret || process.env.MERCADOLIVRE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("Client ID ou Client Secret do Mercado Livre não encontrados.");
      }

      const tokenRes = await MercadoLivreMarketplaceAdapter.exchangeCodeForToken({
        clientId,
        clientSecret,
        code: params.code,
        redirectUri: params.redirectUri,
      });

      if (!tokenRes.accessToken) {
        throw new Error(tokenRes.errorMessage || "Falha na troca de código de autorização Mercado Livre");
      }

      // Save tokens securely
      const savedResult = await ConnectionService.saveConnection({
        userId: params.userId,
        provider: "MERCADO_LIVRE",
        credentials: {
          clientId,
          clientSecret,
          accessToken: tokenRes.accessToken,
          refreshToken: tokenRes.refreshToken,
          expiresIn: tokenRes.expiresIn,
          mlUserId: tokenRes.userId,
        },
        status: "CONNECTED",
      });

      const connectionId = savedResult.connection?.id || conn?.id;
      if (connectionId) {
        try {
          await ConnectionService.testConnection(params.userId, connectionId);
        } catch (healthErr) {
          console.warn("[OAuthService:HealthCheckWarning]", healthErr);
        }
      }

      return { success: true, connectionId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na autorização OAuth do Mercado Livre";
      return { success: false, error: msg };
    }
  }
}
