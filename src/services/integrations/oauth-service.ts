import { prisma } from "@/lib/db/prisma";
import { MercadoLivreMarketplaceAdapter } from "@/integrations/marketplaces/mercadolivre.adapter";
import { ConnectionService } from "./connection-service";
import crypto from "crypto";

export class OAuthService {
  /**
   * Generates PKCE code_verifier and S256 code_challenge.
   */
  static generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return { codeVerifier, codeChallenge };
  }

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
    codeVerifier?: string;
  }): { url: string; state: string; codeVerifier: string } {
    const effectiveClientId = params.clientId || params.appId || "";
    const state = `ml_${params.userId}_${crypto.randomBytes(8).toString("hex")}`;

    let codeVerifier = params.codeVerifier || "";
    let codeChallenge = params.codeChallenge;
    let codeChallengeMethod = params.codeChallengeMethod;

    if (!codeChallenge) {
      const pkce = this.generatePKCE();
      codeVerifier = pkce.codeVerifier;
      codeChallenge = pkce.codeChallenge;
      codeChallengeMethod = "S256";
    }

    const url = MercadoLivreMarketplaceAdapter.getAuthorizationUrl({
      clientId: effectiveClientId,
      redirectUri: params.redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
    });
    return { url, state, codeVerifier };
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
    codeVerifier?: string;
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
        codeVerifier: params.codeVerifier,
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

  /**
   * Generates Meta / Facebook OAuth 2.0 authorization URL for WhatsApp Embedded Signup.
   */
  static generateMetaWhatsAppAuthUrl(params: {
    appId?: string;
    redirectUri: string;
    userId: string;
  }): { url: string; state: string } {
    const effectiveAppId = params.appId || process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID || "";
    const state = `wa_${params.userId}_${crypto.randomBytes(8).toString("hex")}`;

    const urlParams = new URLSearchParams({
      client_id: effectiveAppId,
      redirect_uri: params.redirectUri,
      state,
      scope: "whatsapp_business_management,whatsapp_business_messaging,public_profile,email",
      response_type: "code",
    });

    const url = `https://www.facebook.com/v20.0/dialog/oauth?${urlParams.toString()}`;
    return { url, state };
  }

  /**
   * Validates WhatsApp state parameter format and returns associated userId.
   */
  static validateWhatsAppState(state: string | null | undefined): { valid: boolean; userId?: string } {
    if (!state || !state.startsWith("wa_")) return { valid: false };
    const parts = state.split("_");
    if (parts.length < 3) return { valid: false };
    const userId = parts.slice(1, -1).join("_");
    return { valid: true, userId };
  }

  /**
   * Exchanges code for Meta token and saves WhatsApp connection.
   */
  static async handleMetaWhatsAppCallback(params: {
    userId: string;
    code: string;
    redirectUri: string;
    appId?: string;
    appSecret?: string;
  }): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      const appId = params.appId || process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
      const appSecret = params.appSecret || process.env.META_APP_SECRET;

      if (!appId || !appSecret) {
        throw new Error("META_APP_ID ou META_APP_SECRET não configurados no servidor.");
      }

      // 1. Exchange code for user access token
      const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("redirect_uri", params.redirectUri);
      tokenUrl.searchParams.set("code", params.code);

      const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData?.error?.message || "Falha na troca de código de autorização com a Meta.");
      }

      const accessToken = tokenData.access_token;
      let phoneNumberId = "";
      let wabaId = "";
      let accountName = "WhatsApp Business Oficial";

      // 2. Query Meta Graph API for WABA and Phone Numbers
      try {
        const debugUrl = `https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
        const debugRes = await fetch(debugUrl);
        if (debugRes.ok) {
          const debugData = await debugRes.json();
          const granularScopes = debugData?.data?.granular_scopes || [];
          const wabaScope = granularScopes.find((s: any) => s.scope === "whatsapp_business_management");
          if (wabaScope?.target_ids?.length > 0) {
            wabaId = wabaScope.target_ids[0];
          }
        }

        if (wabaId) {
          const wabaUrl = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`;
          const wabaRes = await fetch(wabaUrl);
          if (wabaRes.ok) {
            const wabaData = await wabaRes.json();
            const firstPhone = wabaData?.data?.[0];
            if (firstPhone) {
              phoneNumberId = firstPhone.id;
              accountName = firstPhone.verified_name || firstPhone.display_phone_number || accountName;
            }
          }
        }
      } catch (graphErr) {
        console.warn("[OAuthService:MetaWhatsApp:GraphQueryWarning]", graphErr);
      }

      // 3. Save connection securely
      const savedResult = await ConnectionService.saveConnection({
        userId: params.userId,
        provider: "WHATSAPP",
        credentials: {
          appId,
          accessToken,
          phoneNumberId: phoneNumberId || "default",
          wabaId: wabaId || undefined,
          sessionType: "META_CLOUD_OAUTH",
          accountName,
        },
        status: "VERIFIED_REAL",
      });

      const connectionId = savedResult.connection?.id;
      return { success: true, connectionId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na autorização do WhatsApp com Facebook";
      return { success: false, error: msg };
    }
  }
}
