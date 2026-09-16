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
    const days = parseInt(searchParams.get("days") || "30", 10);

    const data = await AnalyticsService.getOverview(session.userId, days);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:Analytics:Overview:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar visão geral de analytics" }, { status: 500 });
  }
}
