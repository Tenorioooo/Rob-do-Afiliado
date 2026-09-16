import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { SmartSchedulingService } from "@/domain/analytics/smart-scheduling";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await SmartSchedulingService.analyzeTimeSlots(session.userId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:Analytics:TimeSlots:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar análise de horários" }, { status: 500 });
  }
}
