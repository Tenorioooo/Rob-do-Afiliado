import { prisma } from "@/lib/db/prisma";
import { AutopilotService } from "./autopilot-service";

export class AutopilotWorker {
  /**
   * Scans and triggers due autopilot cycles for all active users.
   */
  static async processDueCycles(): Promise<{
    evaluatedUsers: number;
    executedCycles: number;
    results: any[];
  }> {
    const now = new Date();

    const dueConfigs = await prisma.autopilotConfig.findMany({
      where: {
        enabled: true,
        isLocked: false,
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null },
        ],
      },
      take: 10,
    });

    const results: any[] = [];
    let executedCycles = 0;

    for (const config of dueConfigs) {
      try {
        const summary = await AutopilotService.runCycle(config.userId, {
          isManualTrigger: false,
        });
        executedCycles++;
        results.push({
          userId: config.userId,
          status: summary.status,
          opportunitiesCreated: summary.opportunitiesCreated,
          offersGenerated: summary.offersGenerated,
          publicationsPublished: summary.publicationsPublished,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro no worker de autopiloto.";
        results.push({
          userId: config.userId,
          status: "FAILED",
          error: msg,
        });
      }
    }

    return {
      evaluatedUsers: dueConfigs.length,
      executedCycles,
      results,
    };
  }
}
