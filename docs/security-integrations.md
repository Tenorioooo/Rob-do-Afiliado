# Segurança em Integrações Externas & Proteção de Dados

A segurança de credenciais e a prevenção de exploração de vulnerabilidades de rede (SSRF) são pilares fundamentais da **Fase 7**.

---

## 1. Criptografia em Repouso com AES-256-GCM

* **Algoritmo**: `aes-256-gcm` autenticado.
* **Vetor de Inicialização (IV)**: 12 bytes gerados aleatoriamente com `crypto.randomBytes` para cada registro.
* **Tag de Autenticação**: 16 bytes de integridade (GCM Auth Tag) para garantir que os dados não foram adulterados em repouso.
* **Chave Mestra**: Derivada a partir de `INTEGRATION_ENCRYPTION_KEY` usando função hash SHA-256.
* **Estrutura de Armazenamento**: `ivHex:authTagHex:encryptedHex` armazenado no campo `encryptedCredentials` do banco de dados.

---

## 2. Política Estrita de Proteção SSRF (`ExternalRequestPolicy`)

Para impedir que a aplicação seja manipulada para realizar requisições contra recursos da infraestrutura local ou servidores internos, todas as saídas HTTP utilizam a política de verificação:

### Endpoints Permitidos (Allowlist Estrita)
* `api.telegram.org` (Telegram Bot API)
* `discord.com` e `discordapp.com` (Discord Webhooks & REST API)
* `graph.facebook.com` (WhatsApp Meta Cloud API)
* `api.mercadolibre.com` e `auth.mercadolivre.com.br` (Mercado Livre API & OAuth)
* `open-api.affiliate.shopee.com.br` (Shopee Affiliate Open API)
* `webservices.amazon.com.br` e `webservices.amazon.com` (Amazon PA-API 5.0)

### Bloqueios Automáticos
* Qualquer endereço IP literal (ex: `127.0.0.1`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`).
* Hostnames locais ou reservados (`localhost`, `*.local`, `*.internal`).
* Protocolos inseguros ou não-HTTP (`file://`, `ftp://`, `gopher://`).
* Portas não padronizadas.

---

## 3. Sanitização e Proteção contra Vazamentos

* **Máscara de Visualização**: As credenciais nunca retornam em texto plano para o frontend. Campos sensíveis retornam mascarados (ex: `••••••••7F2A`).
* **Redação de Logs**: Todos os logs de auditoria e mensagens de erro passam pelo método `CredentialService.redactLog`, que remove automaticamente tokens e segredos antes da gravação.
