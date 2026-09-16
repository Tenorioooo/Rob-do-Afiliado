import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ExperimentService } from "@/domain/analytics/experiments";
import { z } from "zod";

export const dynamic = "force-dynamic";

const experimentCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  targetMetric: z.enum(["CTR", "CONVERSION_RATE", "COMMISSION"]).default("CTR"),
  cooldownHours: z.number().int().min(1).default(6),
  maxExposure: z.number().int().min(10).default(100),
  variants: z.array(
    z.object({
      style: z.enum(["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"]),
      trafficWeight: z.number().min(0.05).max(1.0).optional(),
    })
  ).min(2, "O teste A/B precisa de pelo menos 2 variações"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const experiments = await prisma.experiment.findMany({
      where: { userId: session.userId },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ experiments });
  } catch (error: unknown) {
    console.error("[API:Analytics:Experiments:Get:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar experimentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = experimentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const experiment = await ExperimentService.createExperiment({
      userId: session.userId,
      name: parsed.data.name,
      description: parsed.data.description,
      targetMetric: parsed.data.targetMetric,
      cooldownHours: parsed.data.cooldownHours,
      maxExposure: parsed.data.maxExposure,
      variants: parsed.data.variants as any,
    });

    return NextResponse.json({ success: true, experiment });
  } catch (error: unknown) {
    console.error("[API:Analytics:Experiments:Post:Error]", error);
    return NextResponse.json({ error: "Erro ao criar experimento A/B" }, { status: 500 });
  }
}
