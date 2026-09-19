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
    const limit = Math.min(Number(searchParams.get("limit") || 10), 50);

    const scans = await prisma.robotScan.findMany({
      where: { userId: session.userId },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const recentEvents = await prisma.robotEvent.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const config = await prisma.robotConfig.findUnique({
      where: { userId: session.userId },
    });

    const marketplaceConnections = await prisma.integrationConnection.findMany({
      where: {
        userId: session.userId,
        type: "MARKETPLACE",
      },
      select: {
        id: true,
        provider: true,
        type: true,
        status: true,
        authType: true,
        externalAccountId: true,
        externalAccountName: true,
        capabilities: true,
        lastValidatedAt: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      scans,
      recentEvents,
      config,
      marketplaceConnections,
    });
  } catch (error: unknown) {
    console.error("[API:Robot:Scans:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar histórico de scans" }, { status: 500 });
  }
}
