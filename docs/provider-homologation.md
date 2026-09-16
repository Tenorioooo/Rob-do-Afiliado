# Matriz de Homologação e Capacidades de Provedores

Este documento audita oficialmente o nível de prontidão, suporte oficial e status de homologação de cada integração no **Affiliate AI**.

---

## 1. Classificação Geral de Provedores

| Provedor | Tipo | Método de Integração | Tipo de Autenticação | Nível de Suporte Oficial | Status de Produção |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Telegram** | Canal de Destino | Telegram Bot API | Bot Token (`BOT_TOKEN`) | Totalmente Oficial | `READY_FOR_CREDENTIALS` |
| **WhatsApp Cloud** | Canal de Destino | Meta Graph API v20.0 | System User Token + Phone ID | Totalmente Oficial | `READY_FOR_CREDENTIALS` |
| **Discord** | Canal de Destino | Discord Webhook API | Webhook URL (`WEBHOOK_URL`) | Totalmente Oficial | `READY_FOR_CREDENTIALS` |
| **Shopee** | Marketplace | Shopee Open Platform | AppID + Secret HMAC-SHA256 | Totalmente Oficial (Afiliados) | `READY_FOR_CREDENTIALS` |
| **Mercado Livre** | Marketplace | Mercado Livre Dev API | OAuth2 (Auth Code / Bearer) | Oficial (E-commerce / App) | `REQUIRES_OAUTH_FLOW` |
| **Amazon Brasil** | Marketplace | Creators API / PA-API | Access Key + Secret (AWS SigV4) | Oficial (Requer aprovação) | `REQUIRES_PARTNER_APPROVAL` |
| **WhatsApp Web (Puppeteer)** | Canal | Automação de Browser | N/A | **NÃO SUPORTADO / PROIBIDO** | `BLOCKED_SCRAPING` |
| **Instagram Scraping** | Canal | Sessão / Cookies | N/A | **NÃO SUPORTADO / PROIBIDO** | `BLOCKED_SCRAPING` |

---

## 2. Detalhes de Homologação por Provedor

### 2.1 Telegram (Canal/Grupo)
- **Documentação Oficial**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **Escopos**: `sendMessage`, `sendPhoto`
- **Diagnóstico Não-Destrutivo**: `GET https://api.telegram.org/bot<token>/getMe`
- **Segurança**:
  - Token mascarado via AES-256-GCM.
  - Rate limiting respeitado (máx. 30 msg/s global, 1 msg/s por chat).

### 2.2 WhatsApp Cloud API (Meta Graph API)
- **Documentação Oficial**: [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api)
- **Escopos**: `whatsapp_business_messaging`, `whatsapp_business_management`
- **Diagnóstico Não-Destrutivo**: `GET https://graph.facebook.com/v20.0/<phone_id>`
- **Segurança**:
  - Proteção contra custos indevidos com modelos de mensagem pré-aprovados ou janelas de 24h.
  - Test Send exige confirmação explícita de telefone de teste.

### 2.3 Discord (Canais/Fóruns)
- **Documentação Oficial**: [Discord Webhook API](https://discord.com/developers/docs/resources/webhook)
- **Diagnóstico Não-Destrutivo**: `GET https://discord.com/api/webhooks/<id>/<token>`
- **Segurança**:
  - Validação rigorosa de URL via SSRF Protection (`assertSafeOutgoingUrl`).
  - Suporte a embed rich cards com links de afiliado limpos.

### 2.4 Shopee Brasil
- **Documentação Oficial**: [Shopee Open API](https://open.shopee.com/)
- **Assinatura Criptográfica**: HMAC-SHA256 com timestamp em nanossegundos.
- **Diagnóstico Não-Destrutivo**: `GET /api/v2/public/get_shops_by_partner`
- **Segurança**:
  - Geração de links curtos com tag de afiliado rastreada e subIds.

### 2.5 Mercado Livre
- **Documentação Oficial**: [Mercado Libre Developers](https://developers.mercadolibre.com.br/)
- **Fluxo**: OAuth2 com troca de código de autorização e refresh token automático.
- **Diagnóstico Não-Destrutivo**: `GET https://api.mercadolibre.com/users/me`

### 2.6 Amazon Brasil
- **Documentação Oficial**: [Amazon Product Advertising API](https://affiliate-program.amazon.com/)
- **Fluxo**: AWS Signature Version 4.
- **Diagnóstico Não-Destrutivo**: `POST /paapi5/getitems` com item dummy.
- **Status**: Requer aprovação prévia de associado ativo na Amazon.

---

## 3. Diretriz Anti-Scraping e Conformidade
- O SaaS **não implementa e rejeita explicitamente** métodos não oficiais como automação por Chromium/Puppeteer de interfaces de usuário de mensagens ou scraping de HTML.
- Todas as operações reais são restritas a endpoints HTTPS oficiais com autenticação auditada.
