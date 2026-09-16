# 🚀 Affiliate AI — Seu Afiliado Virtual Trabalhando 24h Por Dia

Plataforma SaaS profissional e autônoma para afiliados de marketplaces e redes de e-commerce (Shopee, Mercado Livre, Amazon). A plataforma monitora produtos, qualifica oportunidades com Opportunity Score, gera links monetizados com tags UTM dinâmicas, produz copies persuasivas com IA e distribui automaticamente para canais de mensageria (Telegram, WhatsApp, Discord) através de um motor de despacho com anti-spam e regras operacionais.

---

## 📌 Status das Fases Implementadas

- ✅ **Fase 1 — Fundação & SaaS Core**: Autenticação JWT, Onboarding, Multi-tenancy, Design System Premium Dark/Glass, Dashboard Executivo.
- ✅ **Fase 2 — Robot Engine & Product Intelligence**: Varredura multi-plataforma, normalização de dados, cálculo de Opportunity Score, Radar de Oportunidades em tempo real.
- ✅ **Fase 3 — Motor de Afiliados & Gerador de Ofertas com IA**: Gerador de links com UTM/subIDs, gerador de copy multi-estilo com proteção anti-fabricação e Fila de Ofertas (Offer Queue).
- ✅ **Fase 4 — Central de Canais, Dispatcher, Automação & Histórico**:
  - **Central de Canais**: Conexão com Telegram, WhatsApp e Discord (Adapters Mock com flag `source: "mock"` e teste de conectividade).
  - **Segurança de Segredos**: Armazenamento e mascaramento com `Configurado (••••••••1234)`.
  - **Channel Dispatcher**: Chave de idempotência única, proteção contra duplicação de 24h, formatação específica de markdown por canal e política de retries (máx 3).
  - **Motor de Automação**: Piloto automático com filtros por Score, comissão, desconto, plataformas, limites diários (`maxOffersPerDay`), intervalos mínimos (`minIntervalMinutes`), janelas operacionais (`allowedStartTime`/`allowedEndTime`) e resfriamento (`duplicateCooldownHours`).
  - **Worker de Segundo Plano**: Processamento em lote de ofertas agendadas e retries.
  - **Histórico Completo**: Rastreamento com status (`QUEUED`, `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`, `CANCELLED`, `RETRYING`), auditoria de eventos e reprocessamento manual.
- ✅ **Fase 5 — Autopiloto Inteligente & Ciclo Autônomo do Robô**:
  - **3 Modos de Operação**: `MANUAL`, `ASSISTED` e `AUTOPILOT` de ponta a ponta.
  - **Ciclo Autônomo de 20 Etapas (`AutopilotService`)**: Descoberta, snapshots, sinais de preço (`PRICE_DROP`), score multicritério explicável, filtro determinístico, capping (`maxOpportunitiesPerCycle`), links de afiliado com UTM, geração de cópias IA em 5 estilos, validação anti-fabricação, auto-aprovação e auto-publicação.
  - **Portão de Segurança (`AutopilotSafetyGate`)**: Verificação estrita antes do envio (horário operacional, limites diários, intervalo mínimo e cooldown de produtos).
  - **Balanceamento de Canais (`ChannelBalancer`)**: Estratégias `ALL`, `ROUND_ROBIN` e `PRIORITY`.
  - **Lock Transacional & Resiliência**: Prevenção de corridas simultâneas e tolerância a falhas parciais (`PARTIAL`, `COMPLETED`).
  - **Central de Notificações In-App**: Alertas para oportunidades quentes (Score >= 90), publicações disparadas e avisos operacionais.
  - **Auditoria "Por que o robô fez isso?"**: Interface transparente de explicação detalhada para cada decisão.
  - **Histórico Completo (`AutopilotRun`) & Monitoramento Admin**: Visão detalhada de ciclos por usuário e em nível administrativo global.
- ✅ **Fase 6 — Inteligência de Conversão, Analytics & Aprendizado Contínuo**:
  - **Rastreamento e Atribuição Hierárquica (`AnalyticsAttributionService`)**: Atribuição determinística `Conversion → AffiliateLink → Offer → Publication → Channel → Product → Platform`.
  - **Tracking Central de Cliques & Conversões**: Registro idempotente, rate limiting anti-fraude e separação explícita de comissões (`ESTIMATED`, `CONFIRMED`, `CANCELLED`).
  - **Performance Score Explicável**: Algoritmo com pesos transparentes (CTR 30%, Conversão 30%, Comissão 25%, Confiança 15%) e avaliação estatística (`WEAK`, `RELIABLE`, `STRONG`).
  - **Sinais de Aprendizado Contínuo (`LearningSignalService`)**: Extração de padrões (`BEST_CHANNEL`, `BEST_COPY_STYLE`, `BEST_TIME_SLOT`, `BEST_PLATFORM`) com limites mínimos de amostragem (>= 30 cliques).
  - **Integração com Autopiloto**: Otimização automática e auditada na seleção de estilos de copy e canais de destino.
  - **Motor de Testes A/B (`ExperimentService`)**: Criação e monitoramento de experimentos de cópias sem spam nos canais.
  - **Smart Scheduling**: Identificação de janelas de pico com maior taxa de conversão.
  - **Dashboard Moderno `/analytics`**: Separação clara entre `DATA SOURCE: REAL` e `MOCK`, gráficos temporais, rankings e empty states orientadores.

---

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Glassmorphism UI
- **Backend & APIs**: Next.js Route Handlers, Zod Validation, JWT Multi-tenant Auth
- **Banco de Dados & ORM**: SQLite + Prisma ORM (`prisma/schema.prisma`)
- **Testes**: Node.js Test Runner Nativo (`node --test` / `tsx --test`)

---

## 🚀 Como Executar o Projeto

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar o Banco de Dados e Migrations
```bash
npx prisma db push
```

### 3. Executar os Testes Unitários e de Integração
```bash
npm test
```

### 4. Fluxo de Desenvolvimento Local
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

**Credenciais Demo**:
- **E-mail**: `user@affiliateai.com`
- **Senha**: `user123`

---

### 5. Fluxo de Validação e Execução de Produção

> ⚠️ **IMPORTANTE (BOA PRÁTICA NEXT.JS)**:
> **Nunca execute `npm run dev` (`next dev`) e `npm run build` (`next build`) simultaneamente no mesmo diretório.**
> Executar `next build` com o servidor de desenvolvimento ativo causa conflito nos artefatos da pasta `.next`, fazendo com que os manifestos em memória do `next dev` fiquem dessincronizados e retornem HTTP 404 para arquivos estáticos (CSS/JS).

**Para validar ou rodar em produção:**
1. Pare qualquer instância ativa do servidor de desenvolvimento (`next dev`).
2. Execute a compilação de produção:
```bash
npm run build
```
3. Inicie o servidor em modo produção:
```bash
npm run start
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/             # Login, Registro, Onboarding
│   ├── (dashboard)/        # Dashboard, Meu Robô, Radar, Ofertas, Canais, Automação, Publicações, Configurações
│   └── api/                # Endpoints REST (Auth, Channels, Automation, Publications, Offers, Worker)
├── components/             # Componentes modulares UI, Sidebar, Header, Modals
├── domain/                 # Camada de Domínio Puro
│   ├── automation/         # AutomationEngine & Tipos
│   ├── channels/           # Adapters Telegram, WhatsApp, Discord & Factory
│   ├── dispatcher/         # ChannelDispatcher, MessageFormatter & PublicationWorker
│   ├── offers/             # OfferGenerator, Anti-fabrication validator
│   └── robot/              # RobotEngine, Scoring & Marketplace Adapters
├── lib/                    # Prisma client, JWT, SecretStorage, helpers
├── services/               # Camada de Serviços Orquestradores
└── tests/                  # Suíte de testes automatizados (Fases 1, 2, 3 e 4)
```

---

## 📄 Licença
Proprietário — Affiliate AI SaaS Platform.
