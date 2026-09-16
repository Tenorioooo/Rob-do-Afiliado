import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ConnectionService } from "@/services/integrations/connection-service";
import { IntegrationPreflightService } from "@/services/integrations/preflight-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await ConnectionService.getConnection(session.userId, params.id, false);
    if (!conn) {
      return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 });
    }

    const preflight = await IntegrationPreflightService.runPreflight({
      provider: conn.provider,
      credentials: conn.credentials as Record<string, any>,
      connectionId: conn.id,
    });

    return NextResponse.json({
      success: true,
      preflight,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao executar preflight" },
      { status: 500 }
    );
  }
}
