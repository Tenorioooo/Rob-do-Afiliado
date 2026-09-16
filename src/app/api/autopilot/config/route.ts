import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AutopilotService } from "@/services/autopilot/autopilot-service";
import { z } from "zod";

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  automationMode: z.enum(["MANUAL", "ASSISTED", "AUTOPILOT"]).optional(),
  scanIntervalMinutes: z.number().min(5).max(1440).optional(),
  minOpportunityScore: z.number().min(0).max(100).optional(),
  minCommission: z.number().min(0).max(100).optional(),
  minDiscount: z.number().min(0).max(100).optional(),
  maxPrice: z.number().nullable().optional(),
  maxOffersPerDay: z.number().min(1).max(500).optional(),
  maxOpportunitiesPerCycle: z.number().min(1).max(100).optional(),
  maxProductsPerCycle: z.number().min(1).max(200).optional(),
  minPublicationInterval: z.number().min(1).max(1440).optional(),
  autoGenerateOffers: z.boolean().optional(),
  autoApproveOffers: z.boolean().optional(),
  autoPublish: z.boolean().optional(),
  duplicateCooldownHours: z.number().min(1).max(720).optional(),
  preferredPlatforms: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredOfferStyles: z.array(z.string()).optional(),
  channelBalancingStrategy: z.enum(["ALL", "ROUND_ROBIN", "PRIORITY"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updatedConfig = await AutopilotService.updateConfig(
      session.userId,
      parseResult.data as any
    );

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error: unknown) {
    console.error("[API:Autopilot:Config:PATCH:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar configuração";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
