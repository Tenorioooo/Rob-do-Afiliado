import { AutomationRuleConfig, AutomationEvaluationContext, AutomationDecision } from "./types";

export class AutomationEngine {
  /**
   * Evaluates a product opportunity against an automation rule.
   */
  static evaluate(rule: AutomationRuleConfig, context: AutomationEvaluationContext): AutomationDecision {
    const passed: string[] = [];
    const rejections: string[] = [];
    const now = context.currentDate || new Date();

    if (!rule.active) {
      return {
        ruleId: rule.id || "rule",
        ruleName: rule.name,
        isMatch: false,
        canPublishImmediately: false,
        rejectionReasons: ["Regra de automação está desativada."],
        passedConditions: [],
        targetChannelIds: [],
        offerStyle: rule.offerStyle,
        autoApprove: false,
      };
    }

    // 1. Min Opportunity Score
    if (context.opportunityScore < rule.minOpportunityScore) {
      rejections.push(`Score (${context.opportunityScore}) abaixo do mínimo exigido (${rule.minOpportunityScore}).`);
    } else {
      passed.push(`Score ${context.opportunityScore} >= ${rule.minOpportunityScore}`);
    }

    // 2. Platforms
    if (rule.platforms && rule.platforms.length > 0) {
      const matchPlat = rule.platforms.some((p) => p.toUpperCase() === context.product.platform.toUpperCase());
      if (!matchPlat) {
        rejections.push(`Plataforma ${context.product.platform} não está na lista de permitidas da regra.`);
      } else {
        passed.push(`Plataforma ${context.product.platform} compatível`);
      }
    }

    // 3. Categories
    if (rule.categories && rule.categories.length > 0) {
      const matchCat = rule.categories.some((c) => c.toLowerCase() === context.product.category.toLowerCase());
      if (!matchCat) {
        rejections.push(`Categoria "${context.product.category}" não corresponde aos filtros da regra.`);
      } else {
        passed.push(`Categoria "${context.product.category}" selecionada`);
      }
    }

    // 4. Min Commission %
    const commissionPercent = context.product.commissionRate * 100;
    if (commissionPercent < rule.minCommission) {
      rejections.push(`Comissão (${commissionPercent.toFixed(1)}%) menor que o mínimo de ${rule.minCommission}%.`);
    } else {
      passed.push(`Comissão ${commissionPercent.toFixed(1)}% >= ${rule.minCommission}%`);
    }

    // 5. Min Discount %
    if (context.product.discountPercent < rule.minDiscount) {
      rejections.push(`Desconto (${context.product.discountPercent}%) menor que o mínimo de ${rule.minDiscount}%.`);
    } else {
      passed.push(`Desconto ${context.product.discountPercent}% >= ${rule.minDiscount}%`);
    }

    // 6. Max Price
    if (rule.maxPrice !== null && rule.maxPrice !== undefined && rule.maxPrice > 0) {
      if (context.product.currentPrice > rule.maxPrice) {
        rejections.push(`Preço (R$ ${context.product.currentPrice.toFixed(2)}) excede o teto de R$ ${rule.maxPrice.toFixed(2)}.`);
      } else {
        passed.push(`Preço R$ ${context.product.currentPrice.toFixed(2)} <= R$ ${rule.maxPrice.toFixed(2)}`);
      }
    }

    // 7. Channels Selected
    if (!rule.channelIds || rule.channelIds.length === 0) {
      rejections.push("Nenhum canal de destino configurado para esta regra.");
    }

    // 8. Daily Publication Cap
    let canPublishImmediately = rejections.length === 0;
    let suggestedScheduleTime: Date | null = null;

    if (context.todayPublicationsCount >= rule.maxOffersPerDay) {
      canPublishImmediately = false;
      rejections.push(`Limite diário de ${rule.maxOffersPerDay} ofertas atingido hoje.`);
    } else {
      passed.push(`Ofertas hoje: ${context.todayPublicationsCount}/${rule.maxOffersPerDay}`);
    }

    // 9. Minimum Interval between publications
    if (context.lastPublicationAt) {
      const diffMinutes = Math.floor((now.getTime() - context.lastPublicationAt.getTime()) / (1000 * 60));
      if (diffMinutes < rule.minIntervalMinutes) {
        canPublishImmediately = false;
        const waitMinutes = rule.minIntervalMinutes - diffMinutes;
        suggestedScheduleTime = new Date(now.getTime() + waitMinutes * 60 * 1000);
        rejections.push(`Intervalo mínimo não atingido (faltam ${waitMinutes} minutos).`);
      }
    }

    // 10. Operating Hours Window (e.g. 08:00 to 22:00)
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (rule.allowedStartTime && rule.allowedEndTime) {
      if (currentHourMin < rule.allowedStartTime || currentHourMin > rule.allowedEndTime) {
        canPublishImmediately = false;
        rejections.push(`Fora do horário de funcionamento permitido (${rule.allowedStartTime} às ${rule.allowedEndTime}).`);
      } else {
        passed.push(`Dentro do horário operacional (${rule.allowedStartTime} - ${rule.allowedEndTime})`);
      }
    }

    // 11. Allowed Weekdays (0=Sun, 6=Sat)
    const currentWeekday = now.getDay();
    if (rule.allowedWeekdays && rule.allowedWeekdays.length > 0) {
      if (!rule.allowedWeekdays.includes(currentWeekday)) {
        canPublishImmediately = false;
        rejections.push(`Dia da semana (${currentWeekday}) não permitido.`);
      }
    }

    // 12. Duplicate Cooldown Check
    const cooldownMs = (rule.duplicateCooldownHours || 24) * 60 * 60 * 1000;
    const eligibleChannels = (rule.channelIds || []).filter((chId) => {
      const lastPubForChannel = context.recentProductPublications.find((p) => p.channelId === chId);
      if (lastPubForChannel) {
        const timeSince = now.getTime() - lastPubForChannel.publishedAt.getTime();
        return timeSince >= cooldownMs;
      }
      return true;
    });

    if (eligibleChannels.length === 0 && (rule.channelIds || []).length > 0) {
      canPublishImmediately = false;
      rejections.push(`Produto publicado recentemente em todos os canais configurados (cooldown de ${rule.duplicateCooldownHours}h ativo).`);
    }

    const isMatch = rejections.filter((r) => !r.includes("Intervalo") && !r.includes("horário")).length === 0;

    return {
      ruleId: rule.id || "rule",
      ruleName: rule.name,
      isMatch,
      canPublishImmediately: isMatch && canPublishImmediately,
      rejectionReasons: rejections,
      passedConditions: passed,
      targetChannelIds: eligibleChannels,
      offerStyle: rule.offerStyle || "DESCONTO",
      autoApprove: rule.autoApprove || false,
      suggestedScheduleTime,
    };
  }
}
