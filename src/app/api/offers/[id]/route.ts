import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OfferService } from "@/services/offers/offer-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateOfferSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  style: z
    .enum(["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"])
    .optional(),
  status: z.enum(["DRAFT", "READY", "APPROVED", "CANCELLED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const offer = await prisma.offer.findFirst({
      where: { id: params.id, userId: session.userId },
      include: {
        product: true,
        affiliateLink: true,
        opportunity: true,
        queueItems: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error: unknown) {
    console.error("[API:Offers:GetSingle:Error]", error);
    return NextResponse.json({ error: "Erro ao carregar oferta" }, { status: 500 });
  }
}

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
    const parsed = updateOfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await OfferService.updateOffer(
      params.id,
      session.userId,
      parsed.data
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("[API:Offers:Update:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar oferta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
