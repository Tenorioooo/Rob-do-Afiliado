# Relatório de Prontidão para Produção (Production Readiness)

## Status Geral: **PRONTO PARA HOMOLOGAÇÃO COM CREDENCIAIS DE PRODUÇÃO**

O SaaS **Affiliate AI** atinge um nível de maturidade operacional e de segurança adequado para ambiente de produção, com isolamento estrito entre o ambiente mock de testes/desenvolvimento e o tráfego real.

---

## 1. Checklist de Confiabilidade e Segurança

| Requisito | Status | Mecanismo de Garantia |
| :--- | :--- | :--- |
| **Criptografia de Credenciais** | **APROVADO** | AES-256-GCM com IV aleatório e auth tag em `CredentialService` |
| **Proteção contra SSRF** | **APROVADO** | Resolução DNS e bloqueio de IPs privados/loopback via `assertSafeOutgoingUrl` |
| **Kill Switch Global** | **APROVADO** | `REAL_DISPATCH_ENABLED = false` por padrão em `.env` e em tempo de execução |
| **Kill Switches Individuais** | **APROVADO** | Controle por provedor (`TELEGRAM_ENABLED`, `DISCORD_ENABLED`, etc.) |
| **Parada de Emergência** | **APROVADO** | Invalidação atômica de fila e desativação global em um clique |
| **Envio de Teste Seguro** | **APROVADO** | Exigência de `confirmed: true` e payload prefixado com `[TESTE DE CONEXÃO]` |
| **Autopiloto Safety Gate** | **APROVADO** | Validação de limites diários, intervalo mínimo, horário e status `VERIFIED_REAL` |
| **Idempotência de Disparos** | **APROVADO** | Registro de `idempotencyKey` e bloqueio de duplicação em transações ACID |
| **Auditoria e Rastreabilidade** | **APROVADO** | Tabela `IntegrationAuditLog` registrando ações administrativas e operacionais |
| **Resiliência a Falhas** | **APROVADO** | Circuit Breaker (3 falhas -> OPEN -> 60s cooldown) e política de retry exponencial |

---

## 2. Guia de Ativação em Produção (Go-Live)

Para conectar uma conta ou canal em produção:

1. **Preencha o `.env` de Produção**:
   ```env
   REAL_DISPATCH_ENABLED="false"   # Inicie sempre com false
   ENCRYPTION_MASTER_KEY="<chave-hexadecimal-de-64-caracteres>"
   ```
2. **Acesse a Central de Conexões**:
   - Navegue até `/integrations`.
   - Escolha o canal desejado (ex: Telegram ou Discord).
3. **Execute o Pipeline**:
   - Insira o token ou webhook no formulário protegido.
   - Execute o **Preflight** para conferir conectividade.
   - Execute o **Health Check** para testar permissões com a API oficial.
   - Envie um **Envio de Teste Controlado** para o canal privado de testes.
   - Clique em **Homologar para VERIFIED_REAL**.
4. **Habilitar o Autopiloto**:
   - Ligue o interruptor **Permitir postagem pelo Autopiloto** na conexão.
   - No Dashboard ou em `/autopilot`, ative o robô no modo desejado (`SEMI_AUTO` ou `FULL_AUTO`).
   - Quando estiver seguro, alterne `REAL_DISPATCH_ENABLED="true"` no ambiente.
