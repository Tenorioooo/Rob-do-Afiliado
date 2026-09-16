# FASE 7 — MATRIZ DE CAPACIDADES E APIS OFICIAIS DE PROVEDORES

Este documento registra a pesquisa e validação técnica das APIs oficiais e capacidades reais de cada marketplace e canal integrado ao **Affiliate AI**.

---

## 1. Matriz de Capacidades por Provedor

| Provedor | Recurso / Capacidade | Oficial? | Disponibilidade Real | Tipo de Autenticação | Status de Implementação |
|---|---|---|---|---|---|
| **Shopee** | Consulta de Produtos | Oficial | Acesso restrito a parceiros aprovados no Shopee Open Platform | HMAC-SHA256 (`AppId` + `Secret`) | `PARTIAL` (Adaptador Real com fallback de Capability) |
| **Shopee** | Geração de Links de Afiliado | Oficial | Suportado via `generateShortLink` (Affiliate API) | HMAC-SHA256 (`AppId` + `Secret`) | `PARTIAL` (Disponível quando credenciais presentes) |
| **Shopee** | Consulta de Comissão/Conversão | Oficial | `getConversionReport` (GraphQL/REST) | HMAC-SHA256 | `PARTIAL` |
| **Shopee** | Webhooks/Postbacks | Parcial | Varia por região/gerente de conta | Assinatura HMAC | `UNAVAILABLE` (Requer configuração de postback por conta) |
| **Mercado Livre** | Consulta de Produtos | Oficial | Pública e aberta via `/sites/MLB/search` e `/items/:id` | Bearer Token / Client Credentials / Pública | `IMPLEMENTED_REAL` |
| **Mercado Livre** | OAuth 2.0 | Oficial | Totalmente suportado (`/authorization`, `/oauth/token`) | OAuth 2.0 (`client_id`, `client_secret`) | `IMPLEMENTED_REAL` |
| **Mercado Livre** | Notificações / Webhooks | Oficial | Tópicos `items`, `orders_v2` | Notificação JSON via endpoint registrado | `IMPLEMENTED_REAL` |
| **Mercado Livre** | Afiliados Direto | Parcial | O programa opera com parâmetros de rastreamento (`matt_tool`/`matt_word`) ou redes parceiras | Parâmetros UTM/SubID | `PARTIAL` |
| **Amazon** | Consulta de Produtos | Oficial | PA-API 5.0 (`SearchItems`, `GetItems`) | AWS Signature Version 4 (`AccessKey`, `SecretKey`) | `PARTIAL` (Requer aprovação prévia no Associates) |
| **Amazon** | Geração de Links de Afiliado | Oficial | PA-API 5.0 (`DetailPageURL` com `PartnerTag`) | AWS Signature Version 4 | `PARTIAL` |
| **Amazon** | Webhooks de Conversão | Não | Amazon PA-API não envia webhooks de conversão para afiliados | N/A | `UNAVAILABLE` (Não suportado oficialmente pela Amazon) |
| **Telegram** | Envio de Mensagens / Fotos | Oficial | Totalmente aberto via Bot API (`sendMessage`, `sendPhoto`) | Bot Token HTTP | `IMPLEMENTED_REAL` |
| **Telegram** | Webhooks Oficiais | Oficial | `setWebhook` com validação de `secret_token` | Token no Header `X-Telegram-Bot-Api-Secret-Token` | `IMPLEMENTED_REAL` |
| **WhatsApp** | Envio de Mensagens | Oficial | Meta WhatsApp Cloud API (`messages`) | Bearer Access Token (`Phone Number ID`) | `IMPLEMENTED_REAL` |
| **WhatsApp** | Webhooks Oficiais | Oficial | Verificação de webhook e assinatura `X-Hub-Signature-256` | HMAC-SHA256 com `App Secret` | `IMPLEMENTED_REAL` |
| **Discord** | Envio via Incoming Webhook | Oficial | Totalmente aberto e documentado | URL de Webhook com Token embutido | `IMPLEMENTED_REAL` |
| **Discord** | Envio via Bot API | Oficial | Totalmente suportado via REST API v10 | Header `Bot <token>` | `IMPLEMENTED_REAL` |
| **Discord** | Webhook Events | Oficial | Endpoints de interações com assinatura Ed25519 | Assinatura Ed25519 (`X-Signature-Ed25519`) | `IMPLEMENTED_REAL` |

---

## 2. Detalhamento Técnico das Integrações Oficiais

### 2.1 Telegram Bot API
- **Endpoint Base**: `https://api.telegram.org/bot<token>/`
- **Validação de Conexão**: Chamada a `getMe` retorna `{ ok: true, result: { id, is_bot, first_name, username } }`.
- **Webhook**: Registro seguro via `setWebhook?url=<endpoint>&secret_token=<secret>`.
- **Validação de Update**: O header `X-Telegram-Bot-Api-Secret-Token` deve coincidir com o secret configurado.

### 2.2 Discord Webhooks & Bot API
- **Incoming Webhook**: `https://discord.com/api/webhooks/:id/:token` aceita JSON com `content`, `embeds`, `username`, `avatar_url`.
- **REST Bot API**: `https://discord.com/api/v10/channels/:channel_id/messages` com header `Authorization: Bot <token>`.
- **Validação**: Verificação de status HTTP 200/204 e parsing de embeds.

### 2.3 Meta WhatsApp Cloud API
- **Endpoint Base**: `https://graph.facebook.com/v21.0/<phone_number_id>/messages`
- **Autenticação**: Header `Authorization: Bearer <access_token>`.
- **Webhook Handshake**: `GET` com `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`.
- **Validação de Assinatura**: `POST` com header `X-Hub-Signature-256` validado via HMAC-SHA256 do raw body com `APP_SECRET`.

### 2.4 Mercado Livre Developers API
- **Endpoint Base**: `https://api.mercadolibre.com`
- **OAuth 2.0**: `https://auth.mercadolivre.com.br/authorization` e `https://api.mercadolibre.com/oauth/token`.
- **Busca de Produtos**: `GET https://api.mercadolibre.com/sites/MLB/search?q=<termo>&limit=<qtd>`.
- **Item Lookup**: `GET https://api.mercadolibre.com/items/<item_id>`.
- **Webhooks**: Notificações recebidas em endpoint HTTPS registrado, validadas por `resource` e `user_id`.

### 2.5 Shopee Open Platform & Affiliate API
- **Endpoint Base**: `https://open-api.affiliate.shopee.com.br/graphql` ou REST Open Platform.
- **Autenticação**: Headers `Authorization: SHA256 Credential=...` e `Timestamp`.
- **Capacidades**: Quando credenciais de parceiro aprovado estão presentes, permite gerar tracking links e buscar relatórios de conversão. Se não configurado, o sistema avisa explicitamente a indisponibilidade sem simular requisições falsas.

### 2.6 Amazon Product Advertising API 5.0
- **Endpoint Base**: `https://webservices.amazon.com/paapi5/searchitems`
- **Autenticação**: AWS Signature Version 4.
- **Capacidades**: Busca oficial de produtos e links com `PartnerTag`. Conversões em tempo real via webhook não são fornecidas pela Amazon PA-API (declarado como `UNAVAILABLE`).

---

## 3. Diretrizes de Segurança e Isolamento

1. **Criptografia em Repouso**: Todas as credenciais sensíveis (`botToken`, `clientSecret`, `accessToken`, `appSecret`, `webhookSecret`) são armazenadas com criptografia simétrica autenticada **AES-256-GCM** via `CredentialService` utilizando chave mestra `INTEGRATION_ENCRYPTION_KEY`.
2. **Máscara na Exibição**: O frontend NUNCA recebe tokens ou secrets completos (apenas máscaras como `••••••••7F2A`).
3. **SSRF Protection**: `ExternalRequestPolicy` valida e autoriza somente os domínios oficiais dos provedores cadastrados no `ProviderRegistry`.
4. **Idempotência de Webhooks**: Cada evento recebido gera um `IntegrationEvent` com chave única `[provider, externalEventId]` para prevenir processamento duplicado.
5. **Transparência de Origem**: Eventos e métricas reais recebem estritamente `source: "real"`, enquanto eventos de demonstração são identificados como `source: "mock"`.
