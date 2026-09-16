import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CopyStylePerformanceService } from "@/services/analytics/copy-style-performance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await CopyStylePerformanceService.getStyleRankings(session.userId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:Analytics:Copy:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar analytics de estilo de copy" }, { status: 500 });
  }
}
