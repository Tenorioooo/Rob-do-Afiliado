import { PriceSignalResult, PriceSignalType } from "./types";

export interface SnapshotData {
  currentPrice: number;
  originalPrice: number;
  observedAt: Date;
}

export class PriceSignalService {
  /**
   * Calculates deterministic price change signals based on previous product snapshots.
   */
  static calculateSignal(
    currentPrice: number,
    previousSnapshots: SnapshotData[] = []
  ): PriceSignalResult {
    if (!previousSnapshots || previousSnapshots.length === 0) {
      return {
        signal: "NO_CHANGE",
        previousPrice: null,
        priceDelta: 0,
        percentChange: 0,
        isSignificantDrop: false,
        currentPrice,
      };
    }

    // Sort snapshots descending by observedAt
    const sorted = [...previousSnapshots].sort(
      (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
    );

    const latestPrevious = sorted[0];
    const prevPrice = latestPrevious.currentPrice;

    if (prevPrice <= 0 || currentPrice === prevPrice) {
      return {
        signal: "NO_CHANGE",
        previousPrice: prevPrice,
        priceDelta: 0,
        percentChange: 0,
        isSignificantDrop: false,
        currentPrice,
      };
    }

    const priceDelta = currentPrice - prevPrice;
    const percentChange = ((currentPrice - prevPrice) / prevPrice) * 100;

    let signal: PriceSignalType = "NO_CHANGE";
    if (priceDelta < -0.01) {
      signal = "PRICE_DROP";
    } else if (priceDelta > 0.01) {
      signal = "PRICE_INCREASE";
    }

    // A price drop >= 5% is deemed significant for priority boosting and smart republishing
    const isSignificantDrop = signal === "PRICE_DROP" && Math.abs(percentChange) >= 5;

    return {
      signal,
      previousPrice: prevPrice,
      currentPrice,
      priceDelta: Number(priceDelta.toFixed(2)),
      percentChange: Number(percentChange.toFixed(2)),
      isSignificantDrop,
    };
  }
}
