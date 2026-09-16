# Auditoria Técnica das Integrações Reais — Fase 7.1

## Visão Geral

Este documento consolida a auditoria técnica, homologação e diretrizes de ativação segura das integrações externas do SaaS **Affiliate AI / Robô do Afiliado**.

Seguindo as diretrizes de anti-fabricação e fidelidade estrita às APIs oficiais:
- **NENHUM** adapter mock é declarado como real.
- **NENHUM** endpoint inexistente é inventado.
- Todas as capacidades foram auditadas contra a documentação oficial dos provedores.

---

## 1. Matriz de Homologação por Provedor

| Provedor | Tipo | Status de Homologação | Método de Autenticação | API Oficial Confirmada | Disponibilidade Brasil |
|---|---|---|---|---|---|
| **Telegram** | Canal | `HOMOLOGADO` / `REQUIRES_CREDENTIALS` | Bot Token | Sim (Bot API) | Sim |
| **Discord** | Canal | `HOMOLOGADO` / `REQUIRES_CREDENTIALS` | Webhook URL / Bot Token | Sim (v10 / Webhooks) | Sim |
| **WhatsApp Meta** | Canal | `REQUIRES_APPROVAL` | Bearer Token / Graph API | Sim (Cloud API v21.0) | Sim |
| **Mercado Livre** | Marketplace | `HOMOLOGADO` (Catálogo/Webhooks) | OAuth 2.0 (Auth Code) | Sim (Developers API) | Sim (MLB) |
| **Shopee** | Marketplace | `REQUIRES_APPROVAL` | HMAC-SHA256 | Sim (Affiliate GraphQL) | Sim |
| **Amazon** | Marketplace | `REQUIRES_APPROVAL` | AWS SigV4 | Sim (PA-API 5.0) | Sim (BR) |

---

## 2. Detalhamento Técnico por Provedor

### 2.1 Telegram Bot API
- **Portal Oficial**: [@BotFather](https://t.me/BotFather)
- **Documentação**: [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api)
- **Tipo de Conta**: Gratuita / Bot criado via BotFather.
- **Capacidades Homologadas**:
  - `SEND_MESSAGE`: POST para `https://api.telegram.org/bot<token>/sendMessage` (HTML/Markdown).
  - `SEND_MEDIA`: POST para `https://api.telegram.org/bot<token>/sendPhoto`.
  - `WEBHOOKS`: POST para `https://api.telegram.org/bot<token>/setWebhook` com header `X-Telegram-Bot-Api-Secret-Token`.
  - `HEALTH_CHECK`: GET para `https://api.telegram.org/bot<token>/getMe`.
- **Limitações & Rate Limits**: 4096 caracteres por mensagem; ~30 msg/s global.

---

### 2.2 Discord Webhook / Bot API
- **Portal Oficial**: [Discord Developer Portal](https://discord.com/developers/applications)
- **Documentação**: [https://discord.com/developers/docs/resources/webhook](https://discord.com/developers/docs/resources/webhook)
- **Tipo de Conta**: Gratuita / Servidor com permissão de Webhook.
- **Capacidades Homologadas**:
  - `SEND_MESSAGE`: POST para `https://discord.com/api/webhooks/{id}/{token}` com embeds ricos.
  - `BOT_MESSAGES`: POST para `https://discord.com/api/v10/channels/{channel.id}/messages` com `Authorization: Bot <token>`.
  - `HEALTH_CHECK`: GET na URL do Webhook retorna metadados do canal sem disparar mensagem.
- **Limitações & Rate Limits**: 5 requisições por 2 segundos por webhook; Webhooks são unidirecionais.

---

### 2.3 WhatsApp Meta Cloud API (Oficial)
- **Portal Oficial**: [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api)
- **Documentação**: [https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- **Tipo de Conta Requerida**: Conta WhatsApp Business (WABA), App Meta Developers aprovado e Phone Number ID verificado.
- **Capacidades Homologadas**:
  - `SEND_MESSAGE`: POST para `https://graph.facebook.com/v21.0/{phone_number_id}/messages`.
  - `WEBHOOKS`: Subscrição com verificação GET (`hub.verify_token`) e POST com assinatura HMAC-SHA256 (`X-Hub-Signature-256`).
  - `HEALTH_CHECK`: GET para `https://graph.facebook.com/v21.0/{phone_number_id}` para aferição de `quality_rating` e `verified_name`.
- **Limitações & Políticas**: Mensagens fora da janela de 24h exigem Message Templates aprovados pela Meta.

---

### 2.4 Mercado Livre Developers
- **Portal Oficial**: [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
- **Documentação**: [https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)
- **Tipo de Conta**: Aplicação no portal de desenvolvedores do Mercado Livre.
- **Capacidades Homologadas**:
  - `OAUTH2`: Authorization Code Flow com troca para `access_token` (validade 6h) e `refresh_token`.
  - `READ_PRODUCTS`: GET para `https://api.mercadolibre.com/sites/MLB/search?q={query}`.
  - `WEBHOOKS`: Callback para tópicos como `orders_v2` e `items`.
- **Ressalva Crítica sobre Afiliados**:
  - O programa de afiliados do Mercado Livre opera por portal separado ([mercadolivre.com.br/afiliados](https://www.mercadolivre.com.br/afiliados)) e **NÃO** disponibiliza API REST aberta para geração de deep links parametrizados via Developers API. A capacidade `GENERATE_AFFILIATE_LINK` está classificada como `UNVERIFIED` no registry para manter total integridade técnica.

---

### 2.5 Shopee Affiliate Open API
- **Portal Oficial**: [Shopee Affiliate Program](https://affiliate.shopee.com.br/)
- **Documentação**: [https://open-api.affiliate.shopee.com.br/](https://open-api.affiliate.shopee.com.br/)
- **Tipo de Conta Requerida**: Conta aprovada no Shopee Affiliate Program com emissão de `AppId` e `SecretKey`.
- **Capacidades Homologadas**:
  - `GENERATE_AFFILIATE_LINK`: Mutation GraphQL `generateShortLink` com assinatura HMAC-SHA256 (`Authorization: SHA256 Credential=...`).
  - `READ_PRODUCTS`: Query GraphQL `productOfferV2`.
  - `READ_COMMISSION`: Query GraphQL `conversionReport`.
- **Status**: `REQUIRES_APPROVAL` (depende de aprovação comercial prévia pela Shopee).

---

### 2.6 Amazon Associates PA-API 5.0
- **Portal Oficial**: [Amazon Associados Brasil](https://associados.amazon.com.br/)
- **Documentação**: [https://webservices.amazon.com/paapi5/documentation/](https://webservices.amazon.com/paapi5/documentation/)
- **Tipo de Conta Requerida**: Conta Amazon Associados com PA-API liberada (**mínimo de 3 vendas qualificadas e faturadas nos primeiros 180 dias**).
- **Capacidades Homologadas**:
  - `READ_PRODUCTS`: Operação `SearchItems` em `https://webservices.amazon.com.br/paapi5/searchitems` com AWS Signature Version 4 (`AWS4-HMAC-SHA256`).
  - `READ_PRICES` / `READ_DISCOUNTS`: Operação `GetItems` com recursos `Offers.Listings.Price` e `ItemInfo.Title`.
- **Limitações & Políticas**: Cache de preços máximo de 24 horas; rate limits atrelados ao faturamento gerado.

---

## 3. Preflight Diagnostics & Segurança SSRF

O sistema executa checagens prévias não-destrutivas (`IntegrationPreflightService`) antes de qualquer disparo real:
1. **Verificação de Registro**: Validação contra o `ProviderCapabilityAuditRegistry`.
2. **Políticas de Aprovação**: Alerta sobre pré-requisitos de aprovação (WABA, 3 vendas, credenciamento).
3. **Presença de Credenciais**: Impede requisições com chaves vazias.
4. **Validação Estrutural e Sintática**: Regex de tokens (ex.: `^[0-9]{8,12}:[a-zA-Z0-9_-]{30,50}$` para Telegram).
5. **Proteção SSRF**: Checagem de hostnames contra allowlist estrita (`api.telegram.org`, `discord.com`, `graph.facebook.com`, `api.mercadolibre.com`, `open-api.affiliate.shopee.com.br`, `webservices.amazon.com.br`). Bloqueia IPs privados, AWS IMDS (169.254.169.254), e domínios não autorizados.
6. **Ping Não-Destrutivo**: Validação leve de identidade (`getMe`, GET webhook, etc.) sem disparo de mensagens de spam.

---

## 4. Isolamento Mock vs Real

- Toda chamada ou evento gerado por simuladores é gravado com `source: "mock"`.
- O Autopiloto e os relatórios de conversão em modo de produção filtram estritamente `source: "real"`.
- Ambientes de teste nunca poluem o aprendizado contínuo do robô.
