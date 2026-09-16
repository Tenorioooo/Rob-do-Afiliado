import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferService } from "@/services/offers/offer-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateOfferSchema = z.object({
  productId: z.string().min(1, "ID do produto é obrigatório"),
  opportunityId: z.string().optional(),
  affiliateLinkId: z.string().optional(),
  preferredStyle: z
    .enum(["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateOfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await OfferService.generateOffersForProduct({
      ...parsed.data,
      userId: session.userId,
    });

    return NextResponse.json({
      success: true,
      offer: result.offer,
      variants: result.variants,
      selectedVariant: result.selectedVariant,
    });
  } catch (error: unknown) {
    console.error("[API:Offers:Generate:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar oferta com IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
