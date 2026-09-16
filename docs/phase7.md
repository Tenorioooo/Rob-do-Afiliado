# FASE 7 — INTEGRAÇÕES EXTERNAS REAIS + WEBHOOKS + CENTRAL DE CONEXÕES

## 1. Visão Geral da Arquitetura

A **Fase 7** consolida a transição do SaaS *"Robô do Afiliado"* do ambiente de simulação controlada para a conexão direta com APIs oficiais dos principais marketplaces e plataformas de mensageria do mercado.

O sistema mantém estrita separação entre execuções reais e mocks, com fallback transparente, segurança de nível bancário para chaves de API, e proteção contra ataques de injeção e requisições maliciosas (SSRF).

```
                           ┌─────────────────────────────────────────────────────────┐
                           │          CENTRAL DE CONEXÕES (/integrations)             │
                           └────────────────────────────┬────────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────────────────┐
                    ▼                                   ▼                                   ▼
        ┌───────────────────────┐           ┌───────────────────────┐           ┌───────────────────────┐
        │  Segurança de Chaves  │           │   Catálogo & Regras   │           │    Proteção SSRF      │
        │      AES-256-GCM      │           │   ProviderRegistry    │           │ ExternalRequestPolicy │
        └───────────────────────┘           └───────────────────────┘           └───────────────────────┘
                    │                                   │                                   │
                    └───────────────────────────────────┼───────────────────────────────────┘
                                                        │
                        ┌───────────────────────────────┴───────────────────────────────┐
                        │              ADAPTERS OFICIAIS & CLIENTE HTTP                 │
                        │                  ExternalRequestClient                        │
                        └───────┬───────────────────────────────┬───────────────────────┘
                                │                               │
                ┌───────────────┴───────────────┐       ┌───────┴───────────────────────┐
                ▼                               ▼       ▼                               ▼
       [MARKETPLACES REAIS]                            [CANAIS DE DIVULGAÇÃO REAIS]
       • Shopee Affiliate API (GraphQL + HMAC)         • Telegram Bot API (getMe / sendMessage)
       • Mercado Livre Developers (OAuth 2.0)          • WhatsApp Meta Cloud API (Graph API)
       • Amazon Associates (PA-API 5.0)                • Discord Webhook & Bot REST API v10
```

---

## 2. Matriz de Capacidades Reais Oficiais

| Provedor | Categoria | Tipo de Autenticação | Capacidades Oficiais Suportadas | Webhook Suportado? |
| :--- | :--- | :--- | :--- | :--- |
| **Telegram** | Canal | Bot Token (`BotFather`) | `SEND_MESSAGE`, `SEND_MEDIA`, `EDIT_MESSAGE`, `DELETE_MESSAGE`, `WEBHOOKS` | Sim (`X-Telegram-Bot-Api-Secret-Token`) |
| **Discord** | Canal | Webhook URL / Bot Token | `SEND_MESSAGE`, `SEND_MEDIA`, `WEBHOOKS` | Sim (`X-Signature-Ed25519` / Webhook JSON) |
| **WhatsApp** | Canal | Meta Cloud API (Bearer) | `SEND_MESSAGE`, `SEND_MEDIA`, `WEBHOOKS` | Sim (`X-Hub-Signature-256` SHA-256 HMAC) |
| **Mercado Livre**| Marketplace | OAuth 2.0 (PKCE/Code) | `READ_PRODUCTS`, `READ_PRICES`, `READ_ORDERS`, `WEBHOOKS`, `OAUTH2` | Sim (Tópicos `orders_v2`, `items`) |
| **Shopee** | Marketplace | HMAC-SHA256 Signatures | `GENERATE_AFFILIATE_LINK`, `READ_PRODUCTS`, `READ_COMMISSION` | Postback / Polling |
| **Amazon** | Marketplace | AWS Signature Version 4 | `READ_PRODUCTS`, `READ_PRICES`, `READ_DISCOUNTS` | Não (Consulta sob demanda via PA-API) |

---

## 3. Segurança & Proteção de Credenciais

1. **Criptografia em Repouso (AES-256-GCM)**:
   - Chaves privadas e tokens de acesso são criptografados antes de qualquer escrita no banco de dados SQLite/Postgres.
   - O payload cifrado utiliza vetor de inicialização único (IV de 12 bytes) e tag de autenticação GCM (16 bytes) no formato `iv:authTag:encryptedHex`.
2. **Máscara de Chaves no Frontend**:
   - Chaves sensíveis nunca são retornadas em texto plano para o navegador.
   - O serviço de sanitização substitui as credenciais por tokens mascarados (ex: `••••••••7F2A`), preservando apenas os 4 últimos caracteres para identificação pelo usuário.
3. **Redação de Logs de Auditoria**:
   - Regex intercepta e redige strings de `bot_token`, `access_token`, `Bearer ...` e `secret=` antes de gravar em logs ou exibir em telas de debug.
4. **Proteção Rigorosa contra SSRF**:
   - O `ExternalRequestPolicy` valida cada URL externa contra uma lista estrita de hostnames oficiais (`api.telegram.org`, `graph.facebook.com`, `discord.com`, `api.mercadolibre.com`, `open-api.affiliate.shopee.com.br`, `webservices.amazon.com.br`).
   - Bloqueia loopbacks (`127.0.0.1`, `localhost`), IPs de rede interna (`10.0.0.0/8`, `192.168.0.0/16`), metadados de nuvem (`169.254.169.254`) e protocolos não-HTTP.

---

## 4. Pipeline de Ingestão de Webhooks

1. **Recepção do Endpoint**: `/api/webhooks/[provider]/[connectionId]`
2. **Validação Criptográfica de Assinatura**:
   - Telegram: validação do header `X-Telegram-Bot-Api-Secret-Token`.
   - WhatsApp Meta: validação timing-safe do header `X-Hub-Signature-256` contra o `App Secret`.
3. **Idempotência Garantida (Chave Única 24h)**:
   - Deduplicação via `IntegrationIdempotencyService.recordEvent`.
   - Eventos repetidos retornam status `IGNORED` e `isDuplicate: true`, impedindo duplicidade de conversões e disparos.
4. **Roteamento & Normalização**:
   - Converte o payload proprietário do provedor em `NormalizedIntegrationEvent`.
   - Se for um evento de pedido/conversão, alimenta automaticamente o `AnalyticsService` marcando `source: "real"`.
5. **Replay Seguro**:
   - Endpoint `/api/integrations/events/[id]/replay` permite aos operadores reexecutar eventos históricos de webhook mantendo auditoria completa.

---

## 5. Resultados de Validação

- **Testes Automatizados**: 68/68 testes aprovados em 5 suítes (`phase7.test.ts` 100% verde).
- **Compilação de Produção**: 37 rotas estáticas e dinâmicas compiladas com sucesso sem erros de tipagem.
