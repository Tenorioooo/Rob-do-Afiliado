# Arquitetura e Ingestão de Webhooks Reais

A ingestão de webhooks do **Robô do Afiliado** é construída para operar 24 horas por dia com alta resiliência, validação criptográfica estrita e garantia de zero duplicidade (idempotência).

---

## 1. Endpoints de Recepção de Webhooks

| Provedor | Método HTTP | URL do Endpoint | Header de Autenticação / Assinatura |
| :--- | :--- | :--- | :--- |
| **Telegram** | `POST` | `/api/webhooks/telegram/[connectionId]` | `X-Telegram-Bot-Api-Secret-Token` |
| **Discord** | `POST` | `/api/webhooks/discord/[connectionId]` | `X-Signature-Ed25519` & `X-Signature-Timestamp` |
| **WhatsApp Meta** | `GET` (Verificação) & `POST` (Eventos) | `/api/webhooks/whatsapp/[connectionId]` | `X-Hub-Signature-256` (SHA-256 HMAC) |
| **Mercado Livre** | `POST` | `/api/webhooks/mercadolivre/[connectionId]` | `X-Topic` & OAuth Bearer verification |

---

## 2. Fluxo do Pipeline de Ingestão (`WebhookPipeline`)

```
[Requisição Externa do Provedor]
              │
              ▼
    1. Validação de Assinatura Criptográfica
       (Timing-Safe Compare / Token Match)
              │
              ├── [Invalido] ──> Resposta HTTP 403 / 400 + Log de Auditoria
              │
              ▼ [Válido]
    2. Extração do Identificador Externo do Evento
       (ex: update_id, message_id, order_id)
              │
              ▼
    3. Verificação de Idempotência (IntegrationIdempotencyService)
              │
              ├── [Já Processado / Duplicado] ──> Status IGNORED (HTTP 200 OK)
              │
              ▼ [Novo Evento]
    4. Gravação do IntegrationEvent (Status: PROCESSED)
              │
              ▼
    5. Normalização para NormalizedIntegrationEvent
              │
              ▼
    6. Roteamento de Negócio
       • Conversão de Venda ──> AnalyticsService.recordConversion(source: 'real')
       • Atualização de Preço ──> ProductSnapshot / Radar
```

---

## 3. Gestão e Replay de Eventos

Na página **/integrations/webhooks**, operadores e usuários podem:
* Inspecionar o JSON completo de qualquer payload e cabeçalho recebido.
* Filtrar por Provedor (`telegram`, `whatsapp`, `discord`, `mercadolivre`, `shopee`) e Status (`PROCESSED`, `IGNORED`, `FAILED`, `PENDING`).
* Acionar o **Replay Seguro** de um evento caso tenha havido indisponibilidade temporária de processamento em downstream.
