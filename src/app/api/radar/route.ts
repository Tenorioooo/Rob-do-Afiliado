import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OpportunitySortOption } from "@/domain/products/opportunity-ranking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 100);
    const platform = searchParams.get("platform");
    const category = searchParams.get("category");
    const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
    const minCommission = searchParams.get("minCommission") ? Number(searchParams.get("minCommission")) : undefined;
    const minDiscount = searchParams.get("minDiscount") ? Number(searchParams.get("minDiscount")) : undefined;
    const status = searchParams.get("status") || "QUALIFIED";
    const query = searchParams.get("query")?.trim();
    const sortBy = (searchParams.get("sortBy") as OpportunitySortOption) || "score_desc";

    // Build Prisma Where Clause
    const whereClause: any = {
      userId: session.userId,
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (minScore !== undefined && !isNaN(minScore)) {
      whereClause.score = { gte: minScore };
    }

    // Product-level filters
    const productWhere: any = {};
    if (platform && platform !== "ALL") {
      productWhere.platform = platform;
    }
    if (category && category !== "ALL") {
      productWhere.category = category;
    }
    if (minCommission !== undefined && !isNaN(minCommission)) {
      productWhere.commissionAmount = { gte: minCommission };
    }
    if (minDiscount !== undefined && !isNaN(minDiscount)) {
      productWhere.discountPercent = { gte: minDiscount };
    }
    if (query) {
      productWhere.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { category: { contains: query } },
      ];
    }

    if (Object.keys(productWhere).length > 0) {
      whereClause.product = productWhere;
    }

    // Determine OrderBy
    let orderBy: any = { score: "desc" };
    if (sortBy === "recent_desc") {
      orderBy = { detectedAt: "desc" };
    } else if (sortBy === "commission_desc") {
      orderBy = { product: { commissionAmount: "desc" } };
    } else if (sortBy === "discount_desc") {
      orderBy = { product: { discountPercent: "desc" } };
    } else if (sortBy === "rating_desc") {
      orderBy = { product: { rating: "desc" } };
    } else if (sortBy === "price_asc") {
      orderBy = { product: { currentPrice: "asc" } };
    } else if (sortBy === "price_desc") {
      orderBy = { product: { currentPrice: "desc" } };
    }

    // Total Count
    const totalCount = await prisma.opportunity.count({ where: whereClause });

    // Fetch Paginated Opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      include: {
        product: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const parsedOpportunities = opportunities.map((opp) => ({
      id: opp.id,
      productId: opp.productId,
      score: opp.score,
      confidence: opp.confidence,
      dataCompleteness: opp.dataCompleteness,
      status: opp.status,
      detectedAt: opp.detectedAt,
      reasons: JSON.parse(opp.reasons || "[]") as string[],
      scoreBreakdown: JSON.parse(opp.scoreBreakdown || "{}"),
      product: {
        id: opp.product.id,
        externalId: opp.product.externalId,
        platform: opp.product.platform,
        title: opp.product.title,
        description: opp.product.description,
        category: opp.product.category,
        subcategory: opp.product.subcategory,
        brand: opp.product.brand,
        imageUrl: opp.product.imageUrl,
        currentPrice: opp.product.currentPrice,
        originalPrice: opp.product.originalPrice,
        currency: opp.product.currency,
        discountPercent: opp.product.discountPercent,
        commissionRate: opp.product.commissionRate,
        commissionAmount: opp.product.commissionAmount,
        rating: opp.product.rating,
        reviewCount: opp.product.reviewCount,
        salesCount: opp.product.salesCount,
        trendScore: opp.product.trendScore,
        url: opp.product.url,
        inStock: opp.product.inStock,
        dataSource: opp.product.dataSource,
      },
    }));

    return NextResponse.json({
      opportunities: parsedOpportunities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: unknown) {
    console.error("[API:Radar:Get:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar oportunidades do Radar" }, { status: 500 });
  }
}
