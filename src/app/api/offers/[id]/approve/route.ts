import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OfferService } from "@/services/offers/offer-service";
import { AutomationService } from "@/services/automation/automation-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const offer = await OfferService.approveOffer(params.id, session.userId);

    // Trigger automation evaluation in background for active rules
    let automationResults: any[] = [];
    try {
      automationResults = await AutomationService.evaluateAndTriggerForOffer(params.id, session.userId);
    } catch (autoErr) {
      console.warn("[API:Offers:Approve:AutomationWarning]", autoErr);
    }

    return NextResponse.json({ success: true, offer, automationResults });
  } catch (error: unknown) {
    console.error("[API:Offers:Approve:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao aprovar oferta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
