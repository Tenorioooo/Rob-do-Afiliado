import { prisma } from "@/lib/db/prisma";
import { getAffiliateAdapter } from "@/domain/affiliate/affiliate-adapters";
import { AffiliateLinkInput, GeneratedAffiliateLinkResult } from "@/domain/affiliate/types";

export class AffiliateLinkService {
  /**
   * Generates or retrieves an existing valid affiliate link for a given user & product/opportunity.
   */
  static async generateOrGetLink(
    input: AffiliateLinkInput,
    forceRegenerate: boolean = false
  ): Promise<{ link: any; generated: GeneratedAffiliateLinkResult }> {
    // 1. Validate Product Existence or URL
    let product = input.productId && input.productId !== "custom-url"
      ? await prisma.product.findUnique({
          where: { id: input.productId },
        })
      : null;

    const originUrl = input.originalUrl || product?.url || "";
    let platformKey = (input.platform || product?.platform || "SHOPEE").toLowerCase();

    if (!input.platform && originUrl) {
      if (originUrl.includes("shopee")) platformKey = "shopee";
      else if (originUrl.includes("mercadolivre") || originUrl.includes("mercadolibre")) platformKey = "mercado_livre";
      else if (originUrl.includes("amazon") || originUrl.includes("amzn")) platformKey = "amazon";
    }

    if (!product && !originUrl) {
      throw new Error(`Informe o produto ou a URL original para gerar o link.`);
    }

    // 2. Validate Opportunity if provided
    let opportunityId = input.opportunityId;
    if (opportunityId) {
      const opp = await prisma.opportunity.findFirst({
        where: { id: opportunityId, userId: input.userId },
      });
      if (!opp && product) {
        // Fallback: check if opportunity exists for userId & productId
        const oppByProd = await prisma.opportunity.findUnique({
          where: {
            userId_productId: {
              userId: input.userId,
              productId: product.id,
            },
          },
        });
        opportunityId = oppByProd?.id;
      }
    }

    // 3. Check for existing active link if not force regenerating
    if (!forceRegenerate && product) {
      const existingLink = await prisma.affiliateLink.findFirst({
        where: {
          userId: input.userId,
          productId: product.id,
          active: true,
          status: "GENERATED",
        },
        include: { product: true },
      });

      if (existingLink) {
        return {
          link: existingLink,
          generated: {
            success: true,
            url: existingLink.affiliateUrl,
            shortCode: existingLink.shortCode,
            platform: existingLink.platform,
            externalProductId: existingLink.externalProductId || product.externalId,
            source: existingLink.source as any,
            generatedAt: existingLink.generatedAt,
            tracking: {
              utmSource: existingLink.utmSource || undefined,
              utmMedium: existingLink.utmMedium || undefined,
              utmCampaign: existingLink.utmCampaign || undefined,
              utmContent: existingLink.utmContent || undefined,
              userId: existingLink.userId,
              opportunityId: existingLink.opportunityId || undefined,
            },
          },
        };
      }
    }

    // 4. Generate link via platform adapter (checking for active real connection first)
    const trackingExtraParams: Record<string, string> = {};

    const trackingConfig = {
      utmSource: input.customSource || `${platformKey}_affiliate`,
      utmMedium: input.customMedium || "affiliate_ai_robot",
      utmCampaign: input.customCampaign || "promo_radar",
      userId: input.userId,
      opportunityId: opportunityId,
      extraParams: trackingExtraParams,
    };

    let generatedResult: GeneratedAffiliateLinkResult | null = null;

    try {
      const activeConnection = await prisma.integrationConnection.findFirst({
        where: {
          userId: input.userId,
          provider: {
            in: [
              platformKey,
              platformKey.replace("_", ""),
              platformKey.toUpperCase(),
              platformKey.replace("_", " "),
            ],
          },
          status: { in: ["ACTIVE", "CONNECTED", "VERIFIED_REAL"] },
        },
      });

      if (activeConnection) {
        const { ConnectionService } = await import("@/services/integrations/connection-service");
        const creds = await ConnectionService.getDecryptedCredentials(activeConnection.id);

        // 4.1. SHOPEE Real Link Generation
        if (platformKey === "shopee" || platformKey === "shp") {
          const { ShopeeMarketplaceAdapter } = await import("@/integrations/marketplaces/shopee.adapter");
          const secretKey = creds.secretKey || creds.secret || creds.secret_key;
          const appId = creds.appId || creds.app_id;
          const subIdPrefix = creds.subIdPrefix || creds.sub_id || "robo";

          if (appId && secretKey) {
            const shopeeResult = await ShopeeMarketplaceAdapter.generateAffiliateLink({
              appId,
              secretKey,
              originUrl: originUrl,
              subIds: [subIdPrefix, input.userId.slice(0, 10), (opportunityId || "").slice(0, 10)],
            });

            if (shopeeResult.success && shopeeResult.shortLink) {
              generatedResult = {
                success: true,
                url: shopeeResult.shortLink,
                shortCode: `shp_${Date.now().toString(36)}`,
                platform: "SHOPEE",
                externalProductId: input.externalProductId || product?.externalId || "shopee_item",
                source: "real",
                generatedAt: new Date(),
                tracking: trackingConfig,
              };
            }
          }
        }

        // 4.2. MERCADO LIVRE Real Affiliate Tag Injection
        if (platformKey === "mercado_livre" || platformKey === "mercadolivre" || platformKey === "ml") {
          const affiliateTag = creds.affiliateTag || creds.matt_tool || creds.tagId || creds.tag || creds.partnerId;
          if (affiliateTag) {
            trackingExtraParams["matt_tool"] = affiliateTag;
            trackingExtraParams["matt_word"] = affiliateTag;
            trackingExtraParams["aff_id"] = affiliateTag;
          }
        }

        // 4.3. AMAZON Associates Tag Injection
        if (platformKey === "amazon" || platformKey === "amz") {
          const partnerTag = creds.partnerTag || creds.tag || creds.storeId;
          if (partnerTag) {
            trackingExtraParams["tag"] = partnerTag;
          }
        }
      }
    } catch (connErr) {
      console.warn("[AffiliateLinkService] Could not process connected credentials:", connErr);
    }

    if (!generatedResult) {
      const adapter = getAffiliateAdapter(input.platform || product?.platform || "SHOPEE");
      generatedResult = await adapter.generateLink(
        originUrl,
        input.externalProductId || product?.externalId || Date.now().toString(),
        trackingConfig
      );
    }

    if (!generatedResult.success || !generatedResult.url) {
      throw new Error(generatedResult.error || "Falha ao gerar link de afiliado.");
    }

    // 5. Ensure unique shortCode in database
    let shortCode = generatedResult.shortCode;
    const existingCode = await prisma.affiliateLink.findUnique({
      where: { shortCode },
    });
    if (existingCode) {
      shortCode = `${shortCode}-${Date.now().toString(36).slice(-4)}`;
    }

    // 6. Persist to DB
    const savedLink = await prisma.affiliateLink.create({
      data: {
        userId: input.userId,
        productId: product?.id || null,
        opportunityId: opportunityId || null,
        platform: (input.platform || product?.platform || platformKey.toUpperCase()),
        externalProductId: input.externalProductId || product?.externalId || null,
        originalUrl: originUrl,
        affiliateUrl: generatedResult.url,
        shortCode,
        status: "GENERATED",
        source: generatedResult.source || "real",
        utmSource: trackingConfig.utmSource,
        utmMedium: trackingConfig.utmMedium,
        utmCampaign: trackingConfig.utmCampaign,
        active: true,
        generatedAt: generatedResult.generatedAt,
      },
      include: { product: true },
    });

    // 7. Log Robot Event
    try {
      await prisma.robotEvent.create({
        data: {
          userId: input.userId,
          eventType: "AFFILIATE_LINK_GENERATED",
          title: `Link de Afiliado Gerado (${savedLink.platform})`,
          description: product?.title
            ? `Link de afiliado gerado com sucesso para ${product.title.slice(0, 50)}...`
            : `Link de afiliado gerado com sucesso (${savedLink.shortCode})`,
          metadata: JSON.stringify({
            linkId: savedLink.id,
            shortCode: savedLink.shortCode,
            platform: savedLink.platform,
            source: savedLink.source,
          }),
          status: "SUCCESS",
        },
      });
    } catch {
      // Non-blocking event log
    }

    return {
      link: savedLink,
      generated: generatedResult,
    };
  }

  /**
   * Get user's affiliate links with pagination and search.
   */
  static async getUserLinks(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      platform?: string;
      search?: string;
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.platform && options.platform !== "ALL") {
      where.platform = options.platform;
    }
    if (options.search) {
      where.OR = [
        { shortCode: { contains: options.search } },
        { product: { title: { contains: options.search } } },
        { utmCampaign: { contains: options.search } },
      ];
    }

    const [total, links] = await Promise.all([
      prisma.affiliateLink.count({ where }),
      prisma.affiliateLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: true,
          opportunity: true,
        },
      }),
    ]);

    return {
      links,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
