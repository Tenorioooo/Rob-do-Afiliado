/**
 * Background Job & Queue Contracts
 * Prepared for Redis / BullMQ / Cron Workers integration
 */

export type JobType =
  | "SCAN_MARKETPLACES"
  | "ANALYZE_PRODUCT"
  | "GENERATE_OFFER"
  | "PUBLISH_OFFER"
  | "SYNC_ANALYTICS"
  | "CLEANUP_EXPIRED_LINKS";

export interface QueueJob<T = Record<string, unknown>> {
  id: string;
  type: JobType;
  userId: string;
  data: T;
  priority?: "HIGH" | "NORMAL" | "LOW";
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  processAfter?: Date;
}

export interface JobDispatcher {
  dispatch<T>(type: JobType, userId: string, data: T, delayMs?: number): Promise<string>;
  getJobStatus(jobId: string): Promise<"WAITING" | "ACTIVE" | "COMPLETED" | "FAILED">;
  cancelJob(jobId: string): Promise<boolean>;
}
