export interface AutomationRuleConfig {
  id?: string;
  userId: string;
  name: string;
  active: boolean;
  minOpportunityScore: number;
  platforms: string[];
  categories: string[];
  minCommission: number;
  minDiscount: number;
  maxPrice?: number | null;
  maxOffersPerDay: number;
  minIntervalMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  allowedWeekdays: number[];
  channelIds: string[];
  offerStyle: string;
  duplicateCooldownHours: number;
  autoApprove: boolean;
  autoSchedule: boolean;
}

export interface AutomationEvaluationContext {
  userId: string;
  product: {
    id: string;
    title: string;
    platform: string;
    category: string;
    currentPrice: number;
    originalPrice: number;
    discountPercent: number;
    commissionRate: number;
    commissionAmount: number;
    opportunityScore: number;
    url?: string;
  };
  opportunityScore: number;
  todayPublicationsCount: number;
  lastPublicationAt?: Date | null;
  recentProductPublications: Array<{
    channelId: string;
    publishedAt: Date;
  }>;
  currentDate?: Date;
}

export interface AutomationDecision {
  ruleId: string;
  ruleName: string;
  isMatch: boolean;
  canPublishImmediately: boolean;
  rejectionReasons: string[];
  passedConditions: string[];
  targetChannelIds: string[];
  offerStyle: string;
  autoApprove: boolean;
  suggestedScheduleTime?: Date | null;
}
