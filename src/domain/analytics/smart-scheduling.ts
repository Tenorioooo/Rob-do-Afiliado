import { prisma } from "@/lib/db/prisma";
import { TimeSlotPerformance } from "./analytics-types";
import { PerformanceScoreService } from "./performance-score";

export class SmartSchedulingService {
  /**
   * Analyzes historical conversion and click events by time slot.
   */
  static async analyzeTimeSlots(
    userId: string,
    minClicksPerSlot: number = 10
  ): Promise<{
    slots: TimeSlotPerformance[];
    bestSlot: TimeSlotPerformance | null;
    hasSufficientData: boolean;
    recommendationReason: string;
  }> {
    const events = await prisma.analyticsEvent.findMany({
      where: { userId },
      select: { eventType: true, createdAt: true },
    });

    const conversions = await prisma.conversion.findMany({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      select: { occurredAt: true, commissionValue: true },
    });

    // Initialize map for 24 hours
    const hourMap = new Map<number, { clicks: number; conversions: number; commission: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { clicks: 0, conversions: 0, commission: 0 });
    }

    for (const ev of events) {
      if (ev.eventType === "CLICK") {
        const hour = new Date(ev.createdAt).getHours();
        const cur = hourMap.get(hour)!;
        cur.clicks++;
      }
    }

    for (const conv of conversions) {
      const hour = new Date(conv.occurredAt).getHours();
      const cur = hourMap.get(hour)!;
      cur.conversions++;
      cur.commission += conv.commissionValue;
    }

    const slots: TimeSlotPerformance[] = [];
    let bestSlot: TimeSlotPerformance | null = null;
    let totalSample = 0;

    for (let h = 0; h < 24; h++) {
      const data = hourMap.get(h)!;
      totalSample += data.clicks;
      const hourSlotStr = `${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00`;
      const cr = PerformanceScoreService.calculateConversionRate(data.conversions, data.clicks);
      const scoreResult = PerformanceScoreService.calculateScore({
        clicks: data.clicks,
        conversions: data.conversions,
        commission: data.commission,
      });

      const slotPerf: TimeSlotPerformance = {
        dayOfWeek: 1, // aggregate weekday
        hourSlot: hourSlotStr,
        clicks: data.clicks,
        conversions: data.conversions,
        conversionRate: cr,
        commission: data.commission,
        performanceScore: scoreResult.totalScore,
        hasSufficientData: data.clicks >= minClicksPerSlot,
      };

      slots.push(slotPerf);

      if (slotPerf.hasSufficientData) {
        if (!bestSlot || slotPerf.performanceScore > bestSlot.performanceScore) {
          bestSlot = slotPerf;
        }
      }
    }

    const hasSufficientData = totalSample >= 30 && bestSlot !== null;
    const recommendationReason = hasSufficientData && bestSlot
      ? `Horário de pico ${bestSlot.hourSlot} detectado com maior taxa de conversão (${bestSlot.conversionRate.toFixed(1)}%) e score ${bestSlot.performanceScore}/100.`
      : "Dados insuficientes para sugerir horários otimizados com significância estatística. Utilizando horários padrão da regra.";

    return {
      slots,
      bestSlot,
      hasSufficientData,
      recommendationReason,
    };
  }
}
