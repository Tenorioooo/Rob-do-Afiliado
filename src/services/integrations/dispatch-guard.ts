import { prisma } from "@/lib/db/prisma";
import { AuditedProviderId } from "@/domain/integrations/provider-capability-audit";

export interface GlobalDispatchConfig {
  realDispatchEnabled: boolean;
  providerSwitches: Record<string, boolean>;
  emergencyStopTriggeredAt: string | null;
  emergencyStopReason: string | null;
}

// In-memory runtime state with fallback to environment variables
class RuntimeDispatchState {
  private static globalRealDispatchEnabled: boolean =
    process.env.REAL_DISPATCH_ENABLED === "true";

  private static providerSwitches: Record<string, boolean> = {
    TELEGRAM: process.env.TELEGRAM_ENABLED === "true",
    DISCORD: process.env.DISCORD_ENABLED === "true",
    WHATSAPP: process.env.WHATSAPP_ENABLED === "true",
    MERCADO_LIVRE: process.env.MERCADOLIVRE_ENABLED === "true",
    SHOPEE: process.env.SHOPEE_ENABLED === "true",
    AMAZON: process.env.AMAZON_ENABLED === "true",
  };

  private static emergencyStopTriggeredAt: string | null = null;
  private static emergencyStopReason: string | null = null;

  static isGlobalRealDispatchEnabled(): boolean {
    return this.globalRealDispatchEnabled;
  }

  static setGlobalRealDispatchEnabled(enabled: boolean): void {
    this.globalRealDispatchEnabled = enabled;
  }

  static isProviderEnabled(provider: string): boolean {
    const key = provider.toUpperCase();
    if (this.providerSwitches[key] !== undefined) {
      return this.providerSwitches[key];
    }
    return false;
  }

  static setProviderEnabled(provider: string, enabled: boolean): void {
    const key = provider.toUpperCase();
    this.providerSwitches[key] = enabled;
  }

  static triggerEmergencyStop(reason: string): void {
    this.globalRealDispatchEnabled = false;
    for (const key of Object.keys(this.providerSwitches)) {
      this.providerSwitches[key] = false;
    }
    this.emergencyStopTriggeredAt = new Date().toISOString();
    this.emergencyStopReason = reason;
  }

  static getStatus(): GlobalDispatchConfig {
    return {
      realDispatchEnabled: this.globalRealDispatchEnabled,
      providerSwitches: { ...this.providerSwitches },
      emergencyStopTriggeredAt: this.emergencyStopTriggeredAt,
      emergencyStopReason: this.emergencyStopReason,
    };
  }

  static resetToDefault(): void {
    this.globalRealDispatchEnabled = process.env.REAL_DISPATCH_ENABLED === "true";
    this.providerSwitches = {
      TELEGRAM: process.env.TELEGRAM_ENABLED === "true",
      DISCORD: process.env.DISCORD_ENABLED === "true",
      WHATSAPP: process.env.WHATSAPP_ENABLED === "true",
      MERCADO_LIVRE: process.env.MERCADOLIVRE_ENABLED === "true",
      SHOPEE: process.env.SHOPEE_ENABLED === "true",
      AMAZON: process.env.AMAZON_ENABLED === "true",
    };
    this.emergencyStopTriggeredAt = null;
    this.emergencyStopReason = null;
  }
}

export class DispatchGuardService {
  /**
   * Checks if real global dispatch is active.
   */
  static isGlobalRealDispatchEnabled(): boolean {
    return RuntimeDispatchState.isGlobalRealDispatchEnabled();
  }

  /**
   * Enables or disables global real dispatch.
   */
  static setGlobalRealDispatchEnabled(enabled: boolean, userId?: string): void {
    RuntimeDispatchState.setGlobalRealDispatchEnabled(enabled);
  }

  /**
   * Checks if a specific provider's kill switch is active.
   */
  static isProviderRealDispatchEnabled(provider: string): boolean {
    return RuntimeDispatchState.isProviderEnabled(provider);
  }

  /**
   * Toggles a specific provider kill switch.
   */
  static setProviderRealDispatchEnabled(provider: string, enabled: boolean): void {
    RuntimeDispatchState.setProviderEnabled(provider, enabled);
  }

  /**
   * Returns current global dispatch status.
   */
  static getDispatchConfig(): GlobalDispatchConfig {
    return RuntimeDispatchState.getStatus();
  }

  /**
   * Resets runtime state to default environment values (useful for tests).
   */
  static resetRuntimeState(): void {
    RuntimeDispatchState.resetToDefault();
  }

  /**
   * Triggers an Emergency Stop across the entire system.
   * Immediately disables all live dispatches, cancels queued live publications, and records audit logs.
   */
  static async triggerEmergencyStop(params: {
    userId: string;
    reason: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; canceledJobsCount: number; message: string }> {
    RuntimeDispatchState.triggerEmergencyStop(params.reason);

    // Cancel any SCHEDULED or PROCESSING live publications in database
    const canceledResult = await prisma.publication.updateMany({
      where: {
        status: { in: ["SCHEDULED", "PROCESSING"] },
        source: "real",
      },
      data: {
        status: "FAILED",
        errorCode: "EMERGENCY_STOP",
        errorMessage: `Disparo abortado por Parada de Emergência: ${params.reason}`,
        failedAt: new Date(),
      },
    });

    // Record high-priority audit log
    await prisma.integrationAuditLog.create({
      data: {
        userId: params.userId,
        provider: "SYSTEM",
        action: "EMERGENCY_STOP",
        ipAddress: params.ipAddress || "127.0.0.1",
        details: JSON.stringify({
          reason: params.reason,
          canceledJobsCount: canceledResult.count,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Also record a system notification for the user
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: "🚨 Parada de Emergência Acionada",
        message: `Todos os envios reais foram bloqueados. Motivo: ${params.reason}`,
        type: "SECURITY",
        read: false,
      },
    });

    return {
      success: true,
      canceledJobsCount: canceledResult.count,
      message: `Parada de Emergência executada com sucesso. ${canceledResult.count} publicações reais pendentes foram canceladas.`,
    };
  }

  /**
   * Validates whether a live publication dispatch is permitted to a specific channel.
   */
  static async canDispatchLive(params: {
    userId: string;
    channelId: string;
    provider?: string;
    isAutopilotTrigger?: boolean;
  }): Promise<{ allowed: boolean; blockingReason?: string; errorCode?: string }> {
    // 0. Emergency Stop Check
    const config = RuntimeDispatchState.getStatus();
    if (config.emergencyStopTriggeredAt) {
      return {
        allowed: false,
        blockingReason: `Publicação bloqueada por Parada de Emergência: ${config.emergencyStopReason || "Acionada pelo usuário"}`,
        errorCode: "EMERGENCY_STOP",
      };
    }

    // 1. Check Global Kill Switch
    if (!RuntimeDispatchState.isGlobalRealDispatchEnabled()) {
      return {
        allowed: false,
        blockingReason: "Envio real global está desativado (REAL_DISPATCH_ENABLED = false).",
        errorCode: "REAL_DISPATCH_DISABLED",
      };
    }

    // 2. Fetch Channel
    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
    });

    if (!channel) {
      return {
        allowed: false,
        blockingReason: "Canal de destino não encontrado.",
        errorCode: "CHANNEL_NOT_FOUND",
      };
    }

    if (!channel.active || channel.status === "DISABLED") {
      return {
        allowed: false,
        blockingReason: `Canal ${channel.name} está desativado.`,
        errorCode: "CHANNEL_UNAVAILABLE",
      };
    }

    const providerName = (params.provider || channel.type || "").toUpperCase();

    // 2.5 Phase 8 Restriction: ONLY Telegram is allowed for Real Dispatch in Phase 8
    if (providerName !== "TELEGRAM") {
      return {
        allowed: false,
        blockingReason: `O canal ${providerName} não está habilitado para envios reais na Fase 8. Apenas o Telegram está homologado.`,
        errorCode: `${providerName}_DISABLED`,
      };
    }

    // 3. Check Provider Kill Switch
    if (!RuntimeDispatchState.isProviderEnabled(providerName)) {
      return {
        allowed: false,
        blockingReason: `O provedor ${providerName} está desativado individualmente pelo switch de segurança (TELEGRAM_ENABLED = false).`,
        errorCode: `${providerName}_DISABLED`,
      };
    }

    // 4. Check Connection in IntegrationConnection table
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId: params.userId,
          provider: providerName,
        },
      },
    });

    if (!connection) {
      return {
        allowed: false,
        blockingReason: `Nenhuma conexão oficial encontrada para ${providerName}.`,
        errorCode: "INTEGRATION_NOT_FOUND",
      };
    }

    if (connection.status !== "VERIFIED_REAL" && connection.status !== "CONNECTED") {
      return {
        allowed: false,
        blockingReason: `A conexão com ${providerName} não está no estado VERIFIED_REAL (Status atual: ${connection.status}).`,
        errorCode: "INTEGRATION_NOT_VERIFIED",
      };
    }

    // 5. Check if Autopilot permission is granted in connection metadata
    let metadata: Record<string, any> = {};
    try {
      if (connection.metadata) {
        metadata = JSON.parse(connection.metadata);
      }
    } catch {
      // ignore
    }

    if (metadata.enabledForAutopilot === false) {
      return {
        allowed: false,
        blockingReason: `A conexão com ${providerName} está com a permissão do Autopiloto desmarcada nas configurações.`,
        errorCode: "AUTOPILOT_NOT_PERMITTED",
      };
    }

    return { allowed: true };
  }
}
