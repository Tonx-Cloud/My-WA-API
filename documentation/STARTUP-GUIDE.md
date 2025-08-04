# ðŸš€ MY-WA-API - Guia de InicializaÃ§Ã£o RÃ¡pida

## ðŸ“‹ Resumo do Problema Resolvido

### Problema Original

- âŒ Docker Desktop com problemas de conectividade
- âŒ Frontend tentando acessar endpoint inexistente (`/api/instances-v2/all`)
- âŒ Middleware de autenticaÃ§Ã£o bloqueando desenvolvimento
- âŒ Formato de resposta incompatÃ­vel entre backend e frontend

### âœ… SoluÃ§Ãµes Implementadas

- âœ… MigraÃ§Ã£o para SQLite (sem dependÃªncia do Docker)
- âœ… CorreÃ§Ã£o do endpoint para `/api/instances`
- âœ… Middleware de autenticaÃ§Ã£o flexÃ­vel para desenvolvimento
- âœ… Login com Google OAuth implementado
- âœ… Scripts de inicializaÃ§Ã£o automatizados

## ðŸŽ¯ Como Usar

### OpÃ§Ã£o 1: InicializaÃ§Ã£o AutomÃ¡tica (Recomendada)

```bash
# Inicia backend e frontend automaticamente
./start-all.bat
```

### OpÃ§Ã£o 2: InicializaÃ§Ã£o Manual

```bash
# Terminal 1 - Backend
./start-backend.bat

# Terminal 2 - Frontend
./start-frontend.bat
```

### OpÃ§Ã£o 3: Usando NPM

```bash
# Na raiz do projeto
npm run dev  # Inicia tudo com turbo
```

## ðŸŒ URLs Importantes

| ServiÃ§o          | URL                             | DescriÃ§Ã£o            |
| ---------------- | ------------------------------- | -------------------- |
| **Frontend**     | http://localhost:3001           | Interface principal  |
| **Login**        | http://localhost:3001/login     | PÃ¡gina de login      |
| **Dashboard**    | http://localhost:3001/dashboard | Painel de controle   |
| **Backend API**  | http://localhost:3000/api       | API REST             |
| **Health Check** | http://localhost:3000/health    | Status dos serviÃ§os  |
| **API Docs**     | http://localhost:3000/api-docs  | DocumentaÃ§Ã£o Swagger |

## ðŸ” Sistema de AutenticaÃ§Ã£o

### Login Tradicional (Desenvolvimento)

- Use qualquer email e senha
- Exemplo: `admin@test.com` / `123456`

### Login com Google OAuth

1. Clique no botÃ£o "Continuar com Google"
2. Autorize a aplicaÃ§Ã£o no Google
3. SerÃ¡ redirecionado automaticamente

## ðŸ§ª Testando a API

### Listar InstÃ¢ncias

```bash
curl http://localhost:3001/api/instances
```

### Criar Nova InstÃ¢ncia

```bash
curl -X POST http://localhost:3001/api/instances \
  -H "Content-Type: application/json" \
  -d '{"name": "Minha InstÃ¢ncia"}'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## ðŸ“ Estrutura do Projeto

```
My-WA-API/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/           # Backend Express + SQLite
â”‚   â””â”€â”€ web/           # Frontend Next.js
â”œâ”€â”€ start-all.bat      # Inicia tudo
â”œâ”€â”€ start-backend.bat  # Inicia sÃ³ o backend
â””â”€â”€ start-frontend.bat # Inicia sÃ³ o frontend
```

## ðŸ”§ ConfiguraÃ§Ã£o

### Backend (.env)

- `PORT=3000`
- `DATABASE_URL=./data/database.sqlite`
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (para OAuth)

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL=http://localhost:3000`
- `NEXTAUTH_URL=http://localhost:3001`

## ðŸ› SoluÃ§Ã£o de Problemas

### Backend nÃ£o inicia

1. Verifique se a porta 3000 estÃ¡ livre: `netstat -ano | findstr :3000`
2. Mate processos conflitantes: `taskkill /PID <PID> /F`
3. Reinstale dependÃªncias: `cd apps/api && npm install`

### Frontend nÃ£o conecta

1. Verifique se o backend estÃ¡ rodando
2. Teste o health check: `curl http://localhost:3000/health`
3. Verifique as variÃ¡veis de ambiente

### Login Google nÃ£o funciona

1. Verifique as credenciais OAuth no Google Console
2. Confirme as URLs de callback
3. Verifique se HTTPS estÃ¡ configurado em produÃ§Ã£o

## ðŸ“Š Status dos ServiÃ§os

| Componente            | Status            | ObservaÃ§Ãµes                |
| --------------------- | ----------------- | -------------------------- |
| Backend Express       | âœ… Funcionando    | Porta 3000, SQLite         |
| Frontend Next.js      | âœ… Funcionando    | Porta 3001                 |
| AutenticaÃ§Ã£o          | âœ… Funcionando    | Tradicional + Google OAuth |
| CriaÃ§Ã£o de InstÃ¢ncias | âœ… Funcionando    | POST /api/instances        |
| Health Checks         | âœ… Funcionando    | Monitoramento ativo        |
| Docker                | âŒ NÃ£o necessÃ¡rio | Usando SQLite local        |

## ðŸŽ‰ PrÃ³ximos Passos

1. **Implementar funcionalidades do WhatsApp**
   - GeraÃ§Ã£o de QR Code
   - Envio de mensagens
   - Webhook handling

2. **Melhorar autenticaÃ§Ã£o**
   - Implementar JWT refresh tokens
   - Sistema de permissÃµes

3. **Deploy em produÃ§Ã£o**
   - Configurar HTTPS
   - Banco de dados PostgreSQL
   - Docker containers

---

**âœ… Sistema funcionando corretamente!**
Para qualquer problema, consulte os logs dos serviÃ§os ou verifique a documentaÃ§Ã£o da API em http://localhost:3000/api-docs