# My-wa-API - Scripts de Gerenciamento

Este diretÃ³rio contÃ©m scripts PowerShell para gerenciar os serviÃ§os do My-wa-API.

## Scripts DisponÃ­veis

### ðŸš€ InicializaÃ§Ã£o Completa

```powershell
.\scripts\start-all.ps1
```

- Inicia backend e frontend
- Verifica dependÃªncias
- Configura ambiente completo
- Exibe URLs e status

### ðŸ›‘ Parar Todos os ServiÃ§os

```powershell
.\scripts\stop-all.ps1
```

- Para todos os processos Node.js
- Libera portas 3000 e 3001
- Limpa recursos

### ðŸ”„ ReinicializaÃ§Ã£o Completa

```powershell
.\scripts\restart-all.ps1
```

- Para todos os serviÃ§os
- Aguarda limpeza
- Inicia tudo novamente

### ðŸ“Š Verificar Status

```powershell
.\scripts\status.ps1
```

- Mostra status dos serviÃ§os
- Lista processos ativos
- Testa conectividade
- Exibe URLs disponÃ­veis

### ðŸ”§ Desenvolvimento Individual

#### Backend apenas:

```powershell
.\scripts\start-backend.ps1
```

#### Frontend apenas:

```powershell
.\scripts\start-frontend.ps1
```

## URLs dos ServiÃ§os

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **DocumentaÃ§Ã£o**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Requisitos

- Windows PowerShell 5.1+ ou PowerShell Core
- Node.js 18+
- NPM

## Troubleshooting

### Problemas de Porta

Se as portas estiverem em uso:

```powershell
.\scripts\stop-all.ps1
```

### Problemas de DependÃªncias

Os scripts verificam e instalam dependÃªncias automaticamente.

### Verificar Status

Para diagnÃ³stico:

```powershell
.\scripts\status.ps1
```