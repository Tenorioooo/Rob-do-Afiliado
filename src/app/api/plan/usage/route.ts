import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OFFICIAL_PLANS } from "@/lib/constants/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    // Início do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // 1. Obter plano do usuário (ou Premium por padrão)
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const activePlanCode = subscription?.plan?.code || "PREMIUM";
    const planConfig =
      OFFICIAL_PLANS.find(
        (p) =>
          p.code === activePlanCode ||
          (activePlanCode === "PRO" && p.code === "PREMIUM") ||
          (activePlanCode === "ENTERPRISE" && p.code === "PRO_AUTOPILOT")
      ) || OFFICIAL_PLANS[1]; // default Premium

    // 2. Contar produtos analisados este mês a partir dos scans
    const scanAggregation = await prisma.robotScan.aggregate({
      where: {
        userId,
        startedAt: { gte: startOfMonth },
      },
      _sum: {
        totalAnalyzed: true,
        totalDiscovered: true,
      },
    });

    const productsAnalyzed = scanAggregation._sum.totalAnalyzed || 0;

    // 3. Contar cópias de IA geradas este mês
    const aiCopiesGenerated = await prisma.offer.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    // 4. Contar canais ativos e totais
    const activeChannels = await prisma.channel.count({
      where: {
        userId,
        active: true,
      },
    });

    const totalChannels = await prisma.channel.count({
      where: {
        userId,
      },
    });

    // 5. Contar publicações este mês
    const publicationsThisMonth = await prisma.publication.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    // 6. Próxima data de fatura (ou renovação)
    const nextBillingDate = subscription?.expiresAt
      ? subscription.expiresAt.toISOString()
      : new Date(now.getFullYear(), now.getMonth() + 1, 14).toISOString();

    return NextResponse.json({
      plan: planConfig,
      subscriptionStatus: subscription?.status || "ACTIVE",
      nextBillingDate,
      usage: {
        productsAnalyzed: {
          current: productsAnalyzed,
          limit: planConfig.limits.offersPerDay * 30 * 10, // Proporção da cota do plano
          isUnlimited: planConfig.code === "PRO_AUTOPILOT",
        },
        aiCopiesGenerated: {
          current: aiCopiesGenerated,
          limit: planConfig.limits.aiGenerationsPerMonth,
          isUnlimited: planConfig.code === "PRO_AUTOPILOT",
        },
        channels: {
          current: activeChannels,
          total: totalChannels,
          limit: planConfig.limits.channels,
          isUnlimited: planConfig.code === "PRO_AUTOPILOT",
        },
        publications: {
          current: publicationsThisMonth,
          dailyLimit: planConfig.limits.offersPerDay,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[API:Plan:Usage:Error]", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas de uso de recursos do plano" },
      { status: 500 }
    );
  }
}
