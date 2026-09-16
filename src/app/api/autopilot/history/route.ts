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
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const status = searchParams.get("status");

    const where: any = { userId: session.userId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [total, runs] = await Promise.all([
      prisma.autopilotRun.count({ where }),
      prisma.autopilotRun.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("[API:Autopilot:History:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar histórico do autopiloto" }, { status: 500 });
  }
}
