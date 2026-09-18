import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yAVvWqFhb70r@ep-holy-mode-aumqjg68-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
    }
  }
});

async function main() {
  console.log('--- [INÍCIO DA LIMPEZA DE DADOS MOCK] ---');
  
  // 1. Snapshot do banco antes
  console.log('📊 Contagens antes da limpeza:');
  console.log('- Produtos:', await prisma.product.count());
  console.log('- Ofertas:', await prisma.offer.count());
  console.log('- Snapshots:', await prisma.productSnapshot.count());
  console.log('- Oportunidades:', await prisma.opportunity.count());
  console.log('- Publicações:', await prisma.publication.count());
  console.log('- Eventos de Analytics:', await prisma.analyticsEvent.count());
  console.log('- Conexões de Integração:', await prisma.integrationConnection.count());
  console.log('- Usuários totais:', await prisma.user.count());

  // 2. Limpar tabelas filhas e dados de produtos/ofertas mockados
  console.log('\n🗑️ Removendo eventos, snapshots, oportunidades, publicações e ofertas...');
  
  const deletedEvents = await prisma.analyticsEvent.deleteMany({});
  console.log(`✓ AnalyticsEvent deletados: ${deletedEvents.count}`);

  const deletedPubs = await prisma.publication.deleteMany({});
  console.log(`✓ Publication deletadas: ${deletedPubs.count}`);

  const deletedOpps = await prisma.opportunity.deleteMany({});
  console.log(`✓ Opportunity deletadas: ${deletedOpps.count}`);

  const deletedOffers = await prisma.offer.deleteMany({});
  console.log(`✓ Offer deletadas: ${deletedOffers.count}`);

  const deletedSnapshots = await prisma.productSnapshot.deleteMany({});
  console.log(`✓ ProductSnapshot deletados: ${deletedSnapshots.count}`);

  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`✓ Product deletados: ${deletedProducts.count}`);

  // 3. Limpar usuários temporários/fictícios gerados durante fases de teste, mantendo os usuários principais
  // Preservar: user@affiliateai.com, admin@affiliateai.com e qualquer usuário com integrações ativas
  const connections = await prisma.integrationConnection.findMany({
    select: { userId: true }
  });
  const connectedUserIds = new Set(connections.map(c => c.userId));

  const preservedEmails = ['user@affiliateai.com', 'admin@affiliateai.com'];

  const testUsersToDelete = await prisma.user.findMany({
    where: {
      AND: [
        { email: { notIn: preservedEmails } },
        { id: { notIn: Array.from(connectedUserIds) } },
        {
          OR: [
            { email: { contains: 'phase' } },
            { email: { contains: 'test' } },
            { email: { contains: 'mock' } },
            { email: { contains: 'temp' } },
            { email: { contains: 'p7' } },
            { id: { startsWith: 'user_phase' } },
            { id: { startsWith: 'user_p' } },
          ]
        }
      ]
    },
    select: { id: true, email: true }
  });

  if (testUsersToDelete.length > 0) {
    const ids = testUsersToDelete.map(u => u.id);
    console.log(`Removendo registros relacionados a ${ids.length} usuários temporários de teste...`);
    
    // Deletar dependências de usuário
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

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`✓ Usuários temporários deletados: ${deletedUsers.count}`);
  }

  // 4. Status final
  console.log('\n✨ Contagens após a limpeza:');
  console.log('- Produtos:', await prisma.product.count());
  console.log('- Ofertas:', await prisma.offer.count());
  console.log('- Snapshots:', await prisma.productSnapshot.count());
  console.log('- Oportunidades:', await prisma.opportunity.count());
  console.log('- Publicações:', await prisma.publication.count());
  console.log('- Eventos de Analytics:', await prisma.analyticsEvent.count());
  console.log('- Conexões de Integração (REAIS PRESERVADAS):', await prisma.integrationConnection.count());
  
  const remainingConnections = await prisma.integrationConnection.findMany({
    select: { provider: true, externalAccountName: true, status: true, userId: true }
  });
  console.log('  Conexões ativas:', remainingConnections);

  console.log('- Usuários remanescentes:', await prisma.user.count());
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('  Usuários:', remainingUsers);

  console.log('\n--- [LIMPEZA CONCLUÍDA COM SUCESSO] ---');
}

main()
  .catch((e) => {
    console.error('Erro na limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
