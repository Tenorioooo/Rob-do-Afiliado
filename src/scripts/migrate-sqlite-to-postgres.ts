/**
 * SQLite to PostgreSQL Migration Utility for Affiliate AI
 * 
 * Usage:
 *   1. Export from SQLite to JSON:
 *      npx tsx src/scripts/migrate-sqlite-to-postgres.ts export ./prisma/sqlite_dump.json
 * 
 *   2. Import from JSON to PostgreSQL:
 *      DATABASE_URL="postgresql://user:pass@host:5432/db" npx tsx src/scripts/migrate-sqlite-to-postgres.ts import ./prisma/sqlite_dump.json
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exportData(outputPath: string) {
  console.log("Iniciando exportação segura do SQLite dev.db...");

  const data: Record<string, any[]> = {};

  // Export in dependency order
  data.users = await prisma.user.findMany();
  data.plans = await prisma.plan.findMany();
  data.subscriptions = await prisma.subscription.findMany();
  data.sessions = await prisma.session.findMany();
  data.products = await prisma.product.findMany();
  data.productSnapshots = await prisma.productSnapshot.findMany();
  data.channels = await prisma.channel.findMany();
  data.opportunities = await prisma.opportunity.findMany();
  data.affiliateLinks = await prisma.affiliateLink.findMany();
  data.offers = await prisma.offer.findMany();
  data.offerQueueItems = await prisma.offerQueueItem.findMany();
  data.publications = await prisma.publication.findMany();
  data.robotScans = await prisma.robotScan.findMany();
  data.robotConfigs = await prisma.robotConfig.findMany();
  data.robotEvents = await prisma.robotEvent.findMany();
  data.automationRules = await prisma.automationRule.findMany();
  data.analyticsMetrics = await prisma.analyticsMetric.findMany();
  data.notifications = await prisma.notification.findMany();
  data.auditLogs = await prisma.auditLog.findMany();
  data.autopilotConfigs = await prisma.autopilotConfig.findMany();
  data.autopilotRuns = await prisma.autopilotRun.findMany();
  data.analyticsEvents = await prisma.analyticsEvent.findMany();
  data.conversions = await prisma.conversion.findMany();
  data.commissions = await prisma.commission.findMany();
  data.experiments = await prisma.experiment.findMany();
  data.experimentVariants = await prisma.experimentVariant.findMany();
  data.learningSignals = await prisma.learningSignal.findMany();
  data.integrationConnections = await prisma.integrationConnection.findMany();
  data.integrationEvents = await prisma.integrationEvent.findMany();
  data.integrationAuditLogs = await prisma.integrationAuditLog.findMany();
  data.integrationVerifications = await prisma.integrationVerification.findMany();

  const totalRecords = Object.values(data).reduce((acc, curr) => acc + curr.length, 0);

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Exportação concluída com sucesso! Total de ${totalRecords} registros gravados em ${outputPath}`);
}

async function importData(inputPath: string) {
  console.log(`Iniciando importação para o banco de dados de destino a partir de ${inputPath}...`);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Arquivo de dump não encontrado: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const data: Record<string, any[]> = JSON.parse(raw);

  // Import in topological dependency order using upsert / createMany
  console.log(`Importando ${data.users?.length || 0} usuários...`);
  for (const item of data.users || []) {
    await prisma.user.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.plans?.length || 0} planos...`);
  for (const item of data.plans || []) {
    await prisma.plan.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.products?.length || 0} produtos...`);
  for (const item of data.products || []) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.channels?.length || 0} canais...`);
  for (const item of data.channels || []) {
    await prisma.channel.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.productSnapshots?.length || 0} snapshots de produtos...`);
  for (const item of data.productSnapshots || []) {
    await prisma.productSnapshot.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, observedAt: new Date(item.observedAt) },
    });
  }

  console.log(`Importando ${data.opportunities?.length || 0} oportunidades...`);
  for (const item of data.opportunities || []) {
    await prisma.opportunity.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, detectedAt: new Date(item.detectedAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.affiliateLinks?.length || 0} links de afiliados...`);
  for (const item of data.affiliateLinks || []) {
    await prisma.affiliateLink.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, generatedAt: new Date(item.generatedAt), updatedAt: new Date(item.updatedAt) },
    });
  }

  console.log(`Importando ${data.offers?.length || 0} ofertas...`);
  for (const item of data.offers || []) {
    await prisma.offer.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        generatedAt: new Date(item.generatedAt),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        scheduledFor: item.scheduledFor ? new Date(item.scheduledFor) : null,
        approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      },
    });
  }

  console.log(`Importando ${data.publications?.length || 0} publicações...`);
  for (const item of data.publications || []) {
    await prisma.publication.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
        failedAt: item.failedAt ? new Date(item.failedAt) : null,
      },
    });
  }

  console.log(`Importando ${data.integrationConnections?.length || 0} conexões de integração...`);
  for (const item of data.integrationConnections || []) {
    await prisma.integrationConnection.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        lastValidatedAt: item.lastValidatedAt ? new Date(item.lastValidatedAt) : null,
        lastSyncAt: item.lastSyncAt ? new Date(item.lastSyncAt) : null,
        lastWebhookAt: item.lastWebhookAt ? new Date(item.lastWebhookAt) : null,
      },
    });
  }

  console.log(`Importando ${data.integrationVerifications?.length || 0} verificações de integração...`);
  for (const item of data.integrationVerifications || []) {
    await prisma.integrationVerification.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        createdAt: new Date(item.createdAt),
      },
    });
  }

  console.log(`Importando ${data.integrationAuditLogs?.length || 0} logs de auditoria de integração...`);
  for (const item of data.integrationAuditLogs || []) {
    await prisma.integrationAuditLog.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        createdAt: new Date(item.createdAt),
      },
    });
  }

  console.log(`Importando ${data.autopilotConfigs?.length || 0} configurações de autopiloto...`);
  for (const item of data.autopilotConfigs || []) {
    await prisma.autopilotConfig.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        lastRunAt: item.lastRunAt ? new Date(item.lastRunAt) : null,
        nextRunAt: item.nextRunAt ? new Date(item.nextRunAt) : null,
        lockedAt: item.lockedAt ? new Date(item.lockedAt) : null,
      },
    });
  }

  console.log("Importação concluída com sucesso!");
}

async function main() {
  const [action, filePath] = process.argv.slice(2);
  const targetPath = filePath || path.join(process.cwd(), "prisma", "sqlite_dump.json");

  if (action === "export") {
    await exportData(targetPath);
  } else if (action === "import") {
    await importData(targetPath);
  } else {
    console.log("Comandos disponíveis: export [caminho], import [caminho]");
  }
}

main()
  .catch((e) => {
    console.error("Erro na migração:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
