import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Acesso restrito para administradores." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

    const runs = await prisma.autopilotRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const stats = await prisma.autopilotRun.aggregate({
      _count: { id: true },
      _sum: {
        productsAnalyzed: true,
        opportunitiesCreated: true,
        offersGenerated: true,
        publicationsPublished: true,
      },
    });

    return NextResponse.json({
      runs,
      totalRuns: stats._count.id,
      aggregatedMetrics: stats._sum,
    });
  } catch (error: unknown) {
    console.error("[API:Admin:Autopilot:Runs:Error]", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico administrativo de runs" },
      { status: 500 }
    );
  }
}
