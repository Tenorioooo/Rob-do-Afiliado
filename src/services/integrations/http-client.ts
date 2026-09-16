import { ExternalRequestPolicy } from "./ssrf-policy";
import { CredentialService } from "./credential-service";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  retries?: number;
  skipSsrfCheck?: boolean; // Only for unit tests with mock handlers
}

export interface HttpResponse<T = any> {
  status: number;
  ok: boolean;
  headers: Headers;
  data: T;
}

export class ExternalRequestClient {
  private static readonly DEFAULT_TIMEOUT_MS = 8000;
  private static readonly DEFAULT_MAX_RETRIES = 2;

  /**
   * Executes a safe, audited external HTTP request with timeouts and retries.
   */
  static async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const method = options.method || "GET";
    const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const maxRetries = options.retries ?? this.DEFAULT_MAX_RETRIES;

    // 1. SSRF Check
    if (!options.skipSsrfCheck) {
      ExternalRequestPolicy.validateUrl(url);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const fetchOptions: RequestInit = {
          method,
          headers: {
            "User-Agent": "AffiliateAI-IntegrationEngine/1.0",
            ...options.headers,
          },
          signal: controller.signal,
        };

        if (options.body) {
          if (typeof options.body === "string") {
            fetchOptions.body = options.body;
          } else {
            fetchOptions.body = JSON.stringify(options.body);
            fetchOptions.headers = {
              "Content-Type": "application/json",
              ...fetchOptions.headers,
            };
          }
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timer);

        // Handle Rate Limit 429
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 5000) : 1000 * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, waitMs));
          continue;
        }

        // Parse Response
        let data: any = null;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await response.json().catch(() => null);
        } else {
          data = await response.text().catch(() => "");
        }

        return {
          status: response.status,
          ok: response.ok,
          headers: response.headers,
          data,
        };
      } catch (err: unknown) {
        clearTimeout(timer);
        const rawMsg = err instanceof Error ? err.message : "Erro na requisição externa";
        const isAbort = err instanceof Error && err.name === "AbortError";
        const redactedMsg = CredentialService.redactLog(
          isAbort ? `Timeout de ${timeoutMs}ms excedido na chamada para ${url}` : rawMsg
        );

        lastError = new Error(redactedMsg);

        // Backoff delay before retry
        if (attempt < maxRetries) {
          const delay = 500 * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    throw lastError || new Error(`Falha na chamada externa para ${url}`);
  }
}
