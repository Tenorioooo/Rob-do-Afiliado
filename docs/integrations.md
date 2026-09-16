# Guia de Configuração de Integrações Externas & APIs Oficiais

Este documento orienta o usuário e o administrador a conectar cada uma das plataformas oficiais suportadas na **Central de Conexões** (`/integrations`).

---

## 1. Telegram Bot API

### Capacidades Suportadas
* Envio de mensagens formatadas em HTML/Markdown
* Envio de imagens e banners de ofertas
* Webhooks para interação e comandos de usuários

### Passo a Passo para Obter Credenciais
1. Abra o Telegram e inicie uma conversa com o `@BotFather`.
2. Digite `/newbot` e siga as instruções para definir o nome e username do seu bot.
3. Copie o **HTTP API Bot Token** gerado (formato: `123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ`).
4. Na Central de Conexões do Robô do Afiliado, clique em **Conectar Telegram** e cole o Bot Token.
5. Adicione o bot como **Administrador** no seu canal ou grupo de promoções para permitir postagem de mensagens.

---

## 2. Discord (Incoming Webhooks & Bot API)

### Capacidades Suportadas
* Publicação de cards ricos (Embeds com imagem, botões e preço) via Webhooks
* Envio direto via Bot REST API v10 para canais específicos

### Passo a Passo para Configurar Webhook
1. No seu servidor Discord, clique com o botão direito no canal de ofertas desejado e vá em **Editar Canal** > **Integrações** > **Webhooks**.
2. Clique em **Novo Webhook**, defina o nome e copie a **URL do Webhook**.
3. Na Central de Conexões, cole a URL no campo `webhookUrl`.

---

## 3. WhatsApp Meta Cloud API (Oficial)

### Capacidades Suportadas
* Envio de mensagens de texto e mídia com alta entregabilidade
* Webhook oficial para notificações de status de entrega (`sent`, `delivered`, `read`)

### Passo a Passo para Obter Credenciais
1. Acesse o portal [Meta for Developers](https://developers.facebook.com/) e crie um App do tipo **Negócios**.
2. No painel do WhatsApp Cloud API, obtenha:
   * **Phone Number ID**: ID numérico do número de telefone configurado.
   * **Permanent Access Token**: Token de usuário do sistema gerado no Gerenciador de Negócios.
   * **App Secret**: Chave secreta do aplicativo para validação HMAC do Webhook.
3. Cole as credenciais no modal de conexão do WhatsApp.
4. No painel da Meta, configure a URL de Callback do Webhook fornecida na página de detalhes da conexão e o `Verify Token`.

---

## 4. Shopee Affiliate Open API

### Capacidades Suportadas
* Geração automática de links curtos de afiliado monetizados (`generateShortLink`)
* Busca de produtos em promoção e comissões do programa de afiliados

### Passo a Passo para Obter Credenciais
1. Cadastre-se e obtenha aprovação no [Shopee Affiliate Open API Platform](https://open-api.affiliate.shopee.com.br/).
2. Copie seu **App ID** e **API Secret Key**.
3. Na Central de Conexões, selecione Shopee e insira seu `App ID` e `Secret Key`.

---

## 5. Mercado Livre Developers (OAuth 2.0)

### Capacidades Suportadas
* Busca de produtos oficiais via API de Busca (`/sites/MLB/search`)
* Leitura de status de anúncios e preços
* Recebimento de Webhooks oficiais de alteração de preços e pedidos

### Passo a Passo de Conexão
1. Crie uma aplicação no [Mercado Livre Developers](https://developers.mercadolivre.com.br/).
2. Configure a URL de Redirecionamento autorizada para:
   `https://seu-dominio.com/api/integrations/oauth/mercadolivre/callback`
3. Insira o seu `App ID` na Central de Conexões e clique em **Autorizar via OAuth 2.0**.
4. Faça login na sua conta do Mercado Livre e confirme a autorização.

---

## 6. Amazon Associates (PA-API 5.0)

### Capacidades Suportadas
* Busca de produtos, títulos, preços e imagens em alta resolução
* Atribuição via `Associate Tag` / `Partner Tag`

### Passo a Passo de Conexão
1. No portal do [Amazon Associates](https://affiliate-program.amazon.com.br/), acesse **Ferramentas** > **API de Publicidade de Produtos**.
2. Gere seu par de chaves **Access Key ID** e **Secret Access Key**.
3. Cadastre as credenciais informando sua `Associate Tag` (ex: `meusite-20`).
