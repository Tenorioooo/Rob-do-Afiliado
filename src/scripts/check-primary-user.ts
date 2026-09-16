import { prisma } from "../lib/db/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        id: { startsWith: "user_" },
      },
    },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log("Primary non-test users:", JSON.stringify(users, null, 2));

  for (const u of users) {
    const conns = await prisma.integrationConnection.findMany({
      where: { userId: u.id },
      select: {
        id: true,
        provider: true,
        status: true,
        type: true,
        externalAccountId: true,
        externalAccountName: true,
        metadata: true,
      },
    });
    console.log(`Connections for user ${u.name} (${u.id}):`, conns);

    const channels = await prisma.channel.findMany({
      where: { userId: u.id },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        identifier: true,
        destination: true,
        active: true,
        status: true,
      },
    });
    console.log(`Channels for user ${u.name} (${u.id}):`, channels);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
