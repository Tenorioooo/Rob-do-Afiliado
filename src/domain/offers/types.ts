/**
 * Offer Domain Types & Anti-Fabrication Rules
 */

export type OfferStyle =
  | "DIRETO"
  | "DESCONTO"
  | "URGENCIA"
  | "PREMIUM"
  | "CURTO";

export type OfferStatus =
  | "DRAFT"
  | "READY"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";

export type OfferQueuePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type ValidationStatus = "VALID" | "WARNING" | "REJECTED";

export type ChannelPreviewType = "TELEGRAM" | "WHATSAPP" | "DISCORD" | "GENERIC";

export type OfferTone =
  | "ENTHUSIASTIC"
  | "PROFESSIONAL"
  | "CASUAL"
  | "BENEFIT";

export interface OfferStructuredInput {
  productId: string;
  opportunityId?: string;
  affiliateLinkId?: string;
  title: string;
  description?: string;
  category: string;
  brand?: string;
  platform: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  commissionAmount: number;
  commissionRate: number;
  rating?: number;
  reviewCount?: number;
  salesCount: number;
  opportunityScore: number;
  tags?: string[];
  reasons?: string[];
  affiliateUrl: string;
  inStock?: boolean;
  tone?: OfferTone;
  targetChannel?: ChannelPreviewType;
  customInstructions?: string;
}

export interface GeneratedOfferVariant {
  style: OfferStyle;
  title: string;
  body: string;
  cta: string;
  formattedText: string;
  validationStatus: ValidationStatus;
  validationMessage?: string;
  claimsVerified: string[];
  claimsRejected: string[];
  aiSource: "mock" | "openai" | "gemini" | "anthropic";
}

export interface ValidationRuleViolation {
  claim: string;
  reason: string;
  severity: "ERROR" | "WARNING";
}

export interface OfferValidationResult {
  isValid: boolean;
  status: ValidationStatus;
  violations: ValidationRuleViolation[];
  verifiedClaims: string[];
  sanitizedBody?: string;
  summaryMessage: string;
}
