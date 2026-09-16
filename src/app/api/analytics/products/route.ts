import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AnalyticsService } from "@/services/analytics/analytics-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await AnalyticsService.getProductAnalytics(session.userId);
    return NextResponse.json({ products: data });
  } catch (error: unknown) {
    console.error("[API:Analytics:Products:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar analytics de produtos" }, { status: 500 });
  }
}
