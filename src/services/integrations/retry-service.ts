import { prisma } from "@/lib/db/prisma";

export type IntegrationErrorClassification =
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "TEMPORARY_ERROR"
  | "INVALID_PAYLOAD"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

export class IntegrationRetryService {
  private static readonly MAX_RETRIES = 3;

  /**
   * Classifies an HTTP status code or error into a structured classification.
   */
  static classifyError(status?: number, message?: string): IntegrationErrorClassification {
    if (status === 401 || status === 403) return "AUTH_ERROR";
    if (status === 429) return "RATE_LIMIT";
    if (status === 404) return "NOT_FOUND";
    if (status && status >= 400 && status < 500) return "INVALID_PAYLOAD";
    if (status && status >= 500) return "TEMPORARY_ERROR";

    const msg = (message || "").toLowerCase();
    if (msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("token")) {
      return "AUTH_ERROR";
    }
    if (msg.includes("rate") || msg.includes("too many requests")) {
      return "RATE_LIMIT";
    }
    if (msg.includes("timeout") || msg.includes("econnrefused") || msg.includes("network")) {
      return "TEMPORARY_ERROR";
    }

    return "PROVIDER_ERROR";
  }

  /**
   * Calculates exponential backoff delay in milliseconds.
   */
  static calculateBackoffDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000);
  }

  /**
   * Records a failure on an IntegrationEvent and determines if it should transition to DEAD_LETTER.
   */
  static async handleEventFailure(eventId: string, errorMessage: string): Promise<"RETRYING" | "DEAD_LETTER"> {
    const event = await prisma.integrationEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) return "DEAD_LETTER";

    const nextRetry = event.retryCount + 1;
    const isDeadLetter = nextRetry >= this.MAX_RETRIES;

    await prisma.integrationEvent.update({
      where: { id: eventId },
      data: {
        retryCount: nextRetry,
        status: isDeadLetter ? "DEAD_LETTER" : "FAILED",
        errorMessage,
      },
    });

    return isDeadLetter ? "DEAD_LETTER" : "RETRYING";
  }
}
