import { ChannelBalancingStrategy } from "./types";

export interface ChannelInfo {
  id: string;
  userId?: string;
  name: string;
  type: string;
  active: boolean;
  status: string;
}

export class ChannelBalancer {
  /**
   * Selects target channels according to the chosen balancing strategy.
   */
  static selectChannels(
    availableChannels: ChannelInfo[],
    strategy: ChannelBalancingStrategy = "ALL",
    lastDispatchedChannelId?: string | null
  ): ChannelInfo[] {
    const activeChannels = availableChannels.filter(
      (c) => c.active && c.status !== "DISABLED" && c.status !== "ERROR"
    );

    if (activeChannels.length === 0) {
      return [];
    }

    if (strategy === "ALL") {
      return activeChannels;
    }

    if (strategy === "ROUND_ROBIN") {
      if (!lastDispatchedChannelId) {
        return [activeChannels[0]];
      }

      const currentIndex = activeChannels.findIndex(
        (c) => c.id === lastDispatchedChannelId
      );

      if (currentIndex === -1 || currentIndex >= activeChannels.length - 1) {
        return [activeChannels[0]];
      }

      return [activeChannels[currentIndex + 1]];
    }

    if (strategy === "PRIORITY") {
      // Deterministic priority ordering: TELEGRAM > WHATSAPP > DISCORD > WEBHOOK > others
      const priorityOrder = ["TELEGRAM", "WHATSAPP", "DISCORD", "WEBHOOK"];
      const sorted = [...activeChannels].sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.type.toUpperCase());
        const idxB = priorityOrder.indexOf(b.type.toUpperCase());
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });

      return [sorted[0]];
    }

    return activeChannels;
  }
}
