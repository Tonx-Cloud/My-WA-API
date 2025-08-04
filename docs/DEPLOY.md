# 🚀 Guia de Deploy e Produção - My-WA-API

## 📋 Visão Geral

Este guia completo aborda todos os aspectos necessários para colocar o My-WA-API em produção de forma segura, escalável e confiável.

## 🎯 Pré-requisitos

### Requisitos do Sistema

- **Docker** 20.10 ou superior
- **Docker Compose** 2.0 ou superior
- **Linux** Ubuntu 20.04+ ou CentOS 8+ (recomendado)
- **RAM** 4GB mínimo (8GB recomendado)
- **CPU** 2 cores mínimo (4 cores recomendado)
- **Disco** 50GB mínimo (SSD recomendado)

### Portas Necessárias

- **80** - HTTP (redirecionamento)
- **443** - HTTPS
- **3000** - API (interno)
- **3001** - Web App (interno)
- **5432** - PostgreSQL (opcional externo)
- **6379** - Redis (opcional externo)

## ⚙️ Configuração Inicial

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar para aplicar grupos
sudo reboot
```

### 2. Configurar Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### 3. Clonar e Configurar Projeto

```bash
# Clonar repositório
git clone https://github.com/Tonx-Cloud/My-WA-API.git
cd My-WA-API

# Configurar ambiente
cp .env.production.example .env.production

# Editar configurações (IMPORTANTE!)
nano .env.production
```

## 🔧 Configurações Críticas

### Variáveis Obrigatórias

Edite o arquivo `.env.production` e defina:

```bash
# Segurança (MUDE ESTES VALORES!)
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
ENCRYPTION_KEY=sua-chave-de-32-caracteres-aqui
NEXTAUTH_SECRET=sua-chave-nextauth-aqui

# Banco de dados
DB_PASS=sua-senha-do-banco-super-segura

# URLs do seu domínio
API_BASE_URL=https://api.seudominio.com
WEB_BASE_URL=https://app.seudominio.com

# OAuth (se usar)
GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

### Configurar SSL/TLS

```bash
# Criar diretório para certificados
mkdir -p docker/nginx/ssl

# Opção 1: Let's Encrypt (recomendado)
sudo apt install certbot
sudo certbot certonly --standalone -d api.seudominio.com -d app.seudominio.com
sudo cp /etc/letsencrypt/live/api.seudominio.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.seudominio.com/privkey.pem docker/nginx/ssl/key.pem

# Opção 2: Certificado auto-assinado (apenas desenvolvimento)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem
```

## 🚀 Deploy

### Deploy Automático

```bash
# Tornar script executável
chmod +x scripts/deploy.sh

# Deploy completo (recomendado)
./scripts/deploy.sh deploy

# Ou passos individuais
./scripts/deploy.sh check     # Verificar dependências
./scripts/deploy.sh build     # Construir imagens
./scripts/deploy.sh test      # Executar testes
```

### Deploy Manual

```bash
# Construir imagens
docker-compose -f docker-compose.production.yml build

# Subir serviços
docker-compose -f docker-compose.production.yml up -d

# Verificar status
docker-compose -f docker-compose.production.yml ps
```

## 📊 Monitoramento

### Verificar Saúde do Sistema

```bash
# Status dos containers
./scripts/deploy.sh status

# Logs em tempo real
./scripts/deploy.sh logs

# Health check
./scripts/deploy.sh health

# Testar endpoints
curl https://api.seudominio.com/health
curl https://app.seudominio.com/health
```

### Logs e Debugging

```bash
# Logs específicos
docker-compose -f docker-compose.production.yml logs my-wa-api
docker-compose -f docker-compose.production.yml logs postgres
docker-compose -f docker-compose.production.yml logs redis

# Entrar no container para debug
docker-compose -f docker-compose.production.yml exec my-wa-api sh
```

## 🔄 Backup e Recuperação

### Backup Automático

O sistema inclui backup automático configurado via cron:

```bash
# Verificar backups
ls -la backups/

# Backup manual
./scripts/deploy.sh backup

# Restaurar backup (cuidado!)
./scripts/deploy.sh rollback
```

### Backup Manual do Banco

```bash
# Criar backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U mywaapi mywaapi > backup-$(date +%Y%m%d).sql

# Restaurar backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U mywaapi -d mywaapi < backup-20240101.sql
```

## 🔧 Manutenção

### Atualizações

```bash
# Atualizar código
git pull origin main

# Rebuild e redeploy
./scripts/deploy.sh deploy

# Ou atualização sem downtime
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --no-deps my-wa-api
```

### Limpeza

```bash
# Limpeza automática
./scripts/deploy.sh cleanup

# Limpeza manual
docker system prune -a
docker volume prune
```

### Escalabilidade

Para aumentar a capacidade:

```bash
# Escalar API
docker-compose -f docker-compose.production.yml up -d --scale my-wa-api=3

# Monitorar recursos
docker stats
```

## 🔒 Segurança

### Checklist de Segurança

- [ ] Certificados SSL configurados
- [ ] Firewall configurado
- [ ] Senhas fortes definidas
- [ ] Chaves JWT/Encryption únicas
- [ ] Rate limiting ativo
- [ ] Logs de auditoria habilitados
- [ ] Backups funcionando
- [ ] Updates automáticos configurados

### Hardening Adicional

```bash
# Configurar fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configurar logrotate
sudo nano /etc/logrotate.d/my-wa-api
```

## 📈 Performance

### Otimizações

1. **Nginx**: Cache e compressão habilitados
2. **Redis**: Cache de sessões e dados
3. **PostgreSQL**: Índices otimizados
4. **Docker**: Multi-stage builds
5. **Node.js**: PM2 para clustering

### Monitoramento de Performance

```bash
# Métricas dos containers
docker stats

# Uso de disco
df -h
du -sh logs/ data/ sessions/

# Conexões de rede
netstat -tulpn
```

## 🚨 Troubleshooting

### Problemas Comuns

**Container não inicia:**

```bash
# Verificar logs
docker-compose -f docker-compose.production.yml logs my-wa-api

# Verificar configuração
docker-compose -f docker-compose.production.yml config
```

**Erro de conexão com banco:**

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.production.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.production.yml exec postgres psql -U mywaapi -d mywaapi -c "SELECT version();"
```

**Erro de SSL:**

```bash
# Verificar certificados
openssl x509 -in docker/nginx/ssl/cert.pem -text -noout

# Testar SSL
openssl s_client -connect api.seudominio.com:443
```

### Rollback de Emergência

```bash
# Rollback automático
./scripts/deploy.sh rollback

# Rollback manual para versão específica
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

## 📞 Suporte

### Contatos de Emergência

- **Desenvolvedor**: [seu-email@dominio.com]
- **DevOps**: [devops@dominio.com]
- **Monitoramento**: [alerts@dominio.com]

### Documentação Adicional

- [API Documentation](./docs/api.md)
- [Security Guidelines](./docs/security.md)
- [Monitoring Setup](./docs/monitoring.md)
- [Backup Procedures](./docs/backup.md)

---

## ✅ Checklist Final de Deploy

- [ ] Servidor configurado e atualizado
- [ ] Docker e Docker Compose instalados
- [ ] Firewall configurado
- [ ] Certificados SSL instalados
- [ ] Variáveis de ambiente configuradas
- [ ] DNS apontando para o servidor
- [ ] Backup inicial criado
- [ ] Health checks passando
- [ ] Logs funcionando
- [ ] Monitoramento ativo
- [ ] Documentação atualizada
- [ ] Equipe notificada

**🎉 Parabéns! Seu My-WA-API está em produção!**

Para suporte adicional, consulte a documentação completa ou entre em contato com a equipe de desenvolvimento.
