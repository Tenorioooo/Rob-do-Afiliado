import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AnalyticsService } from "@/services/analytics/analytics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const data = await AnalyticsService.getOfferAnalytics(session.userId, limit);
    return NextResponse.json({ offers: data });
  } catch (error: unknown) {
    console.error("[API:Analytics:Offers:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar analytics de ofertas" }, { status: 500 });
  }
}
