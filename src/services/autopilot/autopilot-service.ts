import { prisma } from "@/lib/db/prisma";
import { discoveryService } from "../discovery/discovery-service";
import { ProductAnalysisService } from "@/domain/products/product-analysis";
import { OpportunityScoringService } from "@/domain/products/opportunity-score";
import { PriceSignalService } from "@/domain/autopilot/price-signals";
import { ChannelBalancer } from "@/domain/autopilot/channel-balancer";
import { AutopilotSafetyGate } from "@/domain/autopilot/safety-gate";
import { LearningSignalService } from "@/domain/analytics/learning-signals";
import { AffiliateLinkService } from "../affiliate/affiliate-link-service";
import { OfferService } from "../offers/offer-service";
import { PublicationService } from "../publications/publication-service";
import { NotificationService } from "../notifications/notification-service";
import {
  AutomationMode,
  AutopilotConfigData,
  AutopilotCycleSummary,
  OpportunityDecisionAudit,
  PriceSignalResult,
} from "@/domain/autopilot/types";
import { MarketplacePlatform } from "@/domain/products/types";
import { OfferStyle } from "@/domain/offers/types";

export class AutopilotService {
  /**
   * Retrieves or creates default user AutopilotConfig.
   */
  static async getOrCreateConfig(userId: string): Promise<AutopilotConfigData> {
    let config = await prisma.autopilotConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await prisma.autopilotConfig.create({
        data: {
          userId,
          enabled: true,
          automationMode: "MANUAL",
          scanIntervalMinutes: 30,
          minOpportunityScore: 80,
          minCommission: 5.0,
          minDiscount: 10.0,
          maxPrice: 500.0,
          maxOffersPerDay: 20,
          maxOpportunitiesPerCycle: 10,
          maxProductsPerCycle: 50,
          minPublicationInterval: 15,
          autoGenerateOffers: true,
          autoApproveOffers: false,
          autoPublish: false,
          duplicateCooldownHours: 24,
          preferredPlatforms: JSON.stringify(["SHOPEE", "MERCADO_LIVRE", "AMAZON"]),
          preferredCategories: JSON.stringify(["Eletrônicos", "Casa e Cozinha", "Moda", "Beleza"]),
          preferredOfferStyles: JSON.stringify(["DESCONTO", "URGENCIA", "DIRETO"]),
          channelBalancingStrategy: "ALL",
        },
      });
    }

    return {
      id: config.id,
      userId: config.userId,
      enabled: config.enabled,
      automationMode: config.automationMode as AutomationMode,
      scanIntervalMinutes: config.scanIntervalMinutes,
      minOpportunityScore: config.minOpportunityScore,
      minCommission: config.minCommission,
      minDiscount: config.minDiscount,
      maxPrice: config.maxPrice,
      maxOffersPerDay: config.maxOffersPerDay,
      maxOpportunitiesPerCycle: config.maxOpportunitiesPerCycle,
      maxProductsPerCycle: config.maxProductsPerCycle,
      minPublicationInterval: config.minPublicationInterval,
      autoGenerateOffers: config.autoGenerateOffers,
      autoApproveOffers: config.autoApproveOffers,
      autoPublish: config.autoPublish,
      duplicateCooldownHours: config.duplicateCooldownHours,
      preferredPlatforms: JSON.parse(config.preferredPlatforms || "[]"),
      preferredCategories: JSON.parse(config.preferredCategories || "[]"),
      preferredOfferStyles: JSON.parse(config.preferredOfferStyles || "[]"),
      channelBalancingStrategy: config.channelBalancingStrategy as any,
      isLocked: config.isLocked,
      lockedAt: config.lockedAt,
      lastRunAt: config.lastRunAt,
      nextRunAt: config.nextRunAt,
    };
  }

  /**
   * Updates AutopilotConfig and harmonizes automation mode presets.
   */
  static async updateConfig(
    userId: string,
    input: Partial<AutopilotConfigData>
  ): Promise<AutopilotConfigData> {
    await this.getOrCreateConfig(userId);

    const updateData: any = {};
    if (input.enabled !== undefined) updateData.enabled = input.enabled;
    if (input.automationMode !== undefined) {
      updateData.automationMode = input.automationMode;
      // Harmonize mode presets
      if (input.automationMode === "MANUAL") {
        updateData.autoGenerateOffers = false;
        updateData.autoApproveOffers = false;
        updateData.autoPublish = false;
      } else if (input.automationMode === "ASSISTED") {
        updateData.autoGenerateOffers = true;
        updateData.autoApproveOffers = false;
        updateData.autoPublish = false;
      } else if (input.automationMode === "AUTOPILOT") {
        updateData.autoGenerateOffers = true;
        updateData.autoApproveOffers = true;
        updateData.autoPublish = true;
      }
    }
    if (input.scanIntervalMinutes !== undefined) updateData.scanIntervalMinutes = Number(input.scanIntervalMinutes);
    if (input.minOpportunityScore !== undefined) updateData.minOpportunityScore = Number(input.minOpportunityScore);
    if (input.minCommission !== undefined) updateData.minCommission = Number(input.minCommission);
    if (input.minDiscount !== undefined) updateData.minDiscount = Number(input.minDiscount);
    if (input.maxPrice !== undefined) updateData.maxPrice = input.maxPrice !== null ? Number(input.maxPrice) : null;
    if (input.maxOffersPerDay !== undefined) updateData.maxOffersPerDay = Number(input.maxOffersPerDay);
    if (input.maxOpportunitiesPerCycle !== undefined) updateData.maxOpportunitiesPerCycle = Number(input.maxOpportunitiesPerCycle);
    if (input.maxProductsPerCycle !== undefined) updateData.maxProductsPerCycle = Number(input.maxProductsPerCycle);
    if (input.minPublicationInterval !== undefined) updateData.minPublicationInterval = Number(input.minPublicationInterval);
    if (input.autoGenerateOffers !== undefined) updateData.autoGenerateOffers = input.autoGenerateOffers;
    if (input.autoApproveOffers !== undefined) updateData.autoApproveOffers = input.autoApproveOffers;
    if (input.autoPublish !== undefined) updateData.autoPublish = input.autoPublish;
    if (input.duplicateCooldownHours !== undefined) updateData.duplicateCooldownHours = Number(input.duplicateCooldownHours);
    if (input.preferredPlatforms !== undefined) updateData.preferredPlatforms = JSON.stringify(input.preferredPlatforms);
    if (input.preferredCategories !== undefined) updateData.preferredCategories = JSON.stringify(input.preferredCategories);
    if (input.preferredOfferStyles !== undefined) updateData.preferredOfferStyles = JSON.stringify(input.preferredOfferStyles);
    if (input.channelBalancingStrategy !== undefined) updateData.channelBalancingStrategy = input.channelBalancingStrategy;

    await prisma.autopilotConfig.update({
      where: { userId },
      data: updateData,
    });

    return await this.getOrCreateConfig(userId);
  }

  /**
   * Starts the autopilot.
   */
  static async start(userId: string) {
    await prisma.robotEvent.create({
      data: {
        userId,
        eventType: "AUTOPILOT_STARTED",
        title: "Autopiloto Ativado",
        description: "Operador autônomo ativado para buscas e execuções automáticas.",
        status: "SUCCESS",
      },
    });

    return await this.updateConfig(userId, { enabled: true });
  }

  /**
   * Pauses the autopilot.
   */
  static async pause(userId: string) {
    await prisma.robotEvent.create({
      data: {
        userId,
        eventType: "AUTOPILOT_PAUSED",
        title: "Autopiloto Pausado",
        description: "Operador autônomo colocado em pausa.",
        status: "INFO",
      },
    });

    return await this.updateConfig(userId, { enabled: false });
  }

  /**
   * Executes a complete autonomous cycle.
   */
  static async runCycle(
    userId: string,
    options: { isManualTrigger?: boolean } = {}
  ): Promise<AutopilotCycleSummary> {
    const startedAt = new Date();
    const config = await this.getOrCreateConfig(userId);

    // 1. Transactional Cycle Lock Protection
    if (config.isLocked && config.lockedAt) {
      const lockAgeMinutes = (startedAt.getTime() - new Date(config.lockedAt).getTime()) / (1000 * 60);
      if (lockAgeMinutes < 10) {
        throw new Error("Um ciclo do Autopiloto já está em execução para este usuário.");
      }
    }

    // Acquire lock
    await prisma.autopilotConfig.update({
      where: { userId },
      data: { isLocked: true, lockedAt: startedAt },
    });

    // 2. Create AutopilotRun record
    const run = await prisma.autopilotRun.create({
      data: {
        userId,
        status: "RUNNING",
        triggerType: options.isManualTrigger ? "MANUAL" : "SCHEDULED",
        startedAt,
      },
    });

    await prisma.robotEvent.create({
      data: {
        userId,
        eventType: "AUTOPILOT_CYCLE_STARTED",
        title: `Ciclo do Autopiloto Iniciado (${run.triggerType})`,
        description: `Modo: ${config.automationMode}. Buscando em ${config.preferredPlatforms.join(", ")}.`,
        metadata: JSON.stringify({ runId: run.id, mode: config.automationMode }),
        status: "INFO",
      },
    });

    const errors: { step: string; productId?: string; message: string }[] = [];
    const decisions: OpportunityDecisionAudit[] = [];
    let productsDiscovered = 0;
    let productsAnalyzed = 0;
    let opportunitiesCreated = 0;
    let opportunitiesQualified = 0;
    let opportunitiesRejected = 0;
    let offersGenerated = 0;
    let offersApproved = 0;
    let publicationsQueued = 0;
    let publicationsPublished = 0;

    try {
      // 3. Discovery Stage
      const discoveryResult = await discoveryService.discoverAll({
        platforms: config.preferredPlatforms,
        categories: config.preferredCategories,
      });

      productsDiscovered = discoveryResult.products.length;
      const productsToProcess = discoveryResult.products.slice(0, config.maxProductsPerCycle);

      await prisma.robotEvent.create({
        data: {
          userId,
          eventType: "AUTOPILOT_PRODUCT_DISCOVERED",
          title: "Produtos Descobertos pelo Autopiloto",
          description: `${productsDiscovered} produtos encontrados nas fontes monitoradas.`,
          status: "SUCCESS",
        },
      });

      const qualifiedCandidates: {
        product: any;
        score: number;
        decision: OpportunityDecisionAudit;
        scoreBreakdown: any;
        reasons: string[];
      }[] = [];

      // 4. Product Normalization, Snapshot Analysis & Deterministic Strategy Filtering
      for (const normalized of productsToProcess) {
        productsAnalyzed++;
        try {
          // 4a. Upsert Product
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
              brand: normalized.brand,
              imageUrl: normalized.imageUrl,
              currentPrice: normalized.currentPrice,
              originalPrice: normalized.originalPrice,
              discountPercent: normalized.discountPercent,
              commissionRate: normalized.commissionRate,
              commissionAmount: normalized.commissionAmount,
              rating: normalized.rating,
              reviewCount: normalized.reviewCount,
              salesCount: normalized.salesCount,
              trendScore: normalized.trendScore,
              url: normalized.url,
              inStock: normalized.inStock,
            },
            create: {
              externalId: normalized.externalId,
              platform: normalized.platform,
              title: normalized.title,
              description: normalized.description,
              category: normalized.category,
              brand: normalized.brand,
              imageUrl: normalized.imageUrl,
              currentPrice: normalized.currentPrice,
              originalPrice: normalized.originalPrice,
              discountPercent: normalized.discountPercent,
              commissionRate: normalized.commissionRate,
              commissionAmount: normalized.commissionAmount,
              rating: normalized.rating,
              reviewCount: normalized.reviewCount,
              salesCount: normalized.salesCount,
              trendScore: normalized.trendScore,
              url: normalized.url,
              inStock: normalized.inStock,
            },
          });

          // 4b. Fetch Previous Snapshots & Calculate Price Change Signal
          const previousSnapshots = await prisma.productSnapshot.findMany({
            where: { productId: product.id },
            orderBy: { observedAt: "desc" },
            take: 5,
          });

          const priceSignal: PriceSignalResult = PriceSignalService.calculateSignal(
            product.currentPrice,
            previousSnapshots
          );

          // Save new snapshot
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
              metadata: JSON.stringify({ runId: run.id, signal: priceSignal.signal }),
            },
          });

          // 4c. Analysis & Scoring
          const analysis = ProductAnalysisService.analyze(normalized);
          const scoreCalc = OpportunityScoringService.calculate(normalized, analysis);

          // 4d. Robot Deterministic Strategy Evaluation
          const qualReasons: string[] = [];
          const rejReasons: string[] = [];

          if (scoreCalc.totalScore < config.minOpportunityScore) {
            rejReasons.push(`Score (${scoreCalc.totalScore}) abaixo do mínimo (${config.minOpportunityScore})`);
          } else {
            qualReasons.push(`Score ${scoreCalc.totalScore} >= ${config.minOpportunityScore}`);
          }

          const commissionPct = normalized.commissionRate * 100;
          if (commissionPct < config.minCommission) {
            rejReasons.push(`Comissão (${commissionPct.toFixed(1)}%) menor que ${config.minCommission}%`);
          } else {
            qualReasons.push(`Comissão ${commissionPct.toFixed(1)}% >= ${config.minCommission}%`);
          }

          if (normalized.discountPercent < config.minDiscount) {
            rejReasons.push(`Desconto (${normalized.discountPercent}%) menor que ${config.minDiscount}%`);
          } else {
            qualReasons.push(`Desconto ${normalized.discountPercent}% >= ${config.minDiscount}%`);
          }

          if (config.maxPrice !== null && config.maxPrice > 0) {
            if (normalized.currentPrice > config.maxPrice) {
              rejReasons.push(`Preço (R$ ${normalized.currentPrice}) excede teto de R$ ${config.maxPrice}`);
            } else {
              qualReasons.push(`Preço R$ ${normalized.currentPrice} <= R$ ${config.maxPrice}`);
            }
          }

          if (config.preferredPlatforms.length > 0) {
            const matchPlat = config.preferredPlatforms.includes(normalized.platform);
            if (!matchPlat) {
              rejReasons.push(`Plataforma ${normalized.platform} fora das preferências`);
            } else {
              qualReasons.push(`Plataforma ${normalized.platform} compatível`);
            }
          }

          if (config.preferredCategories.length > 0) {
            const matchCat = config.preferredCategories.some(
              (c) => c.toLowerCase() === normalized.category.toLowerCase()
            );
            if (!matchCat) {
              rejReasons.push(`Categoria "${normalized.category}" não selecionada`);
            } else {
              qualReasons.push(`Categoria "${normalized.category}" selecionada`);
            }
          }

          // 4e. Cooldown & Smart Republishing Check
          const cooldownMs = config.duplicateCooldownHours * 60 * 60 * 1000;
          const recentPub = await prisma.publication.findFirst({
            where: {
              userId,
              offer: { productId: product.id },
              status: "PUBLISHED",
            },
            orderBy: { publishedAt: "desc" },
          });

          if (recentPub && recentPub.publishedAt) {
            const timeSince = startedAt.getTime() - new Date(recentPub.publishedAt).getTime();
            if (timeSince < cooldownMs) {
              if (priceSignal.isSignificantDrop) {
                qualReasons.push(`Smart Republish: Queda de preço real de ${Math.abs(priceSignal.percentChange)}% detectada!`);
              } else {
                rejReasons.push(`Cooldown de ${config.duplicateCooldownHours}h ativo (publicado recentemente).`);
              }
            }
          }

          const isQualified = rejReasons.length === 0;

          if (isQualified) {
            opportunitiesQualified++;
          } else {
            opportunitiesRejected++;
          }

          // Upsert Opportunity
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
              reasons: JSON.stringify([...scoreCalc.reasons, ...qualReasons]),
              status: isQualified ? "QUALIFIED" : "REJECTED",
              confidence: scoreCalc.confidence,
              dataCompleteness: scoreCalc.dataCompleteness,
            },
            create: {
              userId,
              productId: product.id,
              score: scoreCalc.totalScore,
              scoreBreakdown: JSON.stringify(scoreCalc.breakdown),
              reasons: JSON.stringify([...scoreCalc.reasons, ...qualReasons]),
              status: isQualified ? "QUALIFIED" : "REJECTED",
              confidence: scoreCalc.confidence,
              dataCompleteness: scoreCalc.dataCompleteness,
            },
          });

          opportunitiesCreated++;

          const decisionAudit: OpportunityDecisionAudit = {
            productId: product.id,
            externalId: product.externalId,
            productTitle: product.title,
            platform: product.platform,
            category: product.category,
            currentPrice: product.currentPrice,
            score: scoreCalc.totalScore,
            isQualified,
            qualificationReasons: qualReasons,
            rejectionReasons: rejReasons,
            priceSignal,
          };

          decisions.push(decisionAudit);

          if (isQualified) {
            qualifiedCandidates.push({
              product,
              score: scoreCalc.totalScore,
              decision: decisionAudit,
              scoreBreakdown: scoreCalc.breakdown,
              reasons: scoreCalc.reasons,
            });
          }
        } catch (itemErr: unknown) {
          const msg = itemErr instanceof Error ? itemErr.message : "Erro ao processar item individual";
          errors.push({ step: "product_processing", productId: normalized.externalId, message: msg });
        }
      }

      // 5. Ranking & Capping: Prioritize Top Opportunities by Score
      qualifiedCandidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.product.commissionAmount !== a.product.commissionAmount) {
          return b.product.commissionAmount - a.product.commissionAmount;
        }
        return b.product.discountPercent - a.product.discountPercent;
      });

      const selectedOpportunities = qualifiedCandidates.slice(0, config.maxOpportunitiesPerCycle);

      // 6. Continuous Learning Signals & Optimization
      const activeSignals = await LearningSignalService.computeSignals(userId);
      const bestCopySignal = activeSignals.find(
        (s) => s.signalType === "BEST_COPY_STYLE" && (s.confidence === "RELIABLE" || s.confidence === "STRONG")
      );
      const bestChannelSignal = activeSignals.find(
        (s) => s.signalType === "BEST_CHANNEL" && (s.confidence === "RELIABLE" || s.confidence === "STRONG")
      );

      // 7. Generate Affiliate Links, AI Offers, Auto-Approval & Auto-Publishing
      const userChannels = await prisma.channel.findMany({
        where: { userId, active: true },
      });

      const startOfToday = new Date(startedAt);
      startOfToday.setHours(0, 0, 0, 0);

      let todayPubCount = await prisma.publication.count({
        where: { userId, createdAt: { gte: startOfToday } },
      });

      let lastPub = await prisma.publication.findFirst({
        where: { userId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      });

      let lastDispatchedChannelId: string | null = null;

      for (const item of selectedOpportunities) {
        try {
          // Check if offer generation is enabled for this mode
          if (config.autoGenerateOffers || config.automationMode !== "MANUAL") {
            // 7a. Generate or retrieve Affiliate Link
            const { link } = await AffiliateLinkService.generateOrGetLink({
              userId,
              productId: item.product.id,
              platform: item.product.platform as any,
              externalProductId: item.product.externalId,
              originalUrl: item.product.url,
              customSource: "autopilot",
              customMedium: "robot",
              customCampaign: `cycle_${run.id.slice(-6)}`,
            });

            // 7b. Determine Copy Style based on continuous learning signals
            const appliedSignals: string[] = [];
            let effectiveStyle: OfferStyle =
              (config.preferredOfferStyles[0] as OfferStyle) || "DESCONTO";
            let recommendationReason = "Sem dados suficientes para otimização por IA. Utilizado estilo padrão configurado.";

            if (bestCopySignal) {
              effectiveStyle = bestCopySignal.targetEntity as OfferStyle;
              appliedSignals.push(`Copy Otimizada: ${bestCopySignal.targetEntity} (${bestCopySignal.confidence})`);
              recommendationReason = bestCopySignal.reason;
            }
            if (bestChannelSignal) {
              appliedSignals.push(`Canal Otimizado: ${bestChannelSignal.targetEntity} (${bestChannelSignal.confidence})`);
            }

            item.decision.learningSignalsApplied = appliedSignals;
            item.decision.recommendationReason = recommendationReason;

            const offerResult = await OfferService.generateOffersForProduct({
              userId,
              productId: item.product.id,
              affiliateLinkId: link.id,
              preferredStyle: effectiveStyle,
            });

            offersGenerated++;
            item.decision.offerGenerated = true;
            item.decision.offerId = offerResult.offer.id;
            item.decision.offerValidationStatus = offerResult.selectedVariant.validationStatus;

            // 6c. Auto Approval check
            let isOfferApproved = false;
            if (
              (config.autoApproveOffers || config.automationMode === "AUTOPILOT") &&
              offerResult.selectedVariant.validationStatus !== "REJECTED"
            ) {
              await OfferService.approveOffer(offerResult.offer.id, userId);
              offersApproved++;
              isOfferApproved = true;
              item.decision.approved = true;
            }

            // 6d. Auto Publishing & Safety Gate
            if (
              (config.autoPublish || config.automationMode === "AUTOPILOT") &&
              isOfferApproved &&
              userChannels.length > 0
            ) {
              // Select target channel(s) via ChannelBalancer
              const targetChannels = ChannelBalancer.selectChannels(
                userChannels.map((c) => ({
                  id: c.id,
                  userId: c.userId,
                  name: c.name,
                  type: c.type,
                  active: c.active,
                  status: c.status,
                })),
                config.channelBalancingStrategy,
                lastDispatchedChannelId
              );

              let itemPublications = 0;

              for (const targetCh of targetChannels) {
                const channelPub = await prisma.publication.findFirst({
                  where: {
                    userId,
                    channelId: targetCh.id,
                    offer: { productId: item.product.id },
                  },
                  orderBy: { createdAt: "desc" },
                });

                const safetyContext = {
                  userId,
                  offer: {
                    id: offerResult.offer.id,
                    userId,
                    status: "APPROVED",
                    validationStatus: offerResult.selectedVariant.validationStatus,
                    affiliateLinkId: link.id,
                    productId: item.product.id,
                  },
                  affiliateLink: {
                    id: link.id,
                    userId,
                    active: link.active,
                    affiliateUrl: link.affiliateUrl,
                  },
                  channel: targetCh,
                  todayPublicationsCount: todayPubCount,
                  maxOffersPerDay: config.maxOffersPerDay,
                  lastPublicationAt: lastPub?.publishedAt || null,
                  minIntervalMinutes: config.minPublicationInterval,
                  allowedStartTime: "00:00",
                  allowedEndTime: "23:59",
                  lastPublicationForChannelAndProduct: channelPub?.publishedAt || null,
                  duplicateCooldownHours: config.duplicateCooldownHours,
                  currentTime: new Date(),
                };

                const safetyEvaluation = AutopilotSafetyGate.evaluate(safetyContext);

                item.decision.safetyGatePassed = safetyEvaluation.passed;
                item.decision.safetyGateReasons = safetyEvaluation.blockingReasons;

                if (safetyEvaluation.passed && safetyEvaluation.canPublishImmediately) {
                  try {
                    await PublicationService.sendNow({
                      userId,
                      offerId: offerResult.offer.id,
                      channelId: targetCh.id,
                    });

                    publicationsPublished++;
                    publicationsQueued++;
                    itemPublications++;
                    todayPubCount++;
                    lastDispatchedChannelId = targetCh.id;
                    lastPub = { publishedAt: new Date() } as any;

                    await prisma.robotEvent.create({
                      data: {
                        userId,
                        eventType: "AUTOPILOT_PUBLICATION_PUBLISHED",
                        title: `Oferta Publicada no Canal ${targetCh.name}`,
                        description: `Publicação automática para produto ${item.product.title.slice(0, 45)}...`,
                        metadata: JSON.stringify({
                          offerId: offerResult.offer.id,
                          channelId: targetCh.id,
                        }),
                        status: "SUCCESS",
                      },
                    });
                  } catch (pubErr: unknown) {
                    const pMsg = pubErr instanceof Error ? pubErr.message : "Falha ao publicar no canal";
                    errors.push({ step: "channel_publication", productId: item.product.id, message: pMsg });
                  }
                }
              }

              item.decision.publicationsQueued = itemPublications;
            }
          }
        } catch (offerErr: unknown) {
          const oMsg = offerErr instanceof Error ? offerErr.message : "Erro ao gerar oferta automática";
          errors.push({ step: "offer_generation", productId: item.product.id, message: oMsg });
        }
      }

      const finishedAt = new Date();
      const status = errors.length === 0 ? "COMPLETED" : "PARTIAL";

      // 7. Update AutopilotRun
      await prisma.autopilotRun.update({
        where: { id: run.id },
        data: {
          status,
          finishedAt,
          productsDiscovered,
          productsAnalyzed,
          opportunitiesCreated,
          opportunitiesQualified,
          opportunitiesRejected,
          offersGenerated,
          offersApproved,
          publicationsQueued,
          publicationsPublished,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          decisions: JSON.stringify(decisions),
        },
      });

      // 8. Update Next Run At on Config & Release Lock
      const nextRunAt = new Date(
        finishedAt.getTime() + config.scanIntervalMinutes * 60 * 1000
      );

      await prisma.autopilotConfig.update({
        where: { userId },
        data: {
          isLocked: false,
          lockedAt: null,
          lastRunAt: finishedAt,
          nextRunAt,
        },
      });

      // 9. Send In-App Notifications for Key Events
      if (opportunitiesQualified > 0) {
        const topItem = selectedOpportunities[0];
        if (topItem && topItem.score >= 90) {
          await NotificationService.createNotification({
            userId,
            title: `Nova oportunidade excepcional (${topItem.score}/100)`,
            message: `${topItem.product.title} detectado com ${topItem.product.discountPercent}% OFF e comissão de ${(topItem.product.commissionRate * 100).toFixed(0)}%.`,
            type: "OPPORTUNITY",
            linkUrl: "/radar",
          });
        }
      }

      if (publicationsPublished > 0) {
        await NotificationService.createNotification({
          userId,
          title: "Publicação Autônoma Realizada",
          message: `${publicationsPublished} oferta(s) disparadas com sucesso nos canais configurados.`,
          type: "SUCCESS",
          linkUrl: "/publications",
        });
      }

      await prisma.robotEvent.create({
        data: {
          userId,
          eventType: "AUTOPILOT_CYCLE_FINISHED",
          title: `Ciclo do Autopiloto Concluído (${status})`,
          description: `${productsAnalyzed} produtos analisados. ${opportunitiesQualified} qualificadas, ${offersGenerated} ofertas e ${publicationsPublished} publicações.`,
          metadata: JSON.stringify({ runId: run.id, status, errorsCount: errors.length }),
          status: status === "COMPLETED" ? "SUCCESS" : "WARNING",
        },
      });

      return {
        runId: run.id,
        status,
        startedAt,
        finishedAt,
        productsDiscovered,
        productsAnalyzed,
        opportunitiesCreated,
        opportunitiesQualified,
        opportunitiesRejected,
        offersGenerated,
        offersApproved,
        publicationsQueued,
        publicationsPublished,
        decisions,
        errors,
      };
    } catch (fatalError: unknown) {
      const finishedAt = new Date();
      const fatalMsg = fatalError instanceof Error ? fatalError.message : "Erro fatal no ciclo do autopiloto";

      await prisma.autopilotRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          finishedAt,
          errors: JSON.stringify([{ step: "fatal_cycle_error", message: fatalMsg }]),
        },
      });

      // Release lock so system can recover
      await prisma.autopilotConfig.update({
        where: { userId },
        data: { isLocked: false, lockedAt: null, lastRunAt: finishedAt },
      });

      await prisma.robotEvent.create({
        data: {
          userId,
          eventType: "AUTOPILOT_CYCLE_FAILED",
          title: "Falha Fatal no Ciclo do Autopiloto",
          description: fatalMsg,
          metadata: JSON.stringify({ runId: run.id }),
          status: "ERROR",
        },
      });

      await NotificationService.createNotification({
        userId,
        title: "Erro no ciclo do Autopiloto",
        message: fatalMsg,
        type: "WARNING",
        linkUrl: "/autopilot/history",
      });

      return {
        runId: run.id,
        status: "FAILED",
        startedAt,
        finishedAt,
        productsDiscovered,
        productsAnalyzed,
        opportunitiesCreated,
        opportunitiesQualified,
        opportunitiesRejected,
        offersGenerated,
        offersApproved,
        publicationsQueued,
        publicationsPublished,
        decisions,
        errors: [{ step: "fatal_cycle_error", message: fatalMsg }],
      };
    }
  }
}
