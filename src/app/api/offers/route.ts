import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferService } from "@/services/offers/offer-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const style = searchParams.get("style") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await OfferService.getUserOffers(session.userId, {
      page,
      limit,
      status,
      style,
      platform,
      search,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:Offers:List:Error]", error);
    return NextResponse.json({ error: "Erro ao listar ofertas" }, { status: 500 });
  }
}
