-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT NOT NULL,
    "limits" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "credentials" TEXT,
    "config" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "destination" TEXT,
    "config" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "testResult" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "brand" TEXT,
    "imageUrl" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "trendScore" INTEGER,
    "opportunityScore" INTEGER NOT NULL DEFAULT 80,
    "url" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "dataSource" TEXT NOT NULL DEFAULT 'mock',
    "sourceMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_snapshots" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "product_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUALIFIED',
    "confidence" TEXT NOT NULL DEFAULT 'ALTA',
    "dataCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robot_scans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "platforms" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 80,
    "minCommission" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "maxResults" INTEGER NOT NULL DEFAULT 50,
    "totalDiscovered" INTEGER NOT NULL DEFAULT 0,
    "totalAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "totalQualified" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "robot_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robot_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "scanIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "minOpportunityScore" INTEGER NOT NULL DEFAULT 80,
    "minDiscount" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "minCommission" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "targetCategories" TEXT NOT NULL DEFAULT '["Eletrônicos", "Casa e Cozinha", "Moda", "Beleza"]',
    "targetPlatforms" TEXT NOT NULL DEFAULT '["SHOPEE", "MERCADO_LIVRE", "AMAZON"]',
    "autoGenerateOffers" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "workingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '22:00',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "robot_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scanId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "robot_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "opportunityId" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'SHOPEE',
    "externalProductId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "source" TEXT NOT NULL DEFAULT 'mock',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "estimatedEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "affiliateLinkId" TEXT,
    "channelId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "headline" TEXT,
    "generatedCopy" TEXT,
    "callToAction" TEXT,
    "style" TEXT NOT NULL DEFAULT 'DIRETO',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "aiSource" TEXT NOT NULL DEFAULT 'mock',
    "validationStatus" TEXT NOT NULL DEFAULT 'VALID',
    "validationMessage" TEXT,
    "reasons" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_queue_items" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "queueItemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "source" TEXT NOT NULL DEFAULT 'mock',
    "providerMessageId" TEXT,
    "payload" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minOpportunityScore" INTEGER NOT NULL DEFAULT 80,
    "platforms" TEXT NOT NULL DEFAULT '["SHOPEE", "MERCADO_LIVRE", "AMAZON"]',
    "categories" TEXT NOT NULL DEFAULT '[]',
    "minCommission" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "minDiscount" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "maxPrice" DOUBLE PRECISION,
    "maxOffersPerDay" INTEGER NOT NULL DEFAULT 20,
    "minIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "allowedStartTime" TEXT NOT NULL DEFAULT '08:00',
    "allowedEndTime" TEXT NOT NULL DEFAULT '22:00',
    "allowedWeekdays" TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
    "channelIds" TEXT NOT NULL DEFAULT '[]',
    "offerStyle" TEXT NOT NULL DEFAULT 'DESCONTO',
    "duplicateCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "autoSchedule" BOOLEAN NOT NULL DEFAULT false,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "topPlatform" TEXT,
    "topCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "automationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "scanIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "minOpportunityScore" INTEGER NOT NULL DEFAULT 80,
    "minCommission" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "minDiscount" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "maxPrice" DOUBLE PRECISION DEFAULT 500.0,
    "maxOffersPerDay" INTEGER NOT NULL DEFAULT 20,
    "maxOpportunitiesPerCycle" INTEGER NOT NULL DEFAULT 10,
    "maxProductsPerCycle" INTEGER NOT NULL DEFAULT 50,
    "minPublicationInterval" INTEGER NOT NULL DEFAULT 15,
    "autoGenerateOffers" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveOffers" BOOLEAN NOT NULL DEFAULT false,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "duplicateCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "preferredPlatforms" TEXT NOT NULL DEFAULT '["SHOPEE", "MERCADO_LIVRE", "AMAZON"]',
    "preferredCategories" TEXT NOT NULL DEFAULT '["Eletrônicos", "Casa e Cozinha", "Moda", "Beleza"]',
    "preferredOfferStyles" TEXT NOT NULL DEFAULT '["DESCONTO", "URGENCIA", "DIRETO"]',
    "channelBalancingStrategy" TEXT NOT NULL DEFAULT 'ALL',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopilot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "productsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "productsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesCreated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesQualified" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesRejected" INTEGER NOT NULL DEFAULT 0,
    "offersGenerated" INTEGER NOT NULL DEFAULT 0,
    "offersApproved" INTEGER NOT NULL DEFAULT 0,
    "publicationsQueued" INTEGER NOT NULL DEFAULT 0,
    "publicationsPublished" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "decisions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopilot_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "affiliateLinkId" TEXT,
    "offerId" TEXT,
    "opportunityId" TEXT,
    "publicationId" TEXT,
    "channelId" TEXT,
    "productId" TEXT,
    "platform" TEXT,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateLinkId" TEXT,
    "offerId" TEXT,
    "opportunityId" TEXT,
    "publicationId" TEXT,
    "channelId" TEXT,
    "platform" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "orderValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'mock',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ESTIMATED',
    "platform" TEXT NOT NULL,
    "payoutDate" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'mock',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetMetric" TEXT NOT NULL DEFAULT 'CTR',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "cooldownHours" INTEGER NOT NULL DEFAULT 6,
    "maxExposure" INTEGER NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "winningStyle" TEXT,
    "analysisReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_variants" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "offerId" TEXT,
    "trafficWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'WEAK',
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "metadata" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "authType" TEXT NOT NULL,
    "encryptedCredentials" TEXT,
    "externalAccountId" TEXT,
    "externalAccountName" TEXT,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT,
    "lastValidatedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastWebhookAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "normalizedPayload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestId" TEXT,
    "externalReference" TEXT,
    "responseSummary" TEXT,
    "errorCode" TEXT,
    "performedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "source" TEXT NOT NULL DEFAULT 'REAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_userId_platform_key" ON "integrations"("userId", "platform");

-- CreateIndex
CREATE INDEX "channels_userId_status_idx" ON "channels"("userId", "status");

-- CreateIndex
CREATE INDEX "channels_userId_type_idx" ON "channels"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "products_platform_externalId_key" ON "products"("platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_userId_productId_key" ON "opportunities"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "robot_configs_userId_key" ON "robot_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_shortCode_key" ON "affiliate_links"("shortCode");

-- CreateIndex
CREATE INDEX "affiliate_links_userId_platform_idx" ON "affiliate_links"("userId", "platform");

-- CreateIndex
CREATE INDEX "affiliate_links_userId_productId_idx" ON "affiliate_links"("userId", "productId");

-- CreateIndex
CREATE INDEX "offers_userId_status_idx" ON "offers"("userId", "status");

-- CreateIndex
CREATE INDEX "offers_userId_opportunityId_idx" ON "offers"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "offer_queue_items_userId_status_idx" ON "offer_queue_items"("userId", "status");

-- CreateIndex
CREATE INDEX "offer_queue_items_status_priority_createdAt_idx" ON "offer_queue_items"("status", "priority", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "publications_idempotencyKey_key" ON "publications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "publications_userId_status_idx" ON "publications"("userId", "status");

-- CreateIndex
CREATE INDEX "publications_channelId_status_idx" ON "publications"("channelId", "status");

-- CreateIndex
CREATE INDEX "publications_offerId_idx" ON "publications"("offerId");

-- CreateIndex
CREATE INDEX "automation_rules_userId_active_idx" ON "automation_rules"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_metrics_userId_date_key" ON "analytics_metrics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_configs_userId_key" ON "autopilot_configs"("userId");

-- CreateIndex
CREATE INDEX "autopilot_runs_userId_status_idx" ON "autopilot_runs"("userId", "status");

-- CreateIndex
CREATE INDEX "autopilot_runs_userId_createdAt_idx" ON "autopilot_runs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_eventType_idx" ON "analytics_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "analytics_events_userId_createdAt_idx" ON "analytics_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_affiliateLinkId_idx" ON "analytics_events"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "analytics_events_offerId_idx" ON "analytics_events"("offerId");

-- CreateIndex
CREATE INDEX "analytics_events_publicationId_idx" ON "analytics_events"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversions_userId_platform_externalOrderId_key" ON "conversions"("userId", "platform", "externalOrderId");

-- CreateIndex
CREATE INDEX "conversions_userId_status_idx" ON "conversions"("userId", "status");

-- CreateIndex
CREATE INDEX "conversions_userId_occurredAt_idx" ON "conversions"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "conversions_affiliateLinkId_idx" ON "conversions"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "conversions_offerId_idx" ON "conversions"("offerId");

-- CreateIndex
CREATE INDEX "commissions_userId_status_idx" ON "commissions"("userId", "status");

-- CreateIndex
CREATE INDEX "commissions_conversionId_idx" ON "commissions"("conversionId");

-- CreateIndex
CREATE INDEX "experiments_userId_status_idx" ON "experiments"("userId", "status");

-- CreateIndex
CREATE INDEX "experiment_variants_experimentId_idx" ON "experiment_variants"("experimentId");

-- CreateIndex
CREATE INDEX "learning_signals_userId_signalType_idx" ON "learning_signals"("userId", "signalType");

-- CreateIndex
CREATE INDEX "learning_signals_userId_active_idx" ON "learning_signals"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "integration_connections_userId_provider_key" ON "integration_connections"("userId", "provider");

-- CreateIndex
CREATE INDEX "integration_connections_userId_status_idx" ON "integration_connections"("userId", "status");

-- CreateIndex
CREATE INDEX "integration_connections_userId_type_idx" ON "integration_connections"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "integration_events_provider_externalEventId_key" ON "integration_events"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "integration_events_userId_status_idx" ON "integration_events"("userId", "status");

-- CreateIndex
CREATE INDEX "integration_events_connectionId_eventType_idx" ON "integration_events"("connectionId", "eventType");

-- CreateIndex
CREATE INDEX "integration_events_receivedAt_idx" ON "integration_events"("receivedAt");

-- CreateIndex
CREATE INDEX "integration_audit_logs_userId_action_idx" ON "integration_audit_logs"("userId", "action");

-- CreateIndex
CREATE INDEX "integration_audit_logs_connectionId_idx" ON "integration_audit_logs"("connectionId");

-- CreateIndex
CREATE INDEX "integration_audit_logs_createdAt_idx" ON "integration_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "integration_verifications_userId_connectionId_idx" ON "integration_verifications"("userId", "connectionId");

-- CreateIndex
CREATE INDEX "integration_verifications_provider_step_idx" ON "integration_verifications"("provider", "step");

-- CreateIndex
CREATE INDEX "integration_verifications_status_idx" ON "integration_verifications"("status");

-- CreateIndex
CREATE INDEX "integration_verifications_createdAt_idx" ON "integration_verifications"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_snapshots" ADD CONSTRAINT "product_snapshots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_scans" ADD CONSTRAINT "robot_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_configs" ADD CONSTRAINT "robot_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_events" ADD CONSTRAINT "robot_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "robot_events" ADD CONSTRAINT "robot_events_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "robot_scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_queue_items" ADD CONSTRAINT "offer_queue_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_queue_items" ADD CONSTRAINT "offer_queue_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "offer_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_configs" ADD CONSTRAINT "autopilot_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_runs" ADD CONSTRAINT "autopilot_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_signals" ADD CONSTRAINT "learning_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "integration_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "integration_audit_logs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_verifications" ADD CONSTRAINT "integration_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_verifications" ADD CONSTRAINT "integration_verifications_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
