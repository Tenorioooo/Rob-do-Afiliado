import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferQueueService } from "@/services/queue/offer-queue-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const enqueueSchema = z.object({
  offerId: z.string().min(1, "ID da oferta é obrigatório"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  channelId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = enqueueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { offerId, priority, channelId, scheduledAt } = parsed.data;

    const queueItem = await OfferQueueService.enqueueOffer(
      session.userId,
      offerId,
      {
        priority,
        channelId,
        scheduledAt,
      }
    );

    return NextResponse.json({ success: true, queueItem });
  } catch (error: unknown) {
    console.error("[API:OfferQueue:Post:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao adicionar à fila";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await OfferQueueService.getQueue(session.userId, {
      status,
      priority,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:OfferQueue:List:Error]", error);
    return NextResponse.json({ error: "Erro ao listar fila de ofertas" }, { status: 500 });
  }
}
