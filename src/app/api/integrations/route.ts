import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ConnectionService } from "@/services/integrations/connection-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const saveConnectionSchema = z.object({
  provider: z.string().min(1, "Provedor é obrigatório"),
  credentials: z.record(z.any()),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const connections = await ConnectionService.getUserConnections(session.userId);
    return NextResponse.json({ connections });
  } catch (error: unknown) {
    console.error("[API:Integrations:List:Error]", error);
    return NextResponse.json({ error: "Erro ao listar integrações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = saveConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await ConnectionService.saveConnection({
      userId: session.userId,
      provider: parsed.data.provider,
      credentials: parsed.data.credentials,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API:Integrations:Save:Error]", error);
    const message = error instanceof Error ? error.message : "Erro ao salvar integração";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
