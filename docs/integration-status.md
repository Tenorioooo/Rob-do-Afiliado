# Status das Integrações & Matriz de Homologação

Este documento apresenta o quadro operacional das conexões e integrações do **Affiliate AI / Robô do Afiliado**.

---

## Matriz Geral de Homologação

| Provedor | Categoria | Status Atual | Requisitos de Ativação | Readiness para Execução Real |
|---|---|---|---|:---:|
| **Telegram** | Canal de Mensagens | `HOMOLOGADO` | Inserir `botToken` gerado no [@BotFather](https://t.me/BotFather) | **PRONTO** (com credenciais) |
| **Discord** | Canal de Mensagens | `HOMOLOGADO` | Inserir Webhook URL do canal | **PRONTO** (com credenciais) |
| **WhatsApp Meta** | Canal de Mensagens | `REQUER APROVAÇÃO` | Meta Developer App + WABA + Phone ID verificado | **PRONTO** (após aprovação Meta) |
| **Mercado Livre** | Marketplace | `HOMOLOGADO` (Catálogo/Webhooks) | Inserir `clientId` e `clientSecret` da aplicação ML Developers | **PRONTO** (Catálogo/Webhooks) |
| **Shopee** | Marketplace | `REQUER APROVAÇÃO` | Inserir `AppId` e `SecretKey` do Shopee Open API | **PRONTO** (após aprovação Shopee) |
| **Amazon** | Marketplace | `REQUER APROVAÇÃO` | Inserir `AccessKey`, `SecretKey` e `PartnerTag` (PA-API 5.0) | **PRONTO** (após 3 vendas qualificadas) |

---

## Capacidades por Provedor

### 1. Telegram
- `SEND_MESSAGE` (POST `/sendMessage`): **HOMOLOGADO** (HTML/Markdown)
- `SEND_MEDIA` (POST `/sendPhoto`): **HOMOLOGADO** (Fotos de ofertas)
- `WEBHOOKS` (POST `/setWebhook`): **HOMOLOGADO** (Secret header `X-Telegram-Bot-Api-Secret-Token`)
- `HEALTH_CHECK` (GET `/getMe`): **HOMOLOGADO** (Preflight não-destrutivo)

### 2. Discord
- `SEND_MESSAGE` (POST `/api/webhooks/{id}/{token}`): **HOMOLOGADO** (Embeds com cores e botões de afiliado)
- `BOT_MESSAGES` (POST `/api/v10/channels/{id}/messages`): **HOMOLOGADO** (Mensagens diretas de bot)
- `HEALTH_CHECK` (GET `/api/webhooks/{id}/{token}`): **HOMOLOGADO** (Inspeção de canal sem envio de chat)

### 3. WhatsApp Meta Cloud API
- `SEND_MESSAGE` (POST `/v21.0/{phone_number_id}/messages`): **REQUER APROVAÇÃO** (Graph API oficial)
- `WEBHOOKS` (POST assinados com HMAC-SHA256): **REQUER APROVAÇÃO**
- `HEALTH_CHECK` (GET `/v21.0/{phone_number_id}`): **REQUER APROVAÇÃO** (Diagnóstico de qualidade e número)

### 4. Mercado Livre Developers
- `OAUTH2` (Authorization Code Flow com refresh tokens): **HOMOLOGADO**
- `READ_PRODUCTS` (GET `/sites/MLB/search`): **HOMOLOGADO** (Catálogo oficial MLB)
- `WEBHOOKS` (Notificações de pedidos e itens): **HOMOLOGADO**
- `GENERATE_AFFILIATE_LINK`: **NÃO SUPORTADO EM API ABERTA** (Programa opera via portal manual)

### 5. Shopee Affiliate Open API
- `GENERATE_AFFILIATE_LINK` (Mutation `generateShortLink`): **REQUER APROVAÇÃO**
- `READ_PRODUCTS` (Query `productOfferV2`): **REQUER APROVAÇÃO**
- `READ_COMMISSION` (Query `conversionReport`): **REQUER APROVAÇÃO**

### 6. Amazon Associates PA-API 5.0
- `READ_PRODUCTS` (Operação `SearchItems` via AWS SigV4): **REQUER APROVAÇÃO** (Mínimo de 3 vendas)
- `READ_PRICES` / `READ_DISCOUNTS` (Operação `GetItems` via AWS SigV4): **REQUER APROVAÇÃO**

---

## Como Ativar uma Integração Real no SaaS

1. Acesse o menu **Integrações** no Dashboard (`/integrations`).
2. Clique no card do provedor desejado.
3. No painel de detalhes (`/integrations/[id]`), clique em **"Auditoria & Evidências"** para consultar os pré-requisitos oficiais e links da documentação.
4. Insira as credenciais oficiais no formulário de conexão (criptografadas via AES-256-GCM).
5. Clique em **"Executar Preflight"** para realizar os testes estruturais e de segurança SSRF.
6. Clique em **"Testar Conexão Oficial"** para autenticar ao vivo com a API externa.
7. Com a conexão aprovada, ative o canal ou marketplace para ser utilizado nas filas do Robô e Autopiloto.
