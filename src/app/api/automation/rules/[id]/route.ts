import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutomationService } from "@/services/automation/automation-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateRuleSchema = z.object({
  name: z.string().min(2).optional(),
  channelId: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const rule = await AutomationService.getRuleById(params.id, session.userId);
    if (!rule) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule });
  } catch (error: unknown) {
    console.error("[API:Automation:Get:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao obter regra de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const rule = await AutomationService.updateRule(params.id, session.userId, parsed.data);
    return NextResponse.json({ success: true, rule });
  } catch (error: unknown) {
    console.error("[API:Automation:Update:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar regra de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await AutomationService.deleteRule(params.id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API:Automation:Delete:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao excluir regra de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
