import { prisma } from "../lib/db/prisma";
import { RobotScanService } from "../services/robot/robot-scan-service";
import { MOCK_USER } from "../lib/mock";

async function main() {
  const user = await prisma.user.upsert({
    where: { id: MOCK_USER.id },
    update: {},
    create: {
      id: MOCK_USER.id,
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      role: "USER",
      status: "ACTIVE",
      avatar: MOCK_USER.avatar,
      passwordHash: "mock_hash_user123",
    },
  });

  console.log(`User confirmed: ${user.id} (${user.email})`);
  
  console.log(`Starting scan for user ${user.id}...`);
  const result = await RobotScanService.executeScan(user.id, {
    minOpportunityScore: 60,
  });

  console.log("Scan completed successfully:", JSON.stringify(result, null, 2));

  const oppCount = await prisma.opportunity.count({ where: { userId: user.id } });
  console.log(`User now has ${oppCount} opportunities in DB.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
