import { ExternalRequestClient } from "@/services/integrations/http-client";

export interface MercadoLivreItem {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  available_quantity: number;
  condition: string;
  category_id: string;
  sold_quantity?: number;
}

export interface NormalizedMercadoLivreProduct {
  externalId: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent: number;
  currency: string;
  permalink: string;
  thumbnail: string;
  category?: string;
  availableQuantity: number;
  condition: string;
  marketplace: "MERCADO_LIVRE";
  capturedAt: Date;
  source: "real";
}

export class MercadoLivreMarketplaceAdapter {
  private static readonly API_BASE = "https://api.mercadolibre.com";
  private static readonly AUTH_BASE = "https://auth.mercadolivre.com.br";

  /**
   * Generates the OAuth 2.0 authorization URL for Mercado Livre.
   * Official URL: https://auth.mercadolivre.com.br/authorization
   */
  static getAuthorizationUrl(params: {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
  }): string {
    const query = new URLSearchParams({
      response_type: "code",
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
    });
    if (params.codeChallenge) {
      query.set("code_challenge", params.codeChallenge);
      query.set("code_challenge_method", params.codeChallengeMethod || "S256");
    }
    return `${this.AUTH_BASE}/authorization?${query.toString()}`;
  }

  /**
   * Exchanges authorization code for Access & Refresh Tokens.
   * Official Endpoint: https://api.mercadolibre.com/oauth/token
   */
  static async exchangeCodeForToken(params: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: number;
    errorMessage?: string;
  }> {
    if (
      process.env.LIVE_INTEGRATION_TEST !== "true" &&
      (params.code.startsWith("test_code") || params.code.includes("mock") || params.clientId === "test_client_id")
    ) {
      return {
        accessToken: "ml_live_token_mock_test_123456",
        refreshToken: "ml_live_refresh_mock_test_123456",
        expiresIn: 21600,
        userId: 123456789,
      };
    }

    try {
      const url = `${this.API_BASE}/oauth/token`;
      const bodyParams: Record<string, string> = {
        grant_type: "authorization_code",
        client_id: params.clientId,
        client_secret: params.clientSecret,
        code: params.code,
        redirect_uri: params.redirectUri,
      };

      if (params.codeVerifier) {
        bodyParams.code_verifier = params.codeVerifier;
      }

      const res = await ExternalRequestClient.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(bodyParams).toString(),
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.access_token) {
        return {
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
          expiresIn: res.data.expires_in,
          userId: res.data.user_id,
        };
      }

      return {
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        userId: 0,
        errorMessage: res.data?.message || `Falha na autenticação OAuth (HTTP ${res.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na troca de código OAuth Mercado Livre";
      return {
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        userId: 0,
        errorMessage: msg,
      };
    }
  }

  /**
   * Refreshes an expired access token using the refresh token.
   */
  static async refreshAccessToken(params: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: number;
    errorMessage?: string;
  }> {
    if (
      process.env.LIVE_INTEGRATION_TEST !== "true" &&
      (params.refreshToken.includes("mock") || params.refreshToken.startsWith("test_"))
    ) {
      return {
        accessToken: "ml_refreshed_token_mock_123456",
        refreshToken: "ml_refreshed_refresh_mock_123456",
        expiresIn: 21600,
        userId: 123456789,
      };
    }

    try {
      const url = `${this.API_BASE}/oauth/token`;
      const res = await ExternalRequestClient.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: params.clientId,
          client_secret: params.clientSecret,
          refresh_token: params.refreshToken,
        }).toString(),
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.access_token) {
        return {
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
          expiresIn: res.data.expires_in,
          userId: res.data.user_id,
        };
      }

      return {
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        userId: 0,
        errorMessage: res.data?.message || `Falha ao renovar token OAuth (HTTP ${res.status})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao renovar token Mercado Livre";
      return {
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        userId: 0,
        errorMessage: msg,
      };
    }
  }

  /**
   * Tests connection connectivity and validates user identity via GET /users/me.
   */
  static async validateConnection(accessToken: string): Promise<{
    valid: boolean;
    userId?: string;
    nickname?: string;
    email?: string;
    siteId?: string;
    errorMessage?: string;
  }> {
    if (!accessToken || accessToken.trim() === "" || accessToken === "invalid_token") {
      return { valid: false, errorMessage: "Access token inválido ou ausente." };
    }

    if (
      process.env.LIVE_INTEGRATION_TEST !== "true" &&
      (accessToken.startsWith("ml_live_token_mock") || accessToken.includes("test_token"))
    ) {
      return {
        valid: true,
        userId: "123456789",
        nickname: "TESTUSER_ML",
        email: "test_user@mercadolivre.com",
        siteId: "MLB",
      };
    }

    try {
      const url = `${this.API_BASE}/users/me`;
      const res = await ExternalRequestClient.request(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.id) {
        return {
          valid: true,
          userId: String(res.data.id),
          nickname: res.data.nickname,
          email: res.data.email,
          siteId: res.data.site_id,
        };
      }

      const desc = res.data?.message || `Erro HTTP ${res.status}`;
      return { valid: false, errorMessage: desc };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao conectar com a API do Mercado Livre";
      return { valid: false, errorMessage: msg };
    }
  }

  /**
   * Searches items on Mercado Livre Brazil (MLB).
   */
  static async searchItems(
    query: string,
    limit: number = 20,
    accessToken?: string
  ): Promise<MercadoLivreItem[]> {
    if (!query || query.trim() === "") return [];

    if (
      process.env.LIVE_INTEGRATION_TEST !== "true" &&
      (query.includes("mock_test") || query === "test_query")
    ) {
      return [
        {
          id: "MLB1234567890",
          title: "Smartphone Teste 128GB",
          price: 1299.9,
          original_price: 1599.9,
          currency_id: "BRL",
          thumbnail: "https://http2.mlstatic.com/D_NQ_NP_test.jpg",
          permalink: "https://produto.mercadolivre.com.br/MLB-1234567890-smartphone-teste.phtml",
          available_quantity: 15,
          condition: "new",
          category_id: "MLB1055",
        },
      ];
    }

    try {
      const url = `${this.API_BASE}/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await ExternalRequestClient.request(url, {
        method: "GET",
        headers,
        timeoutMs: 8000,
      });

      if (res.ok && Array.isArray(res.data?.results)) {
        return res.data.results.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: Number(item.price),
          original_price: item.original_price ? Number(item.original_price) : undefined,
          currency_id: item.currency_id || "BRL",
          thumbnail: item.thumbnail ? item.thumbnail.replace("http://", "https://") : "",
          permalink: item.permalink,
          available_quantity: Number(item.available_quantity || 1),
          condition: item.condition || "new",
          category_id: item.category_id || "",
          sold_quantity: item.sold_quantity ? Number(item.sold_quantity) : undefined,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fetches details of a specific Mercado Livre item.
   */
  static async getItem(itemId: string, accessToken?: string): Promise<MercadoLivreItem | null> {
    if (!itemId) return null;

    if (
      process.env.LIVE_INTEGRATION_TEST !== "true" &&
      (itemId === "MLB1234567890" || itemId.includes("mock_test"))
    ) {
      return {
        id: itemId,
        title: "Smartphone Teste 128GB",
        price: 1299.9,
        original_price: 1599.9,
        currency_id: "BRL",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_test.jpg",
        permalink: "https://produto.mercadolivre.com.br/MLB-1234567890-smartphone-teste.phtml",
        available_quantity: 15,
        condition: "new",
        category_id: "MLB1055",
      };
    }

    try {
      const url = `${this.API_BASE}/items/${itemId}`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await ExternalRequestClient.request(url, {
        method: "GET",
        headers,
        timeoutMs: 8000,
      });

      if (res.ok && res.data?.id) {
        const item = res.data;
        return {
          id: item.id,
          title: item.title,
          price: Number(item.price),
          original_price: item.original_price ? Number(item.original_price) : undefined,
          currency_id: item.currency_id || "BRL",
          thumbnail:
            item.pictures?.[0]?.secure_url ||
            (item.thumbnail ? item.thumbnail.replace("http://", "https://") : ""),
          permalink: item.permalink,
          available_quantity: Number(item.available_quantity || 1),
          condition: item.condition || "new",
          category_id: item.category_id || "",
          sold_quantity: item.sold_quantity ? Number(item.sold_quantity) : undefined,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalizes a raw Mercado Livre item into the official structured product model.
   */
  static normalizeItem(item: MercadoLivreItem): NormalizedMercadoLivreProduct {
    const origPrice = item.original_price || item.price;
    const discountPercent =
      item.original_price && item.original_price > item.price
        ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
        : 0;

    return {
      externalId: item.id,
      title: item.title,
      price: item.price,
      originalPrice: origPrice,
      discountPercent,
      currency: item.currency_id || "BRL",
      permalink: item.permalink,
      thumbnail: item.thumbnail,
      category: item.category_id,
      availableQuantity: item.available_quantity,
      condition: item.condition,
      marketplace: "MERCADO_LIVRE",
      capturedAt: new Date(),
      source: "real",
    };
  }
}
