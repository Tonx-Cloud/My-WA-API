# My-wa-API - Scripts de Gerenciamento

Este diretório contém scripts PowerShell para gerenciar os serviços do My-wa-API.

## Scripts Disponíveis

### 🚀 Inicialização Completa

```powershell
.\scripts\start-all.ps1
```

- Inicia backend e frontend
- Verifica dependências
- Configura ambiente completo
- Exibe URLs e status

### 🛑 Parar Todos os Serviços

```powershell
.\scripts\stop-all.ps1
```

- Para todos os processos Node.js
- Libera portas 3000 e 3001
- Limpa recursos

### 🔄 Reinicialização Completa

```powershell
.\scripts\restart-all.ps1
```

- Para todos os serviços
- Aguarda limpeza
- Inicia tudo novamente

### 📊 Verificar Status

```powershell
.\scripts\status.ps1
```

- Mostra status dos serviços
- Lista processos ativos
- Testa conectividade
- Exibe URLs disponíveis

### 🔧 Desenvolvimento Individual

#### Backend apenas:

```powershell
.\scripts\start-backend.ps1
```

#### Frontend apenas:

```powershell
.\scripts\start-frontend.ps1
```

## URLs dos Serviços

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Documentação**: http://localhost:3000/api-docs
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

### Problemas de Dependências

Os scripts verificam e instalam dependências automaticamente.

### Verificar Status

Para diagnóstico:

```powershell
.\scripts\status.ps1
```
