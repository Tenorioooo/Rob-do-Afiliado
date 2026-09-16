import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended for GCM
const AUTH_TAG_LENGTH = 16;

export class CredentialService {
  /**
   * Retrieves the 32-byte encryption key from environment or fallback hash.
   */
  private static getEncryptionKey(): Buffer {
    const rawKey = process.env.INTEGRATION_ENCRYPTION_KEY || "affiliate-ai-default-secure-key-32b!";
    return crypto.createHash("sha256").update(rawKey).digest();
  }

  /**
   * Encrypts a credentials object/payload into an authenticated AES-256-GCM string format:
   * "iv:authTag:encryptedHex"
   */
  static encrypt(payload: Record<string, any> | string): string {
    const plainText = typeof payload === "string" ? payload : JSON.stringify(payload);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getEncryptionKey();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts an authenticated AES-256-GCM string into a typed object or raw string.
   */
  static decrypt<T = Record<string, any>>(encryptedString: string): T {
    try {
      const parts = encryptedString.split(":");
      if (parts.length !== 3) {
        throw new Error("Formato de credencial criptografada inválido");
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const key = this.getEncryptionKey();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      try {
        return JSON.parse(decrypted) as T;
      } catch {
        return decrypted as unknown as T;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na descriptografia de credenciais";
      throw new Error(`[CredentialService] Erro ao descriptografar: ${msg}`);
    }
  }

  /**
   * Masks sensitive values for safe client-side display.
   * e.g. "1234567890abcdef" -> "••••••••cdef"
   */
  static maskSecret(secret: string | null | undefined): string {
    if (!secret) return "";
    const str = String(secret);
    if (str.length <= 4) return "••••";
    return `••••••••${str.slice(-4)}`;
  }

  /**
   * Sanitizes a credential dictionary so no raw secrets ever leak to the frontend.
   */
  static sanitizeCredentials(credentials: Record<string, any> | null | undefined): Record<string, any> {
    if (!credentials) return {};
    const sanitized: Record<string, any> = {};

    const sensitiveFields = [
      "token",
      "bottoken",
      "bot_token",
      "apikey",
      "api_key",
      "secret",
      "clientsecret",
      "client_secret",
      "accesstoken",
      "access_token",
      "refreshtoken",
      "refresh_token",
      "webhooksecret",
      "webhook_secret",
      "password",
      "appsecret",
      "app_secret",
      "secretkey",
      "secret_key",
      "publickey",
      "public_key",
    ];

    for (const [key, value] of Object.entries(credentials)) {
      const lower = key.toLowerCase();
      if (sensitiveFields.some((s) => lower.includes(s))) {
        sanitized[key] = this.maskSecret(String(value));
        sanitized[`${key}Configured`] = Boolean(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Redacts sensitive strings from logs or error messages.
   */
  static redactLog(message: string): string {
    return message
      .replace(/(token=)[^\s&]+/gi, "$1[REDACTED]")
      .replace(/(secret=)[^\s&]+/gi, "$1[REDACTED]")
      .replace(/(authorization:\s*bearer\s+)[^\s\n]+/gi, "$1[REDACTED]")
      .replace(/[0-9]{8,12}:[a-zA-Z0-9_-]{20,50}/g, "[REDACTED_BOT_TOKEN]");
  }
}
