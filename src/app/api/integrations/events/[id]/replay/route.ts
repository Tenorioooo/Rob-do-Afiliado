import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { WebhookPipelineService } from "@/services/integrations/webhook-pipeline";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await WebhookPipelineService.replayEvent(session.userId, params.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API:Integrations:Events:Replay:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao reprocessar evento";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
