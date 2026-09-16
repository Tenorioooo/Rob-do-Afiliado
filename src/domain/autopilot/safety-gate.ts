export interface SafetyGateEvaluationContext {
  userId: string;
  offer: {
    id: string;
    userId: string;
    status: string;
    validationStatus: string;
    affiliateLinkId?: string | null;
    productId: string;
  };
  affiliateLink?: {
    id: string;
    userId: string;
    active: boolean;
    affiliateUrl: string;
  } | null;
  channel?: {
    id: string;
    userId?: string;
    active: boolean;
    status: string;
    provider?: string;
    type?: string;
    destination?: string | null;
    identifier?: string | null;
    isVerifiedReal?: boolean;
  } | null;
  isGlobalRealDispatchEnabled?: boolean;
  isProviderEnabled?: boolean;
  emergencyStop?: boolean;
  isRealMode?: boolean;
  todayPublicationsCount: number;
  maxOffersPerDay: number;
  lastPublicationAt?: Date | null;
  minIntervalMinutes: number;
  allowedStartTime?: string; // e.g. "08:00"
  allowedEndTime?: string;   // e.g. "22:00"
  allowedWeekdays?: number[]; // [0,1,2,3,4,5,6]
  lastPublicationForChannelAndProduct?: Date | null;
  duplicateCooldownHours: number;
  currentTime?: Date;
}

export interface SafetyGateResult {
  passed: boolean;
  canPublishImmediately: boolean;
  suggestedScheduleTime: Date | null;
  passedChecks: string[];
  blockingReasons: string[];
  errorCode?: string;
}

export class AutopilotSafetyGate {
  /**
   * Deterministically validates all safety conditions before an offer can be queued or published.
   */
  static evaluate(context: SafetyGateEvaluationContext): SafetyGateResult {
    const passedChecks: string[] = [];
    const blockingReasons: string[] = [];
    let errorCode: string | undefined;
    const now = context.currentTime || new Date();
    let suggestedScheduleTime: Date | null = null;

    // 0. Emergency Stop
    if (context.emergencyStop === true) {
      blockingReasons.push("Publicação bloqueada: Parada de Emergência ativa no sistema.");
      errorCode = errorCode || "EMERGENCY_STOP";
    }

    // 1. Offer Ownership & Approval Status
    if (context.offer.userId !== context.userId) {
      blockingReasons.push("Oferta não pertence ao usuário autenticado.");
      errorCode = errorCode || "INVALID_OFFER";
    }

    if (context.offer.status !== "APPROVED" && context.offer.status !== "READY") {
      blockingReasons.push(`Status da oferta (${context.offer.status}) não está pronto para publicação.`);
      errorCode = errorCode || "INVALID_OFFER";
    } else {
      passedChecks.push("Status da oferta aprovado/pronto");
    }

    // 2. Anti-Fabrication Validation
    if (context.offer.validationStatus === "REJECTED") {
      blockingReasons.push("Oferta rejeitada pelo validador anti-fabricação.");
      errorCode = errorCode || "INVALID_OFFER";
    } else {
      passedChecks.push(`Validação anti-fabricação: ${context.offer.validationStatus}`);
    }

    // 3. Affiliate Link Integrity
    if (!context.affiliateLink) {
      blockingReasons.push("Link de afiliado não fornecido ou inexistente.");
      errorCode = errorCode || "MISSING_AFFILIATE_LINK";
    } else if (context.affiliateLink.userId !== context.userId) {
      blockingReasons.push("Link de afiliado pertence a outro usuário.");
      errorCode = errorCode || "MISSING_AFFILIATE_LINK";
    } else if (!context.affiliateLink.active || !context.affiliateLink.affiliateUrl) {
      blockingReasons.push("Link de afiliado inativo ou com URL inválida.");
      errorCode = errorCode || "MISSING_AFFILIATE_LINK";
    } else {
      passedChecks.push("Link de afiliado válido e ativo");
    }

    // 4. Channel Health, Ownership & Real Dispatch Gating
    if (!context.channel) {
      blockingReasons.push("Nenhum canal de destino fornecido.");
      errorCode = errorCode || "DESTINATION_NOT_CONFIGURED";
    } else if (context.channel.userId && context.channel.userId !== context.userId) {
      blockingReasons.push("Canal de destino pertence a outro usuário.");
      errorCode = errorCode || "CHANNEL_NOT_FOUND";
    } else if (!context.channel.active || context.channel.status === "DISABLED" || context.channel.status === "ERROR") {
      blockingReasons.push(`Canal de destino indisponível (Status: ${context.channel.status}).`);
      errorCode = errorCode || "CHANNEL_UNAVAILABLE";
    } else {
      // If channel is configured for real dispatch (not mock), check verification & kill switches
      const isReal = context.isRealMode || (context.channel.provider && context.channel.provider !== "mock");
      if (isReal) {
        if (context.isGlobalRealDispatchEnabled === false) {
          blockingReasons.push("Publicação real bloqueada: envio real global está desativado (REAL_DISPATCH_ENABLED = false).");
          errorCode = errorCode || "REAL_DISPATCH_DISABLED";
        } else if (context.isProviderEnabled === false) {
          const prov = context.channel.type || context.channel.provider || "TELEGRAM";
          blockingReasons.push(`Publicação real bloqueada: switch do provedor ${prov} está desativado.`);
          errorCode = errorCode || `${prov}_DISABLED`;
        } else if (context.channel.isVerifiedReal === false) {
          blockingReasons.push("Publicação real bloqueada: conexão do canal não está homologada como VERIFIED_REAL.");
          errorCode = errorCode || "INTEGRATION_NOT_VERIFIED";
        } else {
          // Check destination
          const dest = context.channel.destination || context.channel.identifier;
          if (!dest || dest.trim() === "") {
            blockingReasons.push("Publicação real bloqueada: destino/chatId não configurado.");
            errorCode = errorCode || "DESTINATION_NOT_CONFIGURED";
          } else {
            passedChecks.push("Canal operacional, ativo e homologado como VERIFIED_REAL");
          }
        }
      } else {
        passedChecks.push("Canal operacional e ativo");
      }
    }

    // 5. Daily Publication Limit
    if (context.todayPublicationsCount >= context.maxOffersPerDay) {
      blockingReasons.push(`Limite diário de ${context.maxOffersPerDay} publicações já foi atingido hoje.`);
      errorCode = errorCode || "DAILY_LIMIT";
    } else {
      passedChecks.push(`Limite diário: ${context.todayPublicationsCount}/${context.maxOffersPerDay}`);
    }

    // 6. Minimum Interval Pacing
    if (context.lastPublicationAt) {
      const diffMinutes = Math.floor((now.getTime() - context.lastPublicationAt.getTime()) / (1000 * 60));
      if (diffMinutes < context.minIntervalMinutes) {
        const waitMinutes = context.minIntervalMinutes - diffMinutes;
        suggestedScheduleTime = new Date(now.getTime() + waitMinutes * 60 * 1000);
        blockingReasons.push(`Intervalo mínimo entre publicações não atingido (faltam ${waitMinutes} minutos).`);
        errorCode = errorCode || "RATE_LIMIT";
      } else {
        passedChecks.push(`Intervalo respeitado (${diffMinutes}m >= ${context.minIntervalMinutes}m)`);
      }
    }

    // 7. Operating Hours Window (e.g. 08:00 to 22:00)
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const startTime = context.allowedStartTime || "08:00";
    const endTime = context.allowedEndTime || "22:00";

    if (currentHourMin < startTime || currentHourMin > endTime) {
      blockingReasons.push(`Fora do horário operacional permitido (${startTime} às ${endTime}).`);
      errorCode = errorCode || "OUTSIDE_SCHEDULE_WINDOW";
    } else {
      passedChecks.push(`Horário operacional permitido (${startTime} - ${endTime})`);
    }

    // 8. Allowed Weekdays
    const currentWeekday = now.getDay();
    if (context.allowedWeekdays && context.allowedWeekdays.length > 0) {
      if (!context.allowedWeekdays.includes(currentWeekday)) {
        blockingReasons.push(`Dia da semana atual (${currentWeekday}) não permitido.`);
        errorCode = errorCode || "WEEKDAY_NOT_ALLOWED";
      }
    }

    // 9. Product Channel Duplicate Cooldown
    if (context.lastPublicationForChannelAndProduct) {
      const cooldownMs = (context.duplicateCooldownHours || 24) * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - context.lastPublicationForChannelAndProduct.getTime();
      if (elapsedMs < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - elapsedMs) / (1000 * 60 * 60));
        blockingReasons.push(`Produto publicado recentemente neste canal (cooldown de ${remainingHours}h restantes).`);
        errorCode = errorCode || "DUPLICATE_PUBLICATION";
      } else {
        passedChecks.push("Cooldown de produto respeitado");
      }
    }

    const passed = blockingReasons.length === 0;
    const canPublishImmediately = passed;

    return {
      passed,
      canPublishImmediately,
      suggestedScheduleTime,
      passedChecks,
      blockingReasons,
      errorCode: passed ? undefined : errorCode,
    };
  }
}
