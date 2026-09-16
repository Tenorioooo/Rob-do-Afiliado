import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutomationService } from "@/services/automation/automation-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRuleSchema = z.object({
  name: z.string().min(2, "Nome da regra é obrigatório"),
  channelId: z.string().min(1, "Canal de destino é obrigatório"),
  config: z.object({
    minOpportunityScore: z.number().min(0).max(100).optional(),
    minCommissionRate: z.number().min(0).optional(),
    minDiscountPercentage: z.number().min(0).optional(),
    allowedMarketplaces: z.array(z.string()).optional(),
    allowedCategories: z.array(z.string()).optional(),
    copyStyle: z.enum(["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"]).optional(),
    autoPublish: z.boolean().default(true),
    operatingHours: z
      .object({
        start: z.string(),
        end: z.string(),
      })
      .optional(),
    maxDailyPublications: z.number().min(1).optional(),
    minIntervalMinutes: z.number().min(1).optional(),
    duplicateCooldownHours: z.number().min(1).optional(),
  }),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const rules = await AutomationService.listRules(session.userId);
    return NextResponse.json({ success: true, rules });
  } catch (error: unknown) {
    console.error("[API:Automation:List:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao listar regras de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const rule = await AutomationService.createRule({
      userId: session.userId,
      name: parsed.data.name,
      channelId: parsed.data.channelId,
      config: parsed.data.config,
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API:Automation:Create:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao criar regra de automação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
