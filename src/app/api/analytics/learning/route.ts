import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LearningSignalService } from "@/domain/analytics/learning-signals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const signals = await LearningSignalService.computeSignals(session.userId);
    return NextResponse.json({ signals });
  } catch (error: unknown) {
    console.error("[API:Analytics:Learning:Error]", error);
    return NextResponse.json({ error: "Erro ao calcular sinais de aprendizado" }, { status: 500 });
  }
}
