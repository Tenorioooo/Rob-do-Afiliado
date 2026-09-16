/**
 * SecretStorage & Configuration Sanitizer
 * Protects API keys, bot tokens, webhooks and sensitive credentials from client exposure.
 */

export class SecretStorage {
  /**
   * Sanitizes a config JSON string by masking sensitive keys.
   */
  static sanitizeConfig(configJson: string | null | undefined): Record<string, any> {
    if (!configJson) return {};
    try {
      const parsed = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
      const sanitized: Record<string, any> = { ...parsed };

      const sensitiveKeys = [
        "botToken",
        "bot_token",
        "token",
        "apiKey",
        "api_key",
        "secret",
        "apiSecret",
        "api_secret",
        "webhookUrl",
        "webhook_url",
        "password",
      ];

      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
          const val = String(sanitized[key] || "");
          if (val) {
            sanitized[key] = `Configurado (••••••••${val.slice(-4)})`;
            sanitized[`${key}_configured`] = true;
          }
        }
      }

      return sanitized;
    } catch {
      return {};
    }
  }

  /**
   * Parses raw config for internal backend adapter use.
   */
  static getRawConfig(configJson: string | null | undefined): Record<string, any> {
    if (!configJson) return {};
    try {
      return typeof configJson === "string" ? JSON.parse(configJson) : configJson;
    } catch {
      return {};
    }
  }

  /**
   * Merges existing raw config with updated values, preserving existing secrets if masked values were sent back.
   */
  static mergeConfig(
    existingConfigJson: string | null | undefined,
    incomingConfig: Record<string, any>
  ): string {
    const existing = this.getRawConfig(existingConfigJson);
    const updated = { ...existing };

    for (const [key, value] of Object.entries(incomingConfig)) {
      if (typeof value === "string" && value.startsWith("Configurado (••••")) {
        // Keep existing secret
        continue;
      }
      updated[key] = value;
    }

    return JSON.stringify(updated);
  }
}
