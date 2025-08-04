﻿# ðŸ§ª Sistema de Testes Automatizados - My WA API

> **VersÃ£o 2.1** - Sistema completo com restart integrado e logging avanÃ§ado

Este documento descreve o sistema completo de testes automatizados do projeto My-WA-API com **restart automÃ¡tico integrado**.

## ðŸŽ¯ VisÃ£o Geral

Sistema de testes automatizados completo com **restart integrado** que garante ambiente limpo para cada execuÃ§Ã£o, logging estruturado Winston e relatÃ³rios detalhados.

### âœ¨ Novidades v2.1

- ðŸ”„ **Restart AutomÃ¡tico**: Sistema reinicia automaticamente antes dos testes
- ðŸŽ¯ **Ambiente Limpo**: Cada execuÃ§Ã£o comeÃ§a com estado conhecido
- ï¿½ **Logging AvanÃ§ado**: Winston com logs estruturados e categorizados
- ï¿½ðŸš€ **GitHub Actions**: Workflow completo para CI/CD
- ðŸ” **ValidaÃ§Ã£o AutomÃ¡tica**: VerificaÃ§Ã£o do sistema antes da execuÃ§Ã£o

## ðŸš€ ExecuÃ§Ã£o RÃ¡pida

```bash
# ExecuÃ§Ã£o completa com restart automÃ¡tico (RECOMENDADO)
npm run full-test

# Desenvolvimento rÃ¡pido (sem restart)
npm run full-test:no-restart

# Apenas restart do sistema
npm run restart-system

# Restart sem health checks (mais rÃ¡pido)
npm run restart-system:skip-health

# ValidaÃ§Ã£o do sistema
npm run validate-tests

# ExecuÃ§Ã£o PowerShell (legado)
npm run full-test:powershell

# ExecuÃ§Ã£o rÃ¡pida PowerShell (legado)
npm run full-test:quick
```

## ðŸ“‹ Funcionalidades

### âœ… Tipos de Testes Suportados

- **Testes UnitÃ¡rios**: VerificaÃ§Ã£o individual de componentes
- **Testes de IntegraÃ§Ã£o**: VerificaÃ§Ã£o de interaÃ§Ã£o entre mÃ³dulos
- **Testes de Performance**: Benchmarks e anÃ¡lise de tempo de resposta
- **Testes de SeguranÃ§a**: ValidaÃ§Ã£o de autenticaÃ§Ã£o, autorizaÃ§Ã£o e inputs
- **Testes E2E**: Testes end-to-end (quando configurados)

### ðŸ“Š Sistema de Logging

- **Winston Logger**: Logs estruturados em JSON
- **CategorizaÃ§Ã£o**: Performance, SeguranÃ§a, Erros, API
- **MÃºltiplos Outputs**: Console, arquivos, relatÃ³rios estruturados
- **RotaÃ§Ã£o AutomÃ¡tica**: Logs antigos sÃ£o arquivados automaticamente

### ðŸ” Health Checks Automatizados

O sistema executa verificaÃ§Ãµes automÃ¡ticas em:

- `/health` - Status geral da API
- `/health/live` - VerificaÃ§Ã£o de liveness
- `/health/ready` - VerificaÃ§Ã£o de readiness
- `/api/dashboard/stats` - Funcionalidade do dashboard

### ðŸ“ˆ RelatÃ³rios Detalhados

#### Formatos DisponÃ­veis:

- **JSON**: Dados estruturados para anÃ¡lise programÃ¡tica
- **TXT**: RelatÃ³rio legÃ­vel para humanos
- **HTML**: Interface visual para navegaÃ§Ã£o (coverage)

#### ConteÃºdo dos RelatÃ³rios:

- Resumo geral de execuÃ§Ã£o
- Detalhes por categoria de teste
- MÃ©tricas de performance
- Status dos health checks
- InformaÃ§Ãµes do sistema
- Cobertura de cÃ³digo

## ðŸ› ï¸ ConfiguraÃ§Ã£o

### Arquivo de ConfiguraÃ§Ã£o Principal

O arquivo `test-config.json` contÃ©m todas as configuraÃ§Ãµes:

```json
{
  "testConfig": {
    "testSuites": {
      "unit": { "enabled": true, "priority": 1 },
      "integration": { "enabled": true, "priority": 2 },
      "performance": { "enabled": true, "priority": 3 },
      "security": { "enabled": true, "priority": 4 }
    }
  }
}
```

### ConfiguraÃ§Ã£o de Ambientes

- **Development**: `http://localhost:3000` (API), `http://localhost:3001` (Web)
- **Production**: URLs configurÃ¡veis para ambiente de produÃ§Ã£o

## ðŸ“ Estrutura de Arquivos

```
scripts/
â”œâ”€â”€ run-full-tests.js          # Script principal Node.js
â”œâ”€â”€ run-full-tests.ps1         # Script PowerShell complementar
test-config.json               # ConfiguraÃ§Ã£o central
logs/
â”œâ”€â”€ test-run-{timestamp}.log   # Log detalhado da execuÃ§Ã£o
â”œâ”€â”€ test-results-{timestamp}.json # Resultados em JSON
â”œâ”€â”€ performance.log            # Logs especÃ­ficos de performance
â”œâ”€â”€ security.log              # Logs especÃ­ficos de seguranÃ§a
â”œâ”€â”€ errors.log                 # Logs de erros
â””â”€â”€ backup/                    # Backup automÃ¡tico de logs anteriores
```

## ðŸŽ¯ Comandos DisponÃ­veis

### Comandos Principais

```bash
# ExecuÃ§Ã£o completa padrÃ£o
npm run full-test

# ExecuÃ§Ã£o PowerShell (Windows)
npm run full-test:powershell

# ExecuÃ§Ã£o com monitoramento detalhado
npm run full-test:verbose

# ExecuÃ§Ã£o rÃ¡pida sem health checks
npm run full-test:quick
```

### Comandos EspecÃ­ficos

```bash
# Apenas testes unitÃ¡rios
npm run test:api
npm run test:web

# Apenas coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## ðŸ“Š MÃ©tricas e Thresholds

### Cobertura de CÃ³digo

- **Statements**: â‰¥ 80%
- **Branches**: â‰¥ 75%
- **Functions**: â‰¥ 80%
- **Lines**: â‰¥ 80%

### Performance

- **Tempo de Resposta MÃ¡ximo**: 2000ms
- **Uso de MemÃ³ria**: â‰¤ 512MB
- **Throughput MÃ­nimo**: 100 req/s

### Health Checks

- **Timeout PadrÃ£o**: 5000ms
- **Retries**: 3 tentativas
- **Status Esperado**: 200 ou 401 (para endpoints protegidos)

## ðŸ”§ PersonalizaÃ§Ã£o

### Adicionar Novos Tipos de Teste

1. **Configurar no test-config.json**:

```json
{
  "testSuites": {
    "meuNovoTipo": {
      "enabled": true,
      "priority": 6,
      "timeout": 60000,
      "patterns": ["**/meuTipo/**/*.test.ts"]
    }
  }
}
```

2. **Implementar no script principal**:

```javascript
async runMeuNovoTipo() {
  this.logger.log('info', 'MEU_TIPO', 'Executando meus testes...');
  // ImplementaÃ§Ã£o
}
```

### Configurar Novos Health Checks

```json
{
  "healthChecks": {
    "endpoints": [
      {
        "name": "Meu Endpoint",
        "url": "/minha/api",
        "expectedStatus": 200,
        "timeout": 5000
      }
    ]
  }
}
```

## ðŸ› Troubleshooting

### Problemas Comuns

#### 1. ServiÃ§os nÃ£o estÃ£o rodando

```bash
# Verificar se os serviÃ§os estÃ£o ativos
npm run status
# ou
.\scripts\status.ps1
```

#### 2. Timeouts em health checks

- Verificar se as URLs estÃ£o corretas
- Aumentar timeout no `test-config.json`
- Verificar conectividade de rede

#### 3. Falhas em testes de performance

- Verificar carga do sistema
- Ajustar thresholds no config
- Executar em horÃ¡rio de menor uso

#### 4. Problemas de permissÃ£o (PowerShell)

```powershell
# Definir polÃ­tica de execuÃ§Ã£o
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Logs de Debug

Para ativar logs detalhados:

```bash
# Node.js
DEBUG=test-runner npm run full-test

# PowerShell
npm run full-test:verbose
```

## ðŸ“‹ Checklist de ValidaÃ§Ã£o

Antes de fazer deploy ou merge:

- [ ] Todos os testes unitÃ¡rios passando
- [ ] Cobertura acima dos thresholds
- [ ] Health checks funcionando
- [ ] Performance dentro dos limites
- [ ] Testes de seguranÃ§a validados
- [ ] Logs sendo gerados corretamente
- [ ] RelatÃ³rios salvos em formato adequado

## ðŸ”„ IntegraÃ§Ã£o ContÃ­nua

### GitHub Actions (exemplo)

```yaml
name: Full Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run full test suite
        run: npm run full-test
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: logs/
```

## ðŸ“ž Suporte

Para problemas ou dÃºvidas:

1. Verificar logs em `logs/`
2. Consultar `test-config.json` para configuraÃ§Ãµes
3. Executar com `-Verbose` para mais detalhes
4. Abrir issue no repositÃ³rio com logs relevantes

---

**Ãšltima atualizaÃ§Ã£o**: 30/07/2025
**VersÃ£o do sistema**: 1.0.0