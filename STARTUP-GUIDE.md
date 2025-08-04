# 🚀 MY-WA-API - Guia de Inicialização Rápida

## 📋 Resumo do Problema Resolvido

### Problema Original

- ❌ Docker Desktop com problemas de conectividade
- ❌ Frontend tentando acessar endpoint inexistente (`/api/instances-v2/all`)
- ❌ Middleware de autenticação bloqueando desenvolvimento
- ❌ Formato de resposta incompatível entre backend e frontend

### ✅ Soluções Implementadas

- ✅ Migração para SQLite (sem dependência do Docker)
- ✅ Correção do endpoint para `/api/instances`
- ✅ Middleware de autenticação flexível para desenvolvimento
- ✅ Login com Google OAuth implementado
- ✅ Scripts de inicialização automatizados

## 🎯 Como Usar

### Opção 1: Inicialização Automática (Recomendada)

```bash
# Inicia backend e frontend automaticamente
./start-all.bat
```

### Opção 2: Inicialização Manual

```bash
# Terminal 1 - Backend
./start-backend.bat

# Terminal 2 - Frontend
./start-frontend.bat
```

### Opção 3: Usando NPM

```bash
# Na raiz do projeto
npm run dev  # Inicia tudo com turbo
```

## 🌐 URLs Importantes

| Serviço          | URL                             | Descrição            |
| ---------------- | ------------------------------- | -------------------- |
| **Frontend**     | http://localhost:3001           | Interface principal  |
| **Login**        | http://localhost:3001/login     | Página de login      |
| **Dashboard**    | http://localhost:3001/dashboard | Painel de controle   |
| **Backend API**  | http://localhost:3000/api       | API REST             |
| **Health Check** | http://localhost:3000/health    | Status dos serviços  |
| **API Docs**     | http://localhost:3000/api-docs  | Documentação Swagger |

## 🔐 Sistema de Autenticação

### Login Tradicional (Desenvolvimento)

- Use qualquer email e senha
- Exemplo: `admin@test.com` / `123456`

### Login com Google OAuth

1. Clique no botão "Continuar com Google"
2. Autorize a aplicação no Google
3. Será redirecionado automaticamente

## 🧪 Testando a API

### Listar Instâncias

```bash
curl http://localhost:3001/api/instances
```

### Criar Nova Instância

```bash
curl -X POST http://localhost:3001/api/instances \
  -H "Content-Type: application/json" \
  -d '{"name": "Minha Instância"}'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## 📁 Estrutura do Projeto

```
My-WA-API/
├── apps/
│   ├── api/           # Backend Express + SQLite
│   └── web/           # Frontend Next.js
├── start-all.bat      # Inicia tudo
├── start-backend.bat  # Inicia só o backend
└── start-frontend.bat # Inicia só o frontend
```

## 🔧 Configuração

### Backend (.env)

- `PORT=3000`
- `DATABASE_URL=./data/database.sqlite`
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (para OAuth)

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL=http://localhost:3000`
- `NEXTAUTH_URL=http://localhost:3001`

## 🐛 Solução de Problemas

### Backend não inicia

1. Verifique se a porta 3000 está livre: `netstat -ano | findstr :3000`
2. Mate processos conflitantes: `taskkill /PID <PID> /F`
3. Reinstale dependências: `cd apps/api && npm install`

### Frontend não conecta

1. Verifique se o backend está rodando
2. Teste o health check: `curl http://localhost:3000/health`
3. Verifique as variáveis de ambiente

### Login Google não funciona

1. Verifique as credenciais OAuth no Google Console
2. Confirme as URLs de callback
3. Verifique se HTTPS está configurado em produção

## 📊 Status dos Serviços

| Componente            | Status            | Observações                |
| --------------------- | ----------------- | -------------------------- |
| Backend Express       | ✅ Funcionando    | Porta 3000, SQLite         |
| Frontend Next.js      | ✅ Funcionando    | Porta 3001                 |
| Autenticação          | ✅ Funcionando    | Tradicional + Google OAuth |
| Criação de Instâncias | ✅ Funcionando    | POST /api/instances        |
| Health Checks         | ✅ Funcionando    | Monitoramento ativo        |
| Docker                | ❌ Não necessário | Usando SQLite local        |

## 🎉 Próximos Passos

1. **Implementar funcionalidades do WhatsApp**
   - Geração de QR Code
   - Envio de mensagens
   - Webhook handling

2. **Melhorar autenticação**
   - Implementar JWT refresh tokens
   - Sistema de permissões

3. **Deploy em produção**
   - Configurar HTTPS
   - Banco de dados PostgreSQL
   - Docker containers

---

**✅ Sistema funcionando corretamente!**
Para qualquer problema, consulte os logs dos serviços ou verifique a documentação da API em http://localhost:3000/api-docs
