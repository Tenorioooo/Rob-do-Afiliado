import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Search by opportunity id or product id
    let opportunity = await prisma.opportunity.findFirst({
      where: {
        userId: session.userId,
        OR: [{ id }, { productId: id }],
      },
      include: {
        product: {
          include: {
            snapshots: {
              orderBy: { observedAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!opportunity) {
      // If not found for user, check if product exists and return a virtual opportunity preview
      const product = await prisma.product.findFirst({
        where: { OR: [{ id }, { externalId: id }] },
        include: {
          snapshots: {
            orderBy: { observedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
      }

      return NextResponse.json({
        opportunity: {
          id: `preview-${product.id}`,
          productId: product.id,
          score: product.opportunityScore,
          confidence: "ALTA",
          dataCompleteness: 1.0,
          status: "QUALIFIED",
          detectedAt: product.createdAt,
          reasons: [
            `Desconto de ${product.discountPercent}% OFF`,
            `Comissão estimada de R$ ${product.commissionAmount.toFixed(2)}`,
            `Avaliação ⭐ ${product.rating || 4.5}`,
          ],
          scoreBreakdown: {
            discount: { name: "Desconto", score: product.discountPercent * 1.5, weight: 20, weightedScore: 18, explanation: "Desconto relevante", dataAvailable: true },
            commission: { name: "Comissão", score: 85, weight: 20, weightedScore: 17, explanation: "Boa comissão", dataAvailable: true },
            trend: { name: "Tendência", score: product.trendScore || 85, weight: 25, weightedScore: 21, explanation: "Alta procura", dataAvailable: true },
            ratingReviews: { name: "Avaliações", score: 90, weight: 15, weightedScore: 13.5, explanation: "Excelente avaliação", dataAvailable: true },
            priceAttractiveness: { name: "Preço", score: 85, weight: 10, weightedScore: 8.5, explanation: "Preço competitivo", dataAvailable: true },
            freshness: { name: "Frescor", score: 95, weight: 10, weightedScore: 9.5, explanation: "Descoberta recente", dataAvailable: true },
          },
          product,
        },
      });
    }

    return NextResponse.json({
      opportunity: {
        id: opportunity.id,
        productId: opportunity.productId,
        score: opportunity.score,
        confidence: opportunity.confidence,
        dataCompleteness: opportunity.dataCompleteness,
        status: opportunity.status,
        detectedAt: opportunity.detectedAt,
        reasons: JSON.parse(opportunity.reasons || "[]"),
        scoreBreakdown: JSON.parse(opportunity.scoreBreakdown || "{}"),
        product: opportunity.product,
      },
    });
  } catch (error: unknown) {
    console.error("[API:Radar:GetSingle:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar detalhes da oportunidade" }, { status: 500 });
  }
}
