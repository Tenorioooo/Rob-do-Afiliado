import { prisma } from "@/lib/db/prisma";

export class IntegrationIdempotencyService {
  /**
   * Checks if an external event has already been recorded or processed for a provider.
   */
  static async isDuplicate(provider: string, externalEventId: string): Promise<boolean> {
    if (!externalEventId) return false;

    const existing = await prisma.integrationEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId,
        },
      },
    });

    return Boolean(existing);
  }

  /**
   * Records an incoming event with idempotency check. Returns { event, isDuplicate }.
   */
  static async recordEvent(input: {
    userId: string;
    connectionId?: string | null;
    provider: string;
    externalEventId: string;
    eventType: string;
    payload: any;
    normalizedPayload?: any;
  }): Promise<{ event: any; isDuplicate: boolean }> {
    const existing = await prisma.integrationEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: input.provider,
          externalEventId: input.externalEventId,
        },
      },
    });

    if (existing) {
      return { event: existing, isDuplicate: true };
    }

    const event = await prisma.integrationEvent.create({
      data: {
        userId: input.userId,
        connectionId: input.connectionId || null,
        provider: input.provider,
        externalEventId: input.externalEventId,
        eventType: input.eventType,
        payload: typeof input.payload === "string" ? input.payload : JSON.stringify(input.payload),
        normalizedPayload: input.normalizedPayload
          ? JSON.stringify(input.normalizedPayload)
          : null,
        status: "RECEIVED",
      },
    });

    return { event, isDuplicate: false };
  }
}
