import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferQueueService } from "@/services/queue/offer-queue-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateQueueSchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  status: z
    .enum(["QUEUED", "PROCESSING", "READY", "SCHEDULED", "PUBLISHED", "FAILED", "CANCELLED"])
    .optional(),
  scheduledAt: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateQueueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await OfferQueueService.updateQueueItem(
      params.id,
      session.userId,
      parsed.data
    );

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    console.error("[API:OfferQueue:Update:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar item da fila";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
