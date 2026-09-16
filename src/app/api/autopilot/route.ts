import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AutopilotService } from "@/services/autopilot/autopilot-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const config = await AutopilotService.getOrCreateConfig(session.userId);

    const [latestRun, runsCount, completedCount, events, totals] = await Promise.all([
      prisma.autopilotRun.findFirst({
        where: { userId: session.userId },
        orderBy: { startedAt: "desc" },
      }),
      prisma.autopilotRun.count({
        where: { userId: session.userId },
      }),
      prisma.autopilotRun.count({
        where: { userId: session.userId, status: "COMPLETED" },
      }),
      prisma.robotEvent.findMany({
        where: {
          userId: session.userId,
          eventType: { startsWith: "AUTOPILOT_" },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.autopilotRun.aggregate({
        where: { userId: session.userId },
        _sum: {
          productsDiscovered: true,
          productsAnalyzed: true,
          opportunitiesCreated: true,
          opportunitiesQualified: true,
          offersGenerated: true,
          offersApproved: true,
          publicationsQueued: true,
          publicationsPublished: true,
        },
      }),
    ]);

    const successRate = runsCount > 0 ? Math.round((completedCount / runsCount) * 100) : 100;

    return NextResponse.json({
      config,
      latestRun,
      stats: {
        totalRuns: runsCount,
        completedRuns: completedCount,
        successRate,
        productsDiscovered: totals._sum.productsDiscovered || 0,
        productsAnalyzed: totals._sum.productsAnalyzed || 0,
        opportunitiesCreated: totals._sum.opportunitiesCreated || 0,
        opportunitiesQualified: totals._sum.opportunitiesQualified || 0,
        offersGenerated: totals._sum.offersGenerated || 0,
        offersApproved: totals._sum.offersApproved || 0,
        publicationsQueued: totals._sum.publicationsQueued || 0,
        publicationsPublished: totals._sum.publicationsPublished || 0,
      },
      recentEvents: events,
    });
  } catch (error: unknown) {
    console.error("[API:Autopilot:GET:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar dados do Autopiloto" }, { status: 500 });
  }
}
