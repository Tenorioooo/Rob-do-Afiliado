import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yAVvWqFhb70r@ep-holy-mode-aumqjg68-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
    }
  }
});

async function main() {
  console.log('--- PURGANDO USUÁRIOS E CONEXÕES TEMPORÁRIAS DE TESTE ---');
  
  // Emails que DEVEM ser preservados:
  const preservedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'user@affiliateai.com' },
        { email: 'admin@affiliateai.com' },
        { id: 'usr-demo-01' },
        { id: 'usr-admin-01' }
      ]
    }
  });
  
  const preservedIds = preservedUsers.map(u => u.id);
  console.log('Usuários mantidos:', preservedUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));

  // Deletar conexões de usuários que NÃO são os preservados
  const delConns = await prisma.integrationConnection.deleteMany({
    where: {
      userId: { notIn: preservedIds }
    }
  });
  console.log(`✓ Conexões temporárias de teste deletadas: ${delConns.count}`);

  // Deletar dependências dos outros usuários
  await prisma.session.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.autopilotRun.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.autopilotConfig.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.robotScan.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.robotEvent.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.robotConfig.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.automationRule.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.offerQueueItem.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.affiliateLink.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.channel.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.integration.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.subscription.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.analyticsMetric.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.notification.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.conversion.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.commission.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.experiment.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.learningSignal.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.integrationEvent.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.integrationAuditLog.deleteMany({ where: { userId: { notIn: preservedIds } } });
  await prisma.integrationVerification.deleteMany({ where: { userId: { notIn: preservedIds } } });

  // Deletar os usuários temporários
  const delUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: preservedIds }
    }
  });
  console.log(`✓ Usuários temporários deletados: ${delUsers.count}`);

  console.log('\n--- RESUMO FINAL DO BANCO ---');
  console.log('Usuários:', await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } }));
  console.log('Conexões Reais Ativas:', await prisma.integrationConnection.findMany({ select: { id: true, provider: true, externalAccountName: true, status: true, userId: true } }));
  console.log('Produtos:', await prisma.product.count());
  console.log('Ofertas:', await prisma.offer.count());
  console.log('Snapshots:', await prisma.productSnapshot.count());
  console.log('Publicações:', await prisma.publication.count());
  console.log('Oportunidades:', await prisma.opportunity.count());
}

main().finally(() => prisma.$disconnect());
