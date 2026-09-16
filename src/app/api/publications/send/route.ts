import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { PublicationService } from "@/services/publications/publication-service";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sendNowSchema = z.object({
  offerId: z.string().min(1, "ID da oferta é obrigatório"),
  channelId: z.string().min(1, "ID do canal é obrigatório"),
  overrideText: z.string().optional(),
  confirmed: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendNowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if channel is real
    const channel = await prisma.channel.findFirst({
      where: { id: parsed.data.channelId, userId: session.userId },
    });

    if (channel && channel.provider !== "mock") {
      if (parsed.data.confirmed !== true) {
        return NextResponse.json(
          {
            error: "Publicação real requer confirmação explícita (confirmed: true).",
            errorCode: "CONFIRMATION_REQUIRED",
          },
          { status: 400 }
        );
      }
    }

    const result = await PublicationService.sendNow({
      userId: session.userId,
      offerId: parsed.data.offerId,
      channelId: parsed.data.channelId,
      overrideText: parsed.data.overrideText,
    });

    return NextResponse.json({
      success: true,
      publication: result.publication,
      result: result.result,
    });
  } catch (error: unknown) {
    console.error("[API:Publications:SendNow:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao despachar publicação";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
