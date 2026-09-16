import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutomationService } from "@/services/automation/automation-service";

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

    const rule = await AutomationService.deactivateRule(params.id, session.userId);
    return NextResponse.json({ success: true, rule });
  } catch (error: unknown) {
    console.error("[API:Automation:Deactivate:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao desativar regra de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
