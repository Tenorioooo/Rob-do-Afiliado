import { prisma } from "@/lib/db/prisma";
import { AutomationEngine } from "@/domain/automation/automation-engine";
import { AutomationRuleConfig, AutomationDecision, AutomationEvaluationContext } from "@/domain/automation/types";
import { PublicationService } from "../publications/publication-service";

export interface CreateRuleInput {
  userId: string;
  name: string;
  channelId?: string;
  channelIds?: string[];
  config: Record<string, any> | Partial<AutomationRuleConfig>;
}

export interface UpdateRuleInput {
  name?: string;
  channelId?: string;
  channelIds?: string[];
  config?: Record<string, any> | Partial<AutomationRuleConfig>;
  active?: boolean;
}

export class AutomationService {
  /**
   * List all automation rules for a user
   */
  static async listRules(userId: string) {
    const rules = await prisma.automationRule.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Fetch user channels to attach channel information
    const channels = await prisma.channel.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        destination: true,
        active: true,
      },
    });

    const channelMap = new Map(channels.map((c) => [c.id, c]));

    return rules.map((r) => {
      let cIds: string[] = [];
      try {
        cIds = JSON.parse(r.channelIds || "[]");
      } catch {
        cIds = [];
      }

      const primaryChannel = cIds.length > 0 ? channelMap.get(cIds[0]) : null;

      return {
        ...r,
        channel: primaryChannel || {
          id: cIds[0] || "",
          name: "Canal Geral",
          type: "TELEGRAM",
          provider: "mock",
          destination: "Todos",
          active: true,
        },
        channels: cIds.map((id) => channelMap.get(id)).filter(Boolean),
      };
    });
  }

  /**
   * Get rule by ID with ownership check
   */
  static async getRuleById(ruleId: string, userId: string) {
    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.userId !== userId) {
      return null;
    }

    let cIds: string[] = [];
    try {
      cIds = JSON.parse(rule.channelIds || "[]");
    } catch {
      cIds = [];
    }

    const channels = await prisma.channel.findMany({
      where: { id: { in: cIds }, userId },
    });

    return {
      ...rule,
      channels,
      channel: channels[0] || null,
    };
  }

  /**
   * Create automation rule
   */
  static async createRule(input: CreateRuleInput) {
    const cfg = input.config || {};
    const channelIds = input.channelIds || (input.channelId ? [input.channelId] : (cfg as any).channelIds || []);

    const rule = await prisma.automationRule.create({
      data: {
        userId: input.userId,
        name: input.name,
        active: true,
        minOpportunityScore: Number(cfg.minOpportunityScore ?? 80),
        minCommission: Number((cfg as any).minCommissionRate ?? cfg.minCommission ?? 5),
        minDiscount: Number((cfg as any).minDiscountPercentage ?? cfg.minDiscount ?? 15),
        maxPrice: cfg.maxPrice ? Number(cfg.maxPrice) : null,
        platforms: JSON.stringify((cfg as any).allowedMarketplaces ?? cfg.platforms ?? ["SHOPEE", "MERCADO_LIVRE", "AMAZON"]),
        categories: JSON.stringify((cfg as any).allowedCategories ?? cfg.categories ?? []),
        channelIds: JSON.stringify(channelIds),
        offerStyle: (cfg as any).copyStyle ?? cfg.offerStyle ?? "DESCONTO",
        maxOffersPerDay: Number((cfg as any).maxDailyPublications ?? cfg.maxOffersPerDay ?? 20),
        minIntervalMinutes: Number(cfg.minIntervalMinutes ?? 15),
        allowedStartTime: (cfg as any).operatingHours?.start ?? cfg.allowedStartTime ?? "08:00",
        allowedEndTime: (cfg as any).operatingHours?.end ?? cfg.allowedEndTime ?? "22:00",
        duplicateCooldownHours: Number(cfg.duplicateCooldownHours ?? 24),
        autoApprove: Boolean((cfg as any).autoPublish ?? cfg.autoApprove ?? false),
      },
    });

    await prisma.robotEvent.create({
      data: {
        userId: input.userId,
        eventType: "AUTOMATION_RULE_CREATED",
        title: "Regra de Automação Criada",
        description: `Regra '${rule.name}' criada com sucesso.`,
        metadata: JSON.stringify({ ruleId: rule.id }),
      },
    });

    return rule;
  }

  /**
   * Update automation rule
   */
  static async updateRule(ruleId: string, userId: string, input: UpdateRuleInput) {
    const existing = await prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Regra de automação não encontrada ou acesso não autorizado.");
    }

    const cfg = input.config || {};
    const channelIds = input.channelIds || (input.channelId ? [input.channelId] : undefined);

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.active !== undefined) updateData.active = input.active;
    if (channelIds !== undefined) updateData.channelIds = JSON.stringify(channelIds);
    if (cfg.minOpportunityScore !== undefined) updateData.minOpportunityScore = Number(cfg.minOpportunityScore);
    if ((cfg as any).minCommissionRate !== undefined || cfg.minCommission !== undefined) {
      updateData.minCommission = Number((cfg as any).minCommissionRate ?? cfg.minCommission);
    }
    if ((cfg as any).minDiscountPercentage !== undefined || cfg.minDiscount !== undefined) {
      updateData.minDiscount = Number((cfg as any).minDiscountPercentage ?? cfg.minDiscount);
    }
    if ((cfg as any).allowedMarketplaces !== undefined || cfg.platforms !== undefined) {
      updateData.platforms = JSON.stringify((cfg as any).allowedMarketplaces ?? cfg.platforms);
    }
    if ((cfg as any).copyStyle !== undefined || cfg.offerStyle !== undefined) {
      updateData.offerStyle = (cfg as any).copyStyle ?? cfg.offerStyle;
    }
    if ((cfg as any).operatingHours?.start !== undefined || cfg.allowedStartTime !== undefined) {
      updateData.allowedStartTime = (cfg as any).operatingHours?.start ?? cfg.allowedStartTime;
    }
    if ((cfg as any).operatingHours?.end !== undefined || cfg.allowedEndTime !== undefined) {
      updateData.allowedEndTime = (cfg as any).operatingHours?.end ?? cfg.allowedEndTime;
    }
    if ((cfg as any).maxDailyPublications !== undefined || cfg.maxOffersPerDay !== undefined) {
      updateData.maxOffersPerDay = Number((cfg as any).maxDailyPublications ?? cfg.maxOffersPerDay);
    }
    if (cfg.minIntervalMinutes !== undefined) updateData.minIntervalMinutes = Number(cfg.minIntervalMinutes);
    if (cfg.duplicateCooldownHours !== undefined) updateData.duplicateCooldownHours = Number(cfg.duplicateCooldownHours);

    return await prisma.automationRule.update({
      where: { id: ruleId },
      data: updateData,
    });
  }

  /**
   * Delete automation rule
   */
  static async deleteRule(ruleId: string, userId: string) {
    const existing = await prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Regra não encontrada ou acesso não autorizado.");
    }

    await prisma.automationRule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  }

  /**
   * Activate rule
   */
  static async activateRule(ruleId: string, userId: string) {
    const existing = await prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Regra não encontrada ou acesso não autorizado.");
    }

    return await prisma.automationRule.update({
      where: { id: ruleId },
      data: { active: true },
    });
  }

  /**
   * Deactivate rule
   */
  static async deactivateRule(ruleId: string, userId: string) {
    const existing = await prisma.automationRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Regra não encontrada ou acesso não autorizado.");
    }

    return await prisma.automationRule.update({
      where: { id: ruleId },
      data: { active: false },
    });
  }

  /**
   * Evaluate all active rules for an offer and automatically publish if criteria matched
   */
  static async evaluateAndTriggerForOffer(offerId: string, userId: string): Promise<AutomationDecision[]> {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        product: true,
      },
    });

    if (!offer || offer.userId !== userId) {
      return [];
    }

    const activeRules = await prisma.automationRule.findMany({
      where: { userId, active: true },
    });

    if (activeRules.length === 0) {
      return [];
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayCount, lastPub, recentPubs] = await Promise.all([
      prisma.publication.count({
        where: { userId, createdAt: { gte: startOfToday } },
      }),
      prisma.publication.findFirst({
        where: { userId, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.publication.findMany({
        where: { userId, offerId },
        select: { channelId: true, publishedAt: true },
      }),
    ]);

    const context: AutomationEvaluationContext = {
      userId,
      product: {
        id: offer.product.id,
        title: offer.product.title,
        platform: offer.product.platform,
        category: offer.product.category,
        currentPrice: offer.product.currentPrice,
        originalPrice: offer.product.originalPrice,
        discountPercent: offer.product.discountPercent,
        commissionRate: offer.product.commissionRate,
        commissionAmount: offer.product.commissionAmount,
        opportunityScore: offer.product.opportunityScore,
        url: offer.product.url,
      },
      opportunityScore: offer.product.opportunityScore,
      todayPublicationsCount: todayCount,
      lastPublicationAt: lastPub?.publishedAt || null,
      recentProductPublications: recentPubs
        .filter((p) => p.publishedAt !== null)
        .map((p) => ({
          channelId: p.channelId,
          publishedAt: p.publishedAt as Date,
        })),
    };

    const decisions: AutomationDecision[] = [];

    for (const rule of activeRules) {
      let channelIds: string[] = [];
      let platforms: string[] = [];
      let categories: string[] = [];
      let allowedWeekdays: number[] = [0, 1, 2, 3, 4, 5, 6];

      try {
        channelIds = JSON.parse(rule.channelIds || "[]");
        platforms = JSON.parse(rule.platforms || "[]");
        categories = JSON.parse(rule.categories || "[]");
        allowedWeekdays = JSON.parse(rule.allowedWeekdays || "[0,1,2,3,4,5,6]");
      } catch {
        // use defaults
      }

      const ruleConfig: AutomationRuleConfig = {
        id: rule.id,
        userId: rule.userId,
        name: rule.name,
        active: rule.active,
        minOpportunityScore: rule.minOpportunityScore,
        minCommission: rule.minCommission,
        minDiscount: rule.minDiscount,
        maxPrice: rule.maxPrice,
        platforms,
        categories,
        offerStyle: (rule.offerStyle as any) || "DESCONTO",
        channelIds,
        autoApprove: rule.autoApprove,
        autoSchedule: rule.autoSchedule,
        maxOffersPerDay: rule.maxOffersPerDay,
        minIntervalMinutes: rule.minIntervalMinutes,
        allowedStartTime: rule.allowedStartTime,
        allowedEndTime: rule.allowedEndTime,
        allowedWeekdays,
        duplicateCooldownHours: rule.duplicateCooldownHours,
      };

      const decision = AutomationEngine.evaluate(ruleConfig, context);
      decisions.push(decision);

      if (decision.canPublishImmediately) {
        for (const chId of decision.targetChannelIds) {
          try {
            await PublicationService.sendNow({
              userId,
              offerId,
              channelId: chId,
            });
          } catch (dispatchErr) {
            console.warn(`[Automation:AutoDispatch:Warning] Failed for rule ${rule.name} on channel ${chId}`, dispatchErr);
          }
        }
      }
    }

    return decisions;
  }
}
