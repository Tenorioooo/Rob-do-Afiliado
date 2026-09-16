import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = { userId: session.userId };
    if (provider) where.provider = provider.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const events = await prisma.integrationEvent.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: limit,
      include: {
        connection: {
          select: { id: true, provider: true, externalAccountName: true },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error("[API:Integrations:Webhooks:List:Error]", error);
    return NextResponse.json({ error: "Erro ao listar eventos de webhooks" }, { status: 500 });
  }
}
