import { NextRequest, NextResponse } from "next/server";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const EmergencyStopSchema = z.object({
  confirmation: z.literal("PARAR", {
    errorMap: () => ({ message: "A confirmação da Parada de Emergência exige digitar exatamente a palavra 'PARAR'." }),
  }),
  reason: z.string().min(3, "Informe um motivo para a parada de emergência."),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = EmergencyStopSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await DispatchGuardService.triggerEmergencyStop({
      userId: session.userId,
      reason: parseResult.data.reason,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      canceledJobsCount: result.canceledJobsCount,
      config: DispatchGuardService.getDispatchConfig(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao acionar Parada de Emergência.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const config = DispatchGuardService.getDispatchConfig();
    return NextResponse.json({ config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar status dos switches.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
