import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferService } from "@/services/offers/offer-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const offer = await OfferService.cancelOffer(params.id, session.userId);
    return NextResponse.json({ success: true, offer });
  } catch (error: unknown) {
    console.error("[API:Offers:Cancel:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao cancelar oferta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
