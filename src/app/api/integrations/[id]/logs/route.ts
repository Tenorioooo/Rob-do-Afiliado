import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const logs = await prisma.integrationAuditLog.findMany({
      where: { connectionId: params.id, userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    console.error("[API:Integrations:Logs:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar logs da integração" }, { status: 500 });
  }
}
