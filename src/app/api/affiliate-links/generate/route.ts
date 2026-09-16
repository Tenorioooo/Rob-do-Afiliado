import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AffiliateLinkService } from "@/services/affiliate/affiliate-link-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateLinkSchema = z.object({
  productId: z.string().min(1, "ID do produto é obrigatório"),
  opportunityId: z.string().optional(),
  platform: z.string().optional(),
  originalUrl: z.string().optional(),
  customCampaign: z.string().optional(),
  customMedium: z.string().optional(),
  customSource: z.string().optional(),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { forceRegenerate, ...input } = parsed.data;

    const result = await AffiliateLinkService.generateOrGetLink(
      {
        ...input,
        userId: session.userId,
        platform: input.platform || "SHOPEE",
        originalUrl: input.originalUrl || "",
      },
      forceRegenerate
    );

    return NextResponse.json({
      success: true,
      link: result.link,
      generated: result.generated,
    });
  } catch (error: unknown) {
    console.error("[API:AffiliateLink:Generate:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao gerar link de afiliado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
