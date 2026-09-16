import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutopilotService } from "@/services/autopilot/autopilot-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const config = await AutopilotService.start(session.userId);

    return NextResponse.json({
      success: true,
      message: "Autopiloto ativado com sucesso.",
      config,
    });
  } catch (error: unknown) {
    console.error("[API:Autopilot:Start:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao ativar autopiloto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
