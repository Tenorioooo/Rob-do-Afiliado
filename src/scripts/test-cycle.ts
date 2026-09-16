import { prisma } from "../lib/db/prisma";
import { AutopilotService } from "../services/autopilot/autopilot-service";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "autopilot-test@affiliateai.app" },
    update: { name: "Autopilot Tester" },
    create: {
      email: "autopilot-test@affiliateai.app",
      name: "Autopilot Tester",
      passwordHash: "test_hash",
      role: "USER",
    },
  });

  const channel = await prisma.channel.upsert({
    where: { id: "test-chan-1" },
    update: { active: true },
    create: {
      id: "test-chan-1",
      userId: user.id,
      name: "Telegram Test",
      type: "TELEGRAM",
      identifier: "-1001",
      provider: "mock",
      active: true,
      status: "CONNECTED",
    },
  });

  await AutopilotService.updateConfig(user.id, {
    automationMode: "AUTOPILOT",
    minOpportunityScore: 75,
    minCommission: 4.0,
    minDiscount: 10.0,
    maxOpportunitiesPerCycle: 5,
  });

  const summary = await AutopilotService.runCycle(user.id, { isManualTrigger: true });
  console.log("STATUS:", summary.status);
  console.log("PUBLICATIONS PUBLISHED:", summary.publicationsPublished);
  console.log("ERRORS:", JSON.stringify(summary.errors, null, 2));
  console.log("DECISIONS:", JSON.stringify(summary.decisions, null, 2));
}

main().finally(() => prisma.$disconnect());
