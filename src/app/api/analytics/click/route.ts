import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AnalyticsService } from "@/services/analytics/analytics-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const clickSchema = z.object({
  affiliateLinkId: z.string().min(1, "ID do link é obrigatório"),
  offerId: z.string().optional().nullable(),
  publicationId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  source: z.enum(["mock", "real"]).optional().default("mock"),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const parsed = clickSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || undefined;

    const event = await AnalyticsService.trackClick({
      userId: session?.userId || "",
      affiliateLinkId: parsed.data.affiliateLinkId,
      offerId: parsed.data.offerId,
      publicationId: parsed.data.publicationId,
      channelId: parsed.data.channelId,
      platform: parsed.data.platform,
      ipAddress,
      userAgent,
      source: parsed.data.source,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    console.error("[API:Analytics:Click:Error]", error);
    const message = error instanceof Error ? error.message : "Erro ao registrar clique";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
