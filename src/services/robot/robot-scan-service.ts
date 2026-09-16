import { prisma } from "@/lib/db/prisma";
import { discoveryService } from "../discovery/discovery-service";
import { ProductAnalysisService } from "@/domain/products/product-analysis";
import { OpportunityScoringService } from "@/domain/products/opportunity-score";
import { RobotScanConfig, DEFAULT_SCAN_CONFIG } from "@/domain/robot/scan-config";
import { MarketplacePlatform } from "@/domain/products/types";

export interface ScanExecutionResult {
  scanId: string;
  status: "COMPLETED" | "FAILED";
  startedAt: Date;
  finishedAt: Date;
  totalDiscovered: number;
  totalAnalyzed: number;
  totalQualified: number;
  totalRejected: number;
  qualifiedOpportunities: {
    id: string;
    productId: string;
    productTitle: string;
    platform: string;
    score: number;
    reasons: string[];
    currentPrice: number;
    commissionAmount: number;
  }[];
  errorMessage?: string;
}

export class RobotScanService {
  /**
   * Orchestrates the complete product discovery, analysis, deduplication, scoring and persistence pipeline.
   */
  static async executeScan(
    userId: string,
    customConfig?: Partial<RobotScanConfig>
  ): Promise<ScanExecutionResult> {
    const startedAt = new Date();

    // 1. Retrieve or build user config
    let userConfig = await prisma.robotConfig.findUnique({
      where: { userId },
    });

    if (!userConfig) {
      userConfig = await prisma.robotConfig.create({
        data: {
          userId,
          active: true,
          scanIntervalMinutes: 30,
          minOpportunityScore: customConfig?.minOpportunityScore ?? DEFAULT_SCAN_CONFIG.minOpportunityScore,
          minDiscount: customConfig?.minDiscount ?? DEFAULT_SCAN_CONFIG.minDiscount,
          minCommission: customConfig?.minCommission ?? DEFAULT_SCAN_CONFIG.minCommission,
          targetCategories: JSON.stringify(customConfig?.categories ?? DEFAULT_SCAN_CONFIG.categories),
          targetPlatforms: JSON.stringify(customConfig?.platforms ?? DEFAULT_SCAN_CONFIG.platforms),
        },
      });
    }

    const platforms: MarketplacePlatform[] =
      (customConfig?.platforms as MarketplacePlatform[]) ||
      JSON.parse(userConfig.targetPlatforms || "[]");
    const categories: string[] =
      customConfig?.categories || JSON.parse(userConfig.targetCategories || "[]");
    const minScore = customConfig?.minOpportunityScore ?? userConfig.minOpportunityScore;
    const maxResults = customConfig?.maxResults ?? DEFAULT_SCAN_CONFIG.maxResults;

    // 2. Create RobotScan record (RUNNING)
    const scan = await prisma.robotScan.create({
      data: {
        userId,
        status: "RUNNING",
        startedAt,
        platforms: JSON.stringify(platforms),
        categories: JSON.stringify(categories),
        minScore,
        minCommission: customConfig?.minCommission ?? userConfig.minCommission,
        maxPrice: customConfig?.maxPrice,
        maxResults,
      },
    });

    // 3. Log SCAN_STARTED event
    await prisma.robotEvent.create({
      data: {
        userId,
        scanId: scan.id,
        eventType: "SCAN_STARTED",
        title: "Varredura iniciada",
        description: `Buscando oportunidades em ${platforms.join(", ")} para ${categories.length} categorias.`,
        status: "INFO",
      },
    });

    try {
      // 4. Discovery Stage
      const discoveryResult = await discoveryService.discoverAll({
        platforms,
        categories,
      });

      await prisma.robotEvent.create({
        data: {
          userId,
          scanId: scan.id,
          eventType: "PRODUCTS_DISCOVERED",
          title: "Produtos garimpados",
          description: `${discoveryResult.products.length} produtos encontrados nos catálogos das plataformas.`,
          status: "SUCCESS",
        },
      });

      let totalAnalyzed = 0;
      let totalQualified = 0;
      let totalRejected = 0;
      const qualifiedList: ScanExecutionResult["qualifiedOpportunities"] = [];

      // 5. Process & Deduplicate each discovered product
      for (const normalized of discoveryResult.products.slice(0, maxResults)) {
        totalAnalyzed++;

        // 5a. Upsert Product (platform + externalId unique constraint)
        const product = await prisma.product.upsert({
          where: {
            platform_externalId: {
              platform: normalized.platform,
              externalId: normalized.externalId,
            },
          },
          update: {
            title: normalized.title,
            description: normalized.description,
            category: normalized.category,
            subcategory: normalized.subcategory,
            brand: normalized.brand,
            imageUrl: normalized.imageUrl,
            currentPrice: normalized.currentPrice,
            originalPrice: normalized.originalPrice,
            currency: normalized.currency,
            discountPercent: normalized.discountPercent,
            commissionRate: normalized.commissionRate,
            commissionAmount: normalized.commissionAmount,
            rating: normalized.rating,
            reviewCount: normalized.reviewCount,
            salesCount: normalized.salesCount,
            trendScore: normalized.trendScore,
            url: normalized.url,
            inStock: normalized.inStock,
            dataSource: normalized.dataSource,
            sourceMetadata: JSON.stringify(normalized.sourceMetadata || {}),
          },
          create: {
            externalId: normalized.externalId,
            platform: normalized.platform,
            title: normalized.title,
            description: normalized.description,
            category: normalized.category,
            subcategory: normalized.subcategory,
            brand: normalized.brand,
            imageUrl: normalized.imageUrl,
            currentPrice: normalized.currentPrice,
            originalPrice: normalized.originalPrice,
            currency: normalized.currency,
            discountPercent: normalized.discountPercent,
            commissionRate: normalized.commissionRate,
            commissionAmount: normalized.commissionAmount,
            rating: normalized.rating,
            reviewCount: normalized.reviewCount,
            salesCount: normalized.salesCount,
            trendScore: normalized.trendScore,
            url: normalized.url,
            inStock: normalized.inStock,
            dataSource: normalized.dataSource,
            sourceMetadata: JSON.stringify(normalized.sourceMetadata || {}),
          },
        });

        // 5b. Create ProductSnapshot
        await prisma.productSnapshot.create({
          data: {
            productId: product.id,
            currentPrice: product.currentPrice,
            originalPrice: product.originalPrice,
            discountPercent: product.discountPercent,
            rating: product.rating,
            reviewCount: product.reviewCount,
            commissionRate: product.commissionRate,
            commissionAmount: product.commissionAmount,
            metadata: JSON.stringify({ scanId: scan.id }),
          },
        });

        // 5c. Analysis Stage
        const analysis = ProductAnalysisService.analyze(normalized);

        // 5d. Scoring Stage
        const scoreCalc = OpportunityScoringService.calculate(normalized, analysis);

        // Update product's general opportunityScore
        await prisma.product.update({
          where: { id: product.id },
          data: { opportunityScore: scoreCalc.totalScore },
        });

        // 5e. Opportunity Qualification Check
        const isQualified = scoreCalc.totalScore >= minScore;
        const opportunityStatus = isQualified ? "QUALIFIED" : "REJECTED";

        if (isQualified) {
          totalQualified++;
        } else {
          totalRejected++;
        }

        // Upsert user-specific Opportunity
        const opportunity = await prisma.opportunity.upsert({
          where: {
            userId_productId: {
              userId,
              productId: product.id,
            },
          },
          update: {
            score: scoreCalc.totalScore,
            scoreBreakdown: JSON.stringify(scoreCalc.breakdown),
            reasons: JSON.stringify(scoreCalc.reasons),
            status: opportunityStatus,
            confidence: scoreCalc.confidence,
            dataCompleteness: scoreCalc.dataCompleteness,
          },
          create: {
            userId,
            productId: product.id,
            score: scoreCalc.totalScore,
            scoreBreakdown: JSON.stringify(scoreCalc.breakdown),
            reasons: JSON.stringify(scoreCalc.reasons),
            status: opportunityStatus,
            confidence: scoreCalc.confidence,
            dataCompleteness: scoreCalc.dataCompleteness,
          },
        });

        if (isQualified) {
          qualifiedList.push({
            id: opportunity.id,
            productId: product.id,
            productTitle: product.title,
            platform: product.platform,
            score: scoreCalc.totalScore,
            reasons: scoreCalc.reasons,
            currentPrice: product.currentPrice,
            commissionAmount: product.commissionAmount,
          });
        }
      }

      const finishedAt = new Date();

      // 6. Conclude RobotScan
      await prisma.robotScan.update({
        where: { id: scan.id },
        data: {
          status: "COMPLETED",
          finishedAt,
          totalDiscovered: discoveryResult.products.length,
          totalAnalyzed,
          totalQualified,
          totalRejected,
        },
      });

      // 7. Update RobotConfig last/next run
      const nextRunAt = new Date(
        finishedAt.getTime() + (userConfig.scanIntervalMinutes || 30) * 60 * 1000
      );
      await prisma.robotConfig.update({
        where: { userId },
        data: {
          lastRunAt: finishedAt,
          nextRunAt,
        },
      });

      // 8. Log final summary event
      await prisma.robotEvent.create({
        data: {
          userId,
          scanId: scan.id,
          eventType: "SCAN_COMPLETED",
          title: "Varredura concluída com sucesso",
          description: `${totalAnalyzed} produtos analisados. ${totalQualified} oportunidades qualificadas para o Radar.`,
          status: "SUCCESS",
        },
      });

      return {
        scanId: scan.id,
        status: "COMPLETED",
        startedAt,
        finishedAt,
        totalDiscovered: discoveryResult.products.length,
        totalAnalyzed,
        totalQualified,
        totalRejected,
        qualifiedOpportunities: qualifiedList,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido durante o scan.";
      const finishedAt = new Date();

      await prisma.robotScan.update({
        where: { id: scan.id },
        data: {
          status: "FAILED",
          finishedAt,
          errorMessage,
        },
      });

      await prisma.robotEvent.create({
        data: {
          userId,
          scanId: scan.id,
          eventType: "SCAN_FAILED",
          title: "Falha na varredura",
          description: `Ocorreu um erro durante o processamento: ${errorMessage}`,
          status: "ERROR",
        },
      });

      return {
        scanId: scan.id,
        status: "FAILED",
        startedAt,
        finishedAt,
        totalDiscovered: 0,
        totalAnalyzed: 0,
        totalQualified: 0,
        totalRejected: 0,
        qualifiedOpportunities: [],
        errorMessage,
      };
    }
  }
}
