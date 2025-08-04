# GitHub Secrets Configuration

## Secrets Necessários para os Workflows

Este documento lista todos os secrets que devem ser configurados no GitHub para que os workflows funcionem corretamente.

### 🔐 Secrets de Integração de Terceiros

#### Codecov
- `CODECOV_TOKEN`: Token para upload de cobertura de código

### 🚀 Secrets de Deploy - Staging

#### SSH Access
- `STAGING_SSH_KEY`: Chave SSH privada para acesso ao servidor de staging
- `STAGING_USER`: Usuário SSH para o servidor de staging
- `STAGING_HOST`: Endereço do servidor de staging

#### URLs de Verificação
- `STAGING_API_URL`: URL da API em staging (ex: https://staging-api.example.com)
- `STAGING_WEB_URL`: URL do frontend em staging (ex: https://staging.example.com)

### 🏭 Secrets de Deploy - Produção

#### SSH Access
- `PRODUCTION_SSH_KEY`: Chave SSH privada para acesso ao servidor de produção
- `PRODUCTION_USER`: Usuário SSH para o servidor de produção
- `PRODUCTION_HOST`: Endereço do servidor de produção

#### URLs de Verificação
- `PRODUCTION_API_URL`: URL da API em produção (ex: https://api.example.com)
- `PRODUCTION_WEB_URL`: URL do frontend em produção (ex: https://example.com)

### 📢 Secrets de Notificação

#### Slack
- `SLACK_WEBHOOK_URL`: URL do webhook do Slack para notificações de deploy

## Como Configurar os Secrets

1. Vá para: Repository → Settings → Secrets and variables → Actions
2. Clique em "New repository secret"
3. Adicione cada secret com o nome exato listado acima
4. Cole o valor correspondente

## Verificação dos Secrets

Para verificar se todos os secrets estão configurados corretamente, você pode executar o seguinte comando local:

```bash
# Verificar se os workflows são válidos
yamllint .github/workflows/*.yml
actionlint .github/workflows/*.yml
```

## Segurança dos Secrets

- ❌ **NUNCA** commite secrets no código
- ✅ Use secrets do GitHub para valores sensíveis
- ✅ Rotacione chaves SSH regularmente
- ✅ Use permissões mínimas necessárias
- ✅ Monitore o uso dos secrets nos logs

## Environments

Os workflows usam GitHub Environments para controle adicional:

- `staging`: Deploys automáticos da branch main
- `production`: Deploys de tags ou manual

Configure proteções nos environments em:
Repository → Settings → Environments
