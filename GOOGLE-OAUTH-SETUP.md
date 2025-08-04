# 🔐 Guia de Configuração Google OAuth - MY-WA-API

## 🚨 Erro Atual
```
Erro 401: deleted_client
The OAuth client was deleted.
```

## 🔧 Solução Passo a Passo

### 1. Acesse o Google Cloud Console
- URL: https://console.cloud.google.com/
- Login: hiltonsf@gmail.com

### 2. Criar/Selecionar Projeto
```
1. No topo da página, clique no seletor de projeto
2. Clique em "Novo Projeto" ou selecione um existente
3. Nome sugerido: "my-wa-api" ou "whatsapp-automation"
4. Clique em "Criar"
```

### 3. Ativar APIs Necessárias
```
1. Vá para "APIs e Serviços" > "Biblioteca"
2. Procure por "Google+ API" ou "People API"
3. Clique em "Ativar"
```

### 4. Configurar Tela de Consentimento OAuth
```
1. Vá para "APIs e Serviços" > "Tela de consentimento OAuth"
2. Selecione "Externo" (para testes)
3. Preencha os campos obrigatórios:
   - Nome do aplicativo: "My WA API"
   - Email de suporte: hiltonsf@gmail.com
   - Domínios autorizados: localhost
4. Clique em "Salvar e continuar"
```

### 5. Criar Credenciais OAuth 2.0
```
1. Vá para "APIs e Serviços" > "Credenciais"
2. Clique em "+ Criar Credenciais" > "ID do cliente OAuth 2.0"
3. Tipo de aplicativo: "Aplicativo da Web"
4. Nome: "My WA API Client"

5. Origens JavaScript autorizadas:
   - http://localhost:3001
   - http://localhost:3000

6. URIs de redirecionamento autorizados:
   - http://localhost:3000/api/auth/google/callback
   - http://localhost:3001/api/auth/callback

7. Clique em "Criar"
```

### 6. Copiar Novas Credenciais
Após criar, você verá uma janela popup com:
```
Client ID: 123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
Client Secret: GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 7. Atualizar Arquivo .env
Substitua no arquivo `apps/api/.env`:
```env
# OAuth Google (NOVAS CREDENCIAIS)
GOOGLE_CLIENT_ID=SEU_NOVO_CLIENT_ID_AQUI
GOOGLE_CLIENT_SECRET=SEU_NOVO_CLIENT_SECRET_AQUI
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 8. Reiniciar Servidor
```bash
# Parar o servidor backend (Ctrl+C no terminal)
# Reiniciar:
cd apps/api
npm run dev
```

## ✅ Teste Final
1. Acesse: http://localhost:3001/login
2. Clique em "Continuar com Google"
3. Deve redirecionar para Google OAuth normalmente

## 🔍 Solução de Problemas

### Se ainda der erro 401:
1. Verifique se as URLs de callback estão corretas
2. Aguarde alguns minutos para propagação
3. Teste em janela anônima do navegador

### Se der erro de domínio:
1. Adicione localhost na lista de domínios autorizados
2. Verifique se as origens JavaScript incluem ambas as portas

### Para produção:
1. Altere URLs para seu domínio real
2. Configure HTTPS obrigatório
3. Revise escopos de permissão

---

📝 **Nota**: Mantenha as credenciais seguras e nunca as commite no Git!
