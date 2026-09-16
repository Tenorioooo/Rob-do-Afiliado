import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ConnectionService } from "@/services/integrations/connection-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const testResult = await ConnectionService.testConnection(session.userId, params.id);

    return NextResponse.json(testResult);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao executar health check" },
      { status: 500 }
    );
  }
}
