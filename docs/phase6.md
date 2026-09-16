# FASE 6 — INTELIGÊNCIA DE CONVERSÃO + ANALYTICS + APRENDIZADO CONTÍNUO

## 1. Visão Geral
A Fase 6 transforma o **Affiliate AI / Robô do Afiliado** em um ecossistema com ciclo de feedback inteligente fechado:

```text
DISCOVERY
   ↓
OPPORTUNITY
   ↓
AFFILIATE LINK
   ↓
AI OFFER
   ↓
PUBLICATION
   ↓
CLICK
   ↓
CONVERSION
   ↓
COMMISSION
   ↓
ANALYTICS
   ↓
PERFORMANCE SCORE
   ↓
LEARNING
   ↓
AUTOPILOT OPTIMIZATION
```

O sistema agora responde de forma auditável e transparente:
> *"Quais produtos, ofertas, estilos de copy, canais, horários e plataformas realmente geram resultado?"*

---

## 2. Modelagem do Banco de Dados (Prisma SQLite)

### Novos Modelos
- **`AnalyticsEvent`**: Registro granular de eventos (`CLICK`, `CONVERSION`, `COMMISSION`, `REFUND`, `CANCELLATION`, `PUBLICATION`) com dados de atribuição, IP hash anti-abuso e tag explícita `source` (`"mock" | "real"`).
- **`Conversion`**: Rastreamento de conversão com proteção de idempotência por `userId + platform + externalOrderId` e status (`PENDING`, `APPROVED`, `CANCELLED`, `REFUNDED`).
- **`Commission`**: Separação contábil rigorosa entre `ESTIMATED`, `CONFIRMED` e `CANCELLED`.
- **`Experiment` & `ExperimentVariant`**: Motor de testes A/B de cópias com alocação balanceada de tráfego, limites de exposição anti-spam e conclusão determinística com identificação do vencedor.
- **`LearningSignal`**: Sinais de inteligência persistidos (`BEST_CHANNEL`, `BEST_COPY_STYLE`, `BEST_TIME_SLOT`, `BEST_PLATFORM`, etc.) com pontuação, grau de confiança (`WEAK`, `RELIABLE`, `STRONG`), tamanho amostral e justificativa textual.

---

## 3. Serviços de Domínio (`src/domain/analytics/`)

### `AnalyticsAttributionService`
Resolve a hierarquia determinística de atribuição:
```text
Conversion → AffiliateLink → Offer → Publication → Channel → Product → Platform
```
Se qualquer entidade for fornecida, o serviço deduz e conecta as entidades pai e filhas disponíveis.

### `PerformanceScoreService`
Algoritmo transparente e explicável:
- **CTR**: 30%
- **Taxa de Conversão**: 30%
- **Comissão**: 25%
- **Consistência Amostral / Confiança**: 15%
- **Confiança Amostral**:
  - `< 30 eventos`: `WEAK` (Sinal insuficiente)
  - `30 - 99 eventos`: `RELIABLE` (Sinal confiável)
  - `>= 100 eventos`: `STRONG` (Sinal robusto)

### `LearningSignalService`
Extrai padrões de conversão e só gera sinais fortes quando o volume mínimo de dados é atingido.

### `SmartSchedulingService`
Analisa 24 faixas horárias diárias e dias da semana para identificar janelas de pico com maior conversão, utilizando horários padrão como fallback seguro se não houver amostragem estatística.

### `ExperimentService`
Gerencia experimentos A/B de copy sem gerar spam nos canais nem violar os limites diários do usuário.

---

## 4. Integração com o Autopiloto

O `AutopilotService` consulta o `LearningSignalService` no início de cada ciclo:
1. Identifica estilos de copy de alto desempenho (`BEST_COPY_STYLE` com confiança `RELIABLE` ou `STRONG`) e os utiliza prioritariamente na geração de cópias;
2. Prioriza os canais de melhor rentabilidade no balanceador de canais (`ChannelBalancer`);
3. Registra em `OpportunityDecisionAudit` a justificativa (`recommendationReason`) e a lista de sinais aplicados (`learningSignalsApplied`);
4. **Segurança Incondicional**: Todo o fluxo continua passando pelo `AutopilotSafetyGate`, respeitando limites diários, intervalos mínimos e cooldowns anti-duplicação.

---

## 5. Endpoints de API Criados

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/analytics/click` | Registro seguro de cliques com rate limit e incremento central |
| `POST` | `/api/analytics/conversion` | Registro de conversão com idempotência e criação de comissão |
| `GET` | `/api/analytics/overview` | KPIs globais, comparação temporal e status da fonte |
| `GET` | `/api/analytics/channels` | Ranking e detalhamento por canal |
| `GET` | `/api/analytics/offers` | Performance por oferta gerada |
| `GET` | `/api/analytics/products` | Ranking de produtos (WINNER, NEUTRAL, UNDERPERFORMER) |
| `GET` | `/api/analytics/platforms` | Comparativo entre marketplaces |
| `GET` | `/api/analytics/copy` | Performance comparativa por estilo de copy |
| `GET` | `/api/analytics/timeslots` | Heatmap e horários inteligentes |
| `GET` | `/api/analytics/learning` | Lista de sinais de aprendizado ativos |
| `GET / POST` | `/api/analytics/experiments` | Gestão e criação de testes A/B |
| `POST` | `/api/analytics/simulate` | Gerador controlado de eventos mock para desenvolvimento local |

---

## 6. Distinção Rigorosa Mock vs Real

Todos os registros contêm o atributo `source`:
- **`MOCK`**: Eventos originados em testes, desenvolvimento ou simulação controlada.
- **`REAL`**: Eventos provenientes de postbacks/webhooks de marketplaces reais.
- O Dashboard exibe discretamente o badge `DATA SOURCE: MOCK`, `DATA SOURCE: REAL` ou `DATA SOURCE: MIXED`, prevenindo confusão entre dados de demonstração e faturamento real.
