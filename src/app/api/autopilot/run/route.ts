import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutopilotService } from "@/services/autopilot/autopilot-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const summary = await AutopilotService.runCycle(session.userId, {
      isManualTrigger: true,
    });

    return NextResponse.json({
      success: summary.status !== "FAILED",
      summary,
    });
  } catch (error: unknown) {
    console.error("[API:Autopilot:Run:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao executar ciclo do autopiloto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
