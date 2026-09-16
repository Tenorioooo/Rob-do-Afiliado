import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ConnectionService } from "@/services/integrations/connection-service";

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

    const result = await ConnectionService.disconnect(session.userId, params.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API:Integrations:Disconnect:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao desconectar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
