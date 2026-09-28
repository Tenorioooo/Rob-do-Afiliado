import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://neondb_owner:npg_yAVvWqFhb70r@ep-holy-mode-aumqjg68-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
    },
  },
});

async function main() {
  console.log("=== [INICIANDO LIMPEZA TOTAL DE VARREDURAS, PRODUTOS E MOCKS] ===");

  console.log("\n📊 Estado atual do banco:");
  console.log("- RobotScan (Varreduras):", await prisma.robotScan.count());
  console.log("- RobotEvent (Eventos):", await prisma.robotEvent.count());
  console.log("- AutopilotRun (Execuções do Piloto):", await prisma.autopilotRun.count());
  console.log("- Opportunity (Oportunidades):", await prisma.opportunity.count());
  console.log("- ProductSnapshot (Snapshots):", await prisma.productSnapshot.count());
  console.log("- Product (Produtos):", await prisma.product.count());
  console.log("- Offer (Ofertas):", await prisma.offer.count());
  console.log("- OfferQueueItem (Fila):", await prisma.offerQueueItem.count());
  console.log("- Publication (Publicações):", await prisma.publication.count());
  console.log("- ExperimentVariant / Experiment:", await prisma.experimentVariant.count());
  console.log("- AnalyticsEvent:", await prisma.analyticsEvent.count());

  console.log("\n🗑️ Executando exclusão em cascata controlada...");

  // 1. Limpar publicações e fila
  const delPub = await prisma.publication.deleteMany({});
  console.log(`✓ Publicações deletadas: ${delPub.count}`);

  const delQueue = await prisma.offerQueueItem.deleteMany({});
  console.log(`✓ Itens de fila deletados: ${delQueue.count}`);

  // 2. Limpar variantes de experimento associadas
  const delExpVar = await prisma.experimentVariant.deleteMany({});
  console.log(`✓ Variantes de experimento deletadas: ${delExpVar.count}`);

  // 3. Limpar ofertas
  const delOffers = await prisma.offer.deleteMany({});
  console.log(`✓ Ofertas deletadas: ${delOffers.count}`);

  // 4. Limpar eventos de analítica de produtos/links
  const delAnalytics = await prisma.analyticsEvent.deleteMany({});
  console.log(`✓ Analytics Events deletados: ${delAnalytics.count}`);

  // 5. Limpar oportunidades
  const delOpps = await prisma.opportunity.deleteMany({});
  console.log(`✓ Oportunidades deletadas: ${delOpps.count}`);

  // 6. Limpar snapshots de produtos
  const delSnapshots = await prisma.productSnapshot.deleteMany({});
  console.log(`✓ Snapshots de produtos deletados: ${delSnapshots.count}`);

  // 7. Limpar produtos
  const delProducts = await prisma.product.deleteMany({});
  console.log(`✓ Produtos escaneados deletados: ${delProducts.count}`);

  // 8. Limpar eventos de varreduras
  const delRobotEvents = await prisma.robotEvent.deleteMany({});
  console.log(`✓ Eventos de robô deletados: ${delRobotEvents.count}`);

  // 9. Limpar histórico de varreduras
  const delScans = await prisma.robotScan.deleteMany({});
  console.log(`✓ Histórico de varreduras do robô deletado: ${delScans.count}`);

  // 10. Limpar histórico de execuções do piloto automático
  const delAutopilotRuns = await prisma.autopilotRun.deleteMany({});
  console.log(`✓ Execuções do Autopiloto deletadas: ${delAutopilotRuns.count}`);

  console.log("\n✨ Estado do banco após a limpeza:");
  console.log("- RobotScan (Varreduras):", await prisma.robotScan.count());
  console.log("- RobotEvent (Eventos):", await prisma.robotEvent.count());
  console.log("- AutopilotRun (Execuções do Piloto):", await prisma.autopilotRun.count());
  console.log("- Opportunity (Oportunidades):", await prisma.opportunity.count());
  console.log("- ProductSnapshot (Snapshots):", await prisma.productSnapshot.count());
  console.log("- Product (Produtos):", await prisma.product.count());
  console.log("- Offer (Ofertas):", await prisma.offer.count());
  console.log("- Publication (Publicações):", await prisma.publication.count());

  console.log("\n🔒 Dados de usuários, conexões e configurações preservados intactos:");
  console.log("- Usuários:", await prisma.user.count());
  console.log("- Conexões de Integração:", await prisma.integrationConnection.count());
  console.log("- Canais:", await prisma.channel.count());

  console.log("\n=== [LIMPEZA CONCLUÍDA COM SUCESSO] ===");
}

main()
  .catch((e) => {
    console.error("Erro durante a limpeza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
