# Guia de Preparação e Deploy em Produção na Vercel (PostgreSQL)

Este documento orienta o processo de deploy em produção do projeto **Robô do Afiliado** na plataforma **Vercel** utilizando banco de dados **PostgreSQL** (ex: Supabase, Neon, AWS RDS, Railway), preservando a integridade dos dados locais, chaves criptográficas e canais homologados.

---

## 1. Arquitetura em Produção

```text
┌─────────────────────────────────────────────────────────────┐
│                       INTERNET (HTTPS)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE & CDN                      │
│        (SSL Automático, Proteção DDoS, HTTP/2 & HTTP/3)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 NEXT.JS SERVERLESS FUNCTIONS                │
│       App Router (SSR/API Routes), Middleware, Security     │
│             SSRF Policy, AES-256-GCM Credential Vault       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PRISMA ORM CLIENT                       │
│           (Connection Pooling / PgBouncer / Accelerate)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                      │
│              (Tabelas Relacionais, Índices, UTC)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Variáveis de Ambiente Necessárias (Vercel Project Settings)

Configure as seguintes variáveis no painel da Vercel (**Settings > Environment Variables**):

| Nome da Variável | Finalidade | Exemplo de Valor (Não usar segredos em docs) |
| :--- | :--- | :--- |
| `NODE_ENV` | Modo de execução | `production` |
| `DATABASE_URL` | String de conexão PostgreSQL com pooling | `postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require` |
| `APP_PUBLIC_URL` | URL pública canônica da aplicação | `https://seu-dominio.vercel.app` |
| `NEXTAUTH_URL` | URL base para autenticação | `https://seu-dominio.vercel.app` |
| `JWT_SECRET` | Segredo para assinatura de tokens JWT | *(Chave segura aleatória de 64+ caracteres)* |
| `INTEGRATION_ENCRYPTION_KEY` | Chave mestra AES-256-GCM para credenciais | *(Mesma chave de 32 bytes usada no ambiente local)* |
| `REAL_DISPATCH_ENABLED` | Kill switch mestre de publicações externas | `false` (ou `true` quando liberado) |
| `TELEGRAM_ENABLED` | Kill switch específico do canal Telegram | `false` (ou `true` para liberar envios) |
| `MERCADOLIVRE_CLIENT_ID` | Client ID da aplicação no Mercado Livre | `1234567890123456` |
| `MERCADOLIVRE_CLIENT_SECRET` | Client Secret do Mercado Livre Developers | *(Chave secreta obtida no portal)* |
| `MERCADOLIVRE_REDIRECT_URI` | Callback oficial do Mercado Livre | `https://seu-dominio.vercel.app/api/integrations/oauth/mercadolivre/callback` |

---

## 3. Fluxo de Deploy

1. **Repositório GitHub:** Faça push do código para o repositório no GitHub.
2. **Importação na Vercel:** Conecte o repositório à Vercel. O framework Next.js é detectado automaticamente.
3. **Build Command:** O comando configurado no `package.json` e `vercel.json` é:
   ```bash
   prisma generate && next build
   ```
4. **Deploy:** A Vercel executa a compilação, otimização de rotas e disponibiliza o domínio HTTPS.

---

## 4. Execução de Migrations e Importação de Dados

### 4.1. Aplicar Estrutura no PostgreSQL Novo
Para criar todas as tabelas no banco de dados PostgreSQL de produção:
```bash
npx prisma migrate deploy
```
*Este comando aplica formalmente a migration `prisma/migrations/0_init/migration.sql` sem risco de perda de dados.*

### 4.2. Migrar Dados Existentes do SQLite para PostgreSQL
Caso deseje carregar o histórico local do SQLite (produtos, snapshots, configurações e histórico de publicação) para o PostgreSQL:
```bash
# 1. Exportar SQLite para dump JSON (já gerado em ./prisma/sqlite_dump.json):
npx tsx src/scripts/migrate-sqlite-to-postgres.ts export ./prisma/sqlite_dump.json

# 2. Importar para o PostgreSQL de produção:
DATABASE_URL="postgresql://user:password@host:5432/database" npx tsx src/scripts/migrate-sqlite-to-postgres.ts import ./prisma/sqlite_dump.json
```

---

## 5. Integrações Oficiais

### 5.1. Mercado Livre OAuth
- Cadastre a URL de Callback no portal Mercado Livre Developers:
  `https://seu-dominio.vercel.app/api/integrations/oauth/mercadolivre/callback`
- Ao conectar pela Central de Integrações, o fluxo oficial redirecionará para:
  `https://auth.mercadolivre.com.br/authorization`

### 5.2. Telegram Bot Webhook
- Após o deploy na Vercel com domínio HTTPS público, o webhook oficial do Telegram deve ser atualizado para:
  `https://seu-dominio.vercel.app/api/webhooks/telegram/{connectionId}`
- A integração do Telegram já homologada como `VERIFIED_REAL` (`@Teste12313Bot`) é preservada integralmente.

---

## 6. Governança e Segurança

1. **Criptografia AES-256-GCM:** Todas as credenciais de canais e tokens de marketplaces são criptografados em repouso no banco de dados. A variável `INTEGRATION_ENCRYPTION_KEY` deve ser idêntica entre os ambientes para permitir a leitura contínua.
2. **Proteção SSRF:** Chamadas externas para webhooks e provedores passam pelo `SSRFPolicy` e `ExternalRequestClient`, bloqueando IPs privados e loops locais.
3. **Idempotência & Dispatch Guard:** Cada publicação possui chave única de idempotência, impedindo envios duplicados em caso de retentativas.
4. **Emergency Stop & Kill Switches:** O operador pode acionar a Parada de Emergência a qualquer momento para cessar imediatamente todas as publicações ativas.
5. **Autopilot Governança:** O Autopilot permanece desativado por padrão (`enabled: false`, `automationMode: MANUAL`).
