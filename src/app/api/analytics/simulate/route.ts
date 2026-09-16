import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsService } from "@/services/analytics/analytics-service";
import { LearningSignalService } from "@/domain/analytics/learning-signals";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(Number(body.count || 35), 100);

    // Fetch user offers and links
    const links = await prisma.affiliateLink.findMany({
      where: { userId: session.userId, active: true },
      include: { offers: true },
    });

    if (links.length === 0) {
      return NextResponse.json(
        { error: "Nenhum link de afiliado disponível para simulação. Crie ou publique ofertas primeiro." },
        { status: 400 }
      );
    }

    const channels = await prisma.channel.findMany({
      where: { userId: session.userId },
    });

    let simulatedClicks = 0;
    let simulatedConversions = 0;

    for (let i = 0; i < count; i++) {
      const link = links[i % links.length];
      const offer = link.offers[0] || null;
      const channel = channels.length > 0 ? channels[i % channels.length] : null;

      // 1. Simulate Click
      await AnalyticsService.trackClick({
        userId: session.userId,
        affiliateLinkId: link.id,
        offerId: offer?.id || null,
        channelId: channel?.id || null,
        platform: link.platform,
        source: "mock",
        ipAddress: `192.168.1.${(i % 250) + 1}`,
      });
      simulatedClicks++;

      // 2. Simulate Conversion occasionally (approx 15% rate for testing)
      if (i % 6 === 0) {
        const orderValue = Number((Math.random() * 200 + 40).toFixed(2));
        const commissionValue = Number((orderValue * 0.08).toFixed(2));
        const status = i % 18 === 0 ? "CANCELLED" : "APPROVED";

        await AnalyticsService.recordConversion({
          userId: session.userId,
          affiliateLinkId: link.id,
          offerId: offer?.id || null,
          channelId: channel?.id || null,
          platform: link.platform,
          externalOrderId: `SIM_${Date.now()}_${i}`,
          orderValue,
          commissionValue,
          status: status as any,
          source: "mock",
          occurredAt: new Date(),
        });
        simulatedConversions++;
      }
    }

    // Refresh signals
    const signals = await LearningSignalService.computeSignals(session.userId);

    return NextResponse.json({
      success: true,
      message: `Simulação concluída: ${simulatedClicks} cliques e ${simulatedConversions} conversões mock gerados.`,
      simulatedClicks,
      simulatedConversions,
      signalsCount: signals.length,
    });
  } catch (error: unknown) {
    console.error("[API:Analytics:Simulate:Error]", error);
    return NextResponse.json({ error: "Erro na simulação de eventos" }, { status: 500 });
  }
}
