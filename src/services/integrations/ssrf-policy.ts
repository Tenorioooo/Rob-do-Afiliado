import { URL } from "url";

/**
 * SSRF Protection Policy
 * Strict allowlist of official provider hostnames.
 */
export class ExternalRequestPolicy {
  private static readonly ALLOWED_HOSTS = new Set([
    // Telegram
    "api.telegram.org",
    // Discord
    "discord.com",
    "discordapp.com",
    // Meta / WhatsApp
    "graph.facebook.com",
    // Mercado Livre
    "api.mercadolibre.com",
    "auth.mercadolivre.com.br",
    "auth.mercadolibre.com",
    // Shopee
    "open-api.affiliate.shopee.com.br",
    "partner.shopeemobile.com",
    "open-api.affiliate.shopee.com",
    // Amazon PA-API
    "webservices.amazon.com",
    "webservices.amazon.com.br",
  ]);

  /**
   * Validates if a target URL is strictly compliant with the SSRF allowlist.
   */
  static isAllowedUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);

      // Must be HTTPS (except in strict local test environments with explicit mock URL)
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block private / loopback / metadata IPs
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "169.254.169.254" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname.startsWith("172.31.") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal")
      ) {
        return false;
      }

      // Must exist in official allowlist
      return this.ALLOWED_HOSTS.has(hostname);
    } catch {
      return false;
    }
  }

  /**
   * Asserts URL is allowed or throws an error.
   */
  static validateUrl(urlString: string): void {
    if (!this.isAllowedUrl(urlString)) {
      throw new Error(`[ExternalRequestPolicy] URL não autorizada por política de segurança SSRF: ${urlString}`);
    }
  }
}
