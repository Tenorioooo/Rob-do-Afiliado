import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OfferService } from "@/services/offers/offer-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const regenerateSchema = z.object({
  preferredStyle: z
    .enum(["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"])
    .optional(),
});

export async function POST(
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
    });

    if (!offer) {
      return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
    }

    let preferredStyle = offer.style as any;
    try {
      const body = await request.json();
      const parsed = regenerateSchema.safeParse(body);
      if (parsed.success && parsed.data.preferredStyle) {
        preferredStyle = parsed.data.preferredStyle;
      }
    } catch {}

    const result = await OfferService.generateOffersForProduct({
      userId: session.userId,
      productId: offer.productId,
      opportunityId: offer.opportunityId || undefined,
      affiliateLinkId: offer.affiliateLinkId || undefined,
      preferredStyle,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("[API:Offers:Regenerate:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao regenerar oferta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
