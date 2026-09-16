import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { RobotScanService } from "@/services/robot/robot-scan-service";
import { robotScanConfigSchema } from "@/domain/robot/scan-config";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let customConfig = undefined;
    try {
      const body = await request.json();
      const parseResult = robotScanConfigSchema.partial().safeParse(body);
      if (parseResult.success) {
        customConfig = parseResult.data;
      }
    } catch {
      // Body is optional
    }

    const result = await RobotScanService.executeScan(session.userId, customConfig);

    return NextResponse.json({
      success: result.status === "COMPLETED",
      result,
    });
  } catch (error: unknown) {
    console.error("[API:Robot:Scan:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao executar scan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
