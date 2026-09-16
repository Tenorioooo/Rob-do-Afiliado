# Manual de Homologação Real: Telegram Bot API (Fase 7.3)

> **Projeto**: Affiliate AI / Robô do Afiliado  
> **Versão da API**: Telegram Bot API Oficial (`https://api.telegram.org`)  
> **Segurança**: Criptografia AES-256-GCM em repouso, SSRF Protection, Kill Switches

---

## 1. Visão Geral

A integração com o **Telegram** é a primeira integração de mensageria com suporte oficial a homologação real em produção. Toda a comunicação ocorre estritamente por meio da **Telegram Bot API oficial**, sem qualquer uso de scraping, bibliotecas não oficiais ou engenharia reversa.

---

## 2. Passo a Passo de Configuração Oficial no @BotFather

### Passo 1: Criação do Bot
1. Abra o Telegram e pesquise pelo bot oficial verificado: **`@BotFather`**.
2. Inicie a conversa enviando `/start`.
3. Crie um novo bot com o comando:
   ```text
   /newbot
   ```
4. Escolha um **Nome de Exibição** para seu bot (ex: *Afiliado AI Ofertas*).
5. Escolha um **Username** único terminado obrigatoriamente em `bot` (ex: *meu_afiliado_ofertas_bot*).
6. O `@BotFather` responderá com o seu **HTTP API Token** (formato: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567`).

---

### Passo 2: Configuração do Canal ou Grupo de Destino
1. No Telegram, crie ou abra o **Canal Público** ou **Grupo** onde deseja postar as ofertas.
2. Abra as configurações do Canal/Grupo > **Administradores** > **Adicionar Administrador**.
3. Busque pelo username do seu bot (ex: `@meu_afiliado_ofertas_bot`) e conceda permissão para **Postar Mensagens** (Post Messages).
4. **Obtendo o Destino (Chat ID ou @username)**:
   - Se o canal for **público**, você pode utilizar diretamente o `@username_do_canal` (ex: `@meu_canal_promos`).
   - Se o canal for **privado**, adicione o bot ao canal e envie uma mensagem de teste. O Chat ID terá o formato `-1001234567890`.

---

### Passo 3: Homologação no Painel do SaaS
Acesse o menu **Integrações** > selecione **Telegram** e siga os passos guiados:

1. **Credenciais**: Insira o **Bot Token** fornecido pelo `@BotFather`. Ele será criptografado via AES-256-GCM.
2. **Preflight**: O sistema executa verificações de DNS, conectividade TLS, SSRF e integridade do token.
3. **Health Check**: O sistema faz a chamada oficial `GET /bot<token>/getMe` e recupera o ID e username oficial do bot.
4. **Destino**: Informe o Chat ID numérico (`-100...`) ou o `@username` do canal.
5. **Teste de Envio Controlado**: Marque a caixa de confirmação explícita (`confirmed: true`) e dispare a mensagem de teste. O sistema registrará o `message_id` oficial retornado pelo Telegram.
6. **Webhook (Opcional)**: Clique em *Registrar Webhook Oficial* para cadastrar a URL com cabeçalho de proteção `X-Telegram-Bot-Api-Secret-Token`.
7. **Homologação Final**: Clique em **Homologar para VERIFIED_REAL**. A promoção só é aceita se todas as evidências físicas de verificação estiverem gravadas no banco de dados.

---

## 3. Arquitetura de Segurança e Proteção

* **Zero Token Exposto**: O token completo nunca é renderizado na tela do usuário ou logado em texto plano.
* **Validação de Webhook**: Toda atualização enviada pelo Telegram é validada via cabeçalho `X-Telegram-Bot-Api-Secret-Token` e deduplicada por `update_id`.
* **Kill Switch Global**: O disparo real em produção permanece desativado por padrão (`REAL_DISPATCH_ENABLED=false`).
* **Kill Switch Específico**: O switch individual `TELEGRAM_ENABLED=false` garante controle granular por provedor.

---

## 4. Solução de Problemas Comuns (Troubleshooting)

| Erro / Sintoma | Causa Provável | Solução |
| :--- | :--- | :--- |
| `401 Unauthorized` | Token incorreto ou revogado no BotFather. | Gere um novo token com `/token` no `@BotFather` e rotacione as credenciais no painel. |
| `400 Bad Request: chat not found` | O bot não foi adicionado ao canal ou o `@canal` está incorreto. | Verifique se o username do canal está correto e se o bot é membro/administrador. |
| `403 Forbidden: bot is not a member of the channel` | O bot foi adicionado mas não tem privilégios de administrador. | Acesse Administradores do Canal e adicione o bot como Administrador. |
| `400 Bad Request: can't parse entities` | Formatação HTML inválida no texto. | Use apenas tags HTML suportadas: `<b>`, `<i>`, `<a>`, `<code>`, `<pre>`. |
| `429 Too Many Requests: retry after X` | Rate limit da Telegram Bot API (máx 30 msgs/segundo). | O `ExternalRequestClient` aplicará backoff exponencial e retry automático. |
