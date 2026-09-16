# Documentação — Fase 5: Autopiloto Inteligente & Ciclo Autônomo do Robô

## 1. Visão Geral
A **Fase 5** eleva o SaaS **Affiliate AI / Robô do Afiliado** para uma operação 100% autônoma, introduzindo o conceito de **Autopiloto de Afiliados**.

O robô agora executa um pipeline contínuo de 20 etapas sem intervenção manual necessária:
1. **Verificação de Estado & Lock**: Impede concorrência e corridas (`AutopilotConfig.isLocked`).
2. **Descoberta de Produtos**: Varredura nos catálogos Shopee, Mercado Livre e Amazon (`discoveryService`).
3. **Normalização & Snapshots**: Registro de variações históricas de preço (`ProductSnapshot`).
4. **Sinais de Preço (`PriceSignalService`)**: Detecção determinística de `PRICE_DROP`, `PRICE_INCREASE` e `NO_CHANGE`.
5. **Score Explicável**: Avaliação multicritério transparente (`OpportunityScoringService`).
6. **Estratégia do Robô & Filtros**: Validação de pontuação mínima, comissão mínima, desconto mínimo, teto de preço, categorias e plataformas permitidas.
7. **Deduplicação, Cooldown & Smart Republishing**: Prevenção de spam e republish inteligente apenas quando há queda real de preço.
8. **Priorização & Capping**: Ordenação por Score e limitação por ciclo (`maxOpportunitiesPerCycle`).
9. **Geração de Links de Afiliado**: Integração com tags UTM determinísticas (`AffiliateLinkService`).
10. **Geração de Cópias com IA**: Criação de ofertas em 5 estilos (`OfferGenerator`).
11. **Validação Anti-Fabricação**: Bloqueio de termos proibidos e alucinações (`OfferValidator`).
12. **Auto-Aprovação**: Mudança de estado `DRAFT -> READY -> APPROVED` conforme modo de automação.
13. **Portão de Segurança (`AutopilotSafetyGate`)**: Checagem de limites diários, janela operacional, intervalo de envio, cooldown e saúde dos canais.
14. **Balanceamento de Canais (`ChannelBalancer`)**: Estratégias `ALL`, `ROUND_ROBIN` e `PRIORITY`.
15. **Publicação & Dispatcher**: Envio para Telegram, WhatsApp, Discord e Webhooks (`ChannelDispatcher`).
16. **Tratamento de Falhas Parciais**: Erros individuais em produtos não interrompem o lote.
17. **Histórico de Ciclos (`AutopilotRun`)**: Auditoria detalhada de cada execução (`COMPLETED`, `PARTIAL`, `FAILED`).
18. **Central de Notificações In-App**: Alertas em tempo real de oportunidades quentes e disparos.
19. **Worker em Segundo Plano (`AutopilotWorker`)**: Execução periódica programada.
20. **Auditoria "Por que o robô fez isso?"**: Interface para visualização dos fatores determinísticos de cada decisão.

---

## 2. Modos de Automação

| Modo | Descrição | Comportamento |
|---|---|---|
| **MANUAL** | O usuário controla cada etapa | Robô apenas sugere; requer aprovação e disparo manual. |
| **ASSISTED** | Robô encontra e prepara ofertas | Gera links e cópias automaticamente, aguardando aprovação para disparar. |
| **AUTOPILOT** | Robô autônomo de ponta a ponta | Garimpa, analisa, gera links, cria cópias, aprova e publica nos canais conforme regras. |

---

## 3. Endpoints da API

- `GET /api/autopilot`: Retorna status, configuração, métricas acumuladas e eventos recentes.
- `PATCH /api/autopilot/config`: Atualiza preferências com validação Zod.
- `POST /api/autopilot/start`: Ativa o autopiloto.
- `POST /api/autopilot/pause`: Pausa o autopiloto.
- `POST /api/autopilot/run`: Executa 1 ciclo autônomo imediato com proteção de lock.
- `GET /api/autopilot/history`: Histórico paginado de execuções (`AutopilotRun`).
- `GET /api/notifications`: Lista notificações do usuário.
- `PATCH /api/notifications`: Marca notificações como lidas.
- `GET /api/admin/autopilot/runs`: Monitoramento global para administradores.

---

## 4. Portão de Segurança (Safety Gate)
O `AutopilotSafetyGate` atua como barreira antes de qualquer publicação:
- ✓ Valida propriedade da oferta e canal;
- ✓ Valida link de afiliado ativo com URL válida;
- ✓ Valida conformidade anti-fabricação;
- ✓ Bloqueia se o limite diário (`maxOffersPerDay`) foi atingido;
- ✓ Bloqueia se o intervalo mínimo de publicação não foi respeitado;
- ✓ Bloqueia se fora do horário operacional permitido;
- ✓ Bloqueia se o produto estiver em cooldown no canal.

---

## 5. Mock vs. Real
- **Mock**: Provedores de catálogo e adaptadores de canal simulam APIs reais de forma determinística e segura para desenvolvimento e testes.
- **Transição para Produção**: As interfaces `IAffiliateAdapter`, `IAIProvider` e `IChannelAdapter` estão prontas para plugar SDKs oficiais (Shopee Open Platform, Mercado Livre API, Amazon Creators API, Telegram Bot API, WhatsApp Cloud API, Discord Bot Webhooks).
