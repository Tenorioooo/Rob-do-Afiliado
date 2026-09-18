import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yAVvWqFhb70r@ep-holy-mode-aumqjg68-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
    }
  }
});

async function main() {
  // Usuários com conexões ativas
  const conns = await prisma.integrationConnection.findMany({
    select: { userId: true, provider: true, externalAccountName: true, status: true }
  });
  console.log('Conexões ativas:', conns);

  const realEmails = ['user@affiliateai.com', 'admin@affiliateai.com'];
  const connectedIds = new Set(conns.map(c => c.userId));

  // Deletar todos os usuários @example.com que NÃO tenham conexões ativas e NÃO sejam os emails principais
  const dummyUsers = await prisma.user.findMany({
    where: {
      email: { contains: '@example.com' },
      id: { notIn: Array.from(connectedIds) }
    },
    select: { id: true, email: true }
  });

  console.log(`Encontrados ${dummyUsers.length} usuários @example.com para remover...`);

  if (dummyUsers.length > 0) {
    const ids = dummyUsers.map(u => u.id);
    await prisma.session.deleteMany({ where: { userId: { in: ids } } });
    await prisma.autopilotRun.deleteMany({ where: { userId: { in: ids } } });
    await prisma.autopilotConfig.deleteMany({ where: { userId: { in: ids } } });
    await prisma.robotScan.deleteMany({ where: { userId: { in: ids } } });
    await prisma.robotEvent.deleteMany({ where: { userId: { in: ids } } });
    await prisma.robotConfig.deleteMany({ where: { userId: { in: ids } } });
    await prisma.automationRule.deleteMany({ where: { userId: { in: ids } } });
    await prisma.offerQueueItem.deleteMany({ where: { userId: { in: ids } } });
    await prisma.affiliateLink.deleteMany({ where: { userId: { in: ids } } });
    await prisma.channel.deleteMany({ where: { userId: { in: ids } } });
    await prisma.integration.deleteMany({ where: { userId: { in: ids } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
    await prisma.analyticsMetric.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.conversion.deleteMany({ where: { userId: { in: ids } } });
    await prisma.commission.deleteMany({ where: { userId: { in: ids } } });
    await prisma.experiment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.learningSignal.deleteMany({ where: { userId: { in: ids } } });
    await prisma.integrationEvent.deleteMany({ where: { userId: { in: ids } } });
    await prisma.integrationAuditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.integrationVerification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.integrationConnection.deleteMany({ where: { userId: { in: ids } } });

    const del = await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`Deletados ${del.count} usuários @example.com`);
  }

  // Deletar também quaisquer conexões mockadas de teste fictício (manter apenas conexões REAIS de MERCADO_LIVRE e TELEGRAM do usuário real)
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('\nUsuários finais no banco:', allUsers);

  console.log('\nConexões finais no banco:');
  const finalConns = await prisma.integrationConnection.findMany({
    select: { id: true, provider: true, externalAccountName: true, status: true, userId: true }
  });
  console.log(finalConns);
}

main().finally(() => prisma.$disconnect());
