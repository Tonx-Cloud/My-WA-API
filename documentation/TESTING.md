# 🧪 Sistema de Testes Automatizados - My WA API

> **Versão 2.1** - Sistema completo com restart integrado e logging avançado

Este documento descreve o sistema completo de testes automatizados do projeto My-WA-API com **restart automático integrado**.

## 🎯 Visão Geral

Sistema de testes automatizados completo com **restart integrado** que garante ambiente limpo para cada execução, logging estruturado Winston e relatórios detalhados.

### ✨ Novidades v2.1

- 🔄 **Restart Automático**: Sistema reinicia automaticamente antes dos testes
- 🎯 **Ambiente Limpo**: Cada execução começa com estado conhecido
- � **Logging Avançado**: Winston com logs estruturados e categorizados
- �🚀 **GitHub Actions**: Workflow completo para CI/CD
- 🔍 **Validação Automática**: Verificação do sistema antes da execução

## 🚀 Execução Rápida

```bash
# Execução completa com restart automático (RECOMENDADO)
npm run full-test

# Desenvolvimento rápido (sem restart)
npm run full-test:no-restart

# Apenas restart do sistema
npm run restart-system

# Restart sem health checks (mais rápido)
npm run restart-system:skip-health

# Validação do sistema
npm run validate-tests

# Execução PowerShell (legado)
npm run full-test:powershell

# Execução rápida PowerShell (legado)
npm run full-test:quick
```

## 📋 Funcionalidades

### ✅ Tipos de Testes Suportados

- **Testes Unitários**: Verificação individual de componentes
- **Testes de Integração**: Verificação de interação entre módulos
- **Testes de Performance**: Benchmarks e análise de tempo de resposta
- **Testes de Segurança**: Validação de autenticação, autorização e inputs
- **Testes E2E**: Testes end-to-end (quando configurados)

### 📊 Sistema de Logging

- **Winston Logger**: Logs estruturados em JSON
- **Categorização**: Performance, Segurança, Erros, API
- **Múltiplos Outputs**: Console, arquivos, relatórios estruturados
- **Rotação Automática**: Logs antigos são arquivados automaticamente

### 🔍 Health Checks Automatizados

O sistema executa verificações automáticas em:
- `/health` - Status geral da API
- `/health/live` - Verificação de liveness
- `/health/ready` - Verificação de readiness
- `/api/dashboard/stats` - Funcionalidade do dashboard

### 📈 Relatórios Detalhados

#### Formatos Disponíveis:
- **JSON**: Dados estruturados para análise programática
- **TXT**: Relatório legível para humanos
- **HTML**: Interface visual para navegação (coverage)

#### Conteúdo dos Relatórios:
- Resumo geral de execução
- Detalhes por categoria de teste
- Métricas de performance
- Status dos health checks
- Informações do sistema
- Cobertura de código

## 🛠️ Configuração

### Arquivo de Configuração Principal
O arquivo `test-config.json` contém todas as configurações:

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

### Configuração de Ambientes
- **Development**: `http://localhost:3000` (API), `http://localhost:3001` (Web)
- **Production**: URLs configuráveis para ambiente de produção

## 📁 Estrutura de Arquivos

```
scripts/
├── run-full-tests.js          # Script principal Node.js
├── run-full-tests.ps1         # Script PowerShell complementar
test-config.json               # Configuração central
logs/
├── test-run-{timestamp}.log   # Log detalhado da execução
├── test-results-{timestamp}.json # Resultados em JSON
├── performance.log            # Logs específicos de performance
├── security.log              # Logs específicos de segurança
├── errors.log                 # Logs de erros
└── backup/                    # Backup automático de logs anteriores
```

## 🎯 Comandos Disponíveis

### Comandos Principais
```bash
# Execução completa padrão
npm run full-test

# Execução PowerShell (Windows)
npm run full-test:powershell

# Execução com monitoramento detalhado
npm run full-test:verbose

# Execução rápida sem health checks
npm run full-test:quick
```

### Comandos Específicos
```bash
# Apenas testes unitários
npm run test:api
npm run test:web

# Apenas coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📊 Métricas e Thresholds

### Cobertura de Código
- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

### Performance
- **Tempo de Resposta Máximo**: 2000ms
- **Uso de Memória**: ≤ 512MB
- **Throughput Mínimo**: 100 req/s

### Health Checks
- **Timeout Padrão**: 5000ms
- **Retries**: 3 tentativas
- **Status Esperado**: 200 ou 401 (para endpoints protegidos)

## 🔧 Personalização

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
  // Implementação
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

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Serviços não estão rodando
```bash
# Verificar se os serviços estão ativos
npm run status
# ou
.\scripts\status.ps1
```

#### 2. Timeouts em health checks
- Verificar se as URLs estão corretas
- Aumentar timeout no `test-config.json`
- Verificar conectividade de rede

#### 3. Falhas em testes de performance
- Verificar carga do sistema
- Ajustar thresholds no config
- Executar em horário de menor uso

#### 4. Problemas de permissão (PowerShell)
```powershell
# Definir política de execução
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

## 📋 Checklist de Validação

Antes de fazer deploy ou merge:

- [ ] Todos os testes unitários passando
- [ ] Cobertura acima dos thresholds
- [ ] Health checks funcionando
- [ ] Performance dentro dos limites
- [ ] Testes de segurança validados
- [ ] Logs sendo gerados corretamente
- [ ] Relatórios salvos em formato adequado

## 🔄 Integração Contínua

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

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs em `logs/`
2. Consultar `test-config.json` para configurações
3. Executar com `-Verbose` para mais detalhes
4. Abrir issue no repositório com logs relevantes

---

**Última atualização**: 30/07/2025
**Versão do sistema**: 1.0.0
