import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Safe database ping without exposing connection strings or secrets
    await prisma.user.findFirst({ select: { id: true } });

    return NextResponse.json({
      status: "healthy",
      database: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
