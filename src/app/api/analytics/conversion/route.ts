import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AnalyticsService } from "@/services/analytics/analytics-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const conversionSchema = z.object({
  affiliateLinkId: z.string().optional().nullable(),
  offerId: z.string().optional().nullable(),
  publicationId: z.string().optional().nullable(),
  channelId: z.string().optional().nullable(),
  platform: z.string().min(1, "Plataforma é obrigatória"),
  externalOrderId: z.string().optional().nullable(),
  orderValue: z.number().nonnegative(),
  commissionValue: z.number().nonnegative(),
  currency: z.string().default("BRL"),
  status: z.enum(["PENDING", "APPROVED", "CANCELLED", "REFUNDED"]).default("PENDING"),
  source: z.enum(["mock", "real"]).default("mock"),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = conversionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await AnalyticsService.recordConversion({
      userId: session.userId,
      affiliateLinkId: parsed.data.affiliateLinkId,
      offerId: parsed.data.offerId,
      publicationId: parsed.data.publicationId,
      channelId: parsed.data.channelId,
      platform: parsed.data.platform,
      externalOrderId: parsed.data.externalOrderId,
      orderValue: parsed.data.orderValue,
      commissionValue: parsed.data.commissionValue,
      currency: parsed.data.currency,
      status: parsed.data.status,
      source: parsed.data.source,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("[API:Analytics:Conversion:Error]", error);
    const message = error instanceof Error ? error.message : "Erro ao registrar conversão";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
