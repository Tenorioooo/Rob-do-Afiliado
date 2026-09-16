import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { PublicationService } from "@/services/publications/publication-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const scheduleSchema = z.object({
  offerId: z.string().min(1, "ID da oferta é obrigatório"),
  channelId: z.string().min(1, "ID do canal é obrigatório"),
  scheduledFor: z.string().datetime("Data de agendamento inválida (ISO string)"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = scheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const publication = await PublicationService.schedule({
      userId: session.userId,
      offerId: parsed.data.offerId,
      channelId: parsed.data.channelId,
      scheduledFor: new Date(parsed.data.scheduledFor),
    });

    return NextResponse.json({
      success: true,
      publication,
    });
  } catch (error: unknown) {
    console.error("[API:Publications:Schedule:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao agendar publicação";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
