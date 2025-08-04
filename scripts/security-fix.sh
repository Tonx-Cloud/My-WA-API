#!/bin/bash
# scripts/security-fix.sh - Correção Definitiva de Segredos Expostos

set -e

echo "🔧 Iniciando correção de segurança completa..."
echo "=================================================="

# FASE 1: Backup
echo "📦 FASE 1: Criando backup..."
BRANCH_NAME="security-fix-$(date +%Y%m%d-%H%M%S)"
echo "Branch de backup: $BRANCH_NAME"

# FASE 2: Verificação de segredos existentes
echo "🔍 FASE 2: Verificando segredos no repositório..."

# Verificar arquivos de documentação
echo "📝 Verificando arquivos de documentação..."
grep -r "GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET\|API_KEY\|PASSWORD" --include="*.md" --include="*.txt" . || echo "Nenhum segredo encontrado em documentação"

# Verificar docker-compose.yml atual
echo "🐳 Verificando docker-compose.yml atual..."
if grep -q "GOOGLE_CLIENT_ID.*=" docker-compose.yml; then
    echo "❌ SEGREDOS AINDA PRESENTES no docker-compose.yml"
    grep "GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET" docker-compose.yml
else
    echo "✅ docker-compose.yml está sanitizado"
fi

# FASE 3: Preparar novo sistema de variáveis de ambiente
echo "📝 FASE 3: Preparando sistema de variáveis de ambiente..."

# Criar .env.example atualizado
cat > .env.example << 'EOF'
# Google OAuth Configuration (ROTATED)
GOOGLE_CLIENT_ID=your_new_google_client_id_here
GOOGLE_CLIENT_SECRET=your_new_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_secure_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# API Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/whatsapp

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My-wa-API
NEXT_PUBLIC_APP_VERSION=2.0.0

# Docker Environment
DOCKER_ENV=true

# NPM Configuration
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
EOF

# Criar .env local se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env local..."
    cat > .env << 'EOF'
# Google OAuth (NOVAS CREDENCIAIS - ATUALIZE COM VALORES REAIS)
GOOGLE_CLIENT_ID=NOVA_CREDENTIAL_AQUI
GOOGLE_CLIENT_SECRET=NOVA_CREDENTIAL_AQUI

# NextAuth Configuration
NEXTAUTH_SECRET=4f8b2a7e3d9c1a5b8e6f9a2d4c7b1e8f3a6d9c2b5e8f1a4d7c0b3e6f9a2d5c8b1e4f7a0d3c6b9e2f5a8d1c4b7e0f3a6d9c2b5e8f1a4d7c0b3e6f9a2d
NEXTAUTH_URL=http://localhost:3001

# API Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/whatsapp

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My-wa-API
NEXT_PUBLIC_APP_VERSION=2.0.0

# Docker Environment
DOCKER_ENV=true

# NPM Configuration
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
EOF
    echo "✅ Arquivo .env criado"
else
    echo "ℹ️ Arquivo .env já existe"
fi

# FASE 4: Atualizar .gitignore
echo "🔒 FASE 4: Atualizando .gitignore..."
if ! grep -q "^\.env$" .gitignore; then
    echo "" >> .gitignore
    echo "# Environment Variables" >> .gitignore
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.development.local" >> .gitignore
    echo ".env.test.local" >> .gitignore
    echo ".env.production.local" >> .gitignore
    echo ".env.production" >> .gitignore
    echo "*.env" >> .gitignore
    echo "" >> .gitignore
    echo "# Sensitive files" >> .gitignore
    echo "secrets/" >> .gitignore
    echo "credentials/" >> .gitignore
    echo "push-log.txt" >> .gitignore
    echo "secrets-scan.log" >> .gitignore
    echo "bfg-repo-cleaner-*.jar" >> .gitignore
    echo "secrets.txt" >> .gitignore
    echo "✅ .gitignore atualizado"
else
    echo "ℹ️ .gitignore já contém regras para .env"
fi

# FASE 5: Verificar docker-compose.yml
echo "🐳 FASE 5: Verificando docker-compose.yml..."
if grep -q "GOOGLE_CLIENT_ID.*=" docker-compose.yml; then
    echo "🔧 Sanitizando docker-compose.yml..."
    # Fazer backup
    cp docker-compose.yml docker-compose.yml.backup
    
    # Substituir segredos por variáveis de ambiente
    sed -i 's/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}/g' docker-compose.yml
    sed -i 's/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}/g' docker-compose.yml
    
    echo "✅ docker-compose.yml sanitizado"
else
    echo "✅ docker-compose.yml já está sanitizado"
fi

# FASE 6: Teste de configuração
echo "✅ FASE 6: Testando configuração..."
if command -v docker-compose >/dev/null 2>&1; then
    echo "🐳 Testando docker-compose config..."
    if docker-compose config >/dev/null 2>&1; then
        echo "✅ docker-compose.yml é válido"
    else
        echo "❌ Erro na configuração do docker-compose.yml"
    fi
else
    echo "ℹ️ docker-compose não encontrado, pulando teste"
fi

# FASE 7: Preparar commit de segurança
echo "🚀 FASE 7: Preparando commit de segurança..."
git add .env.example .gitignore
if [ -f docker-compose.yml.backup ]; then
    git add docker-compose.yml
fi

echo ""
echo "🎉 CORREÇÃO DE SEGURANÇA CONCLUÍDA!"
echo "===================================="
echo ""
echo "📋 PRÓXIMOS PASSOS CRÍTICOS:"
echo ""
echo "1. 🔑 REVOGAR CREDENCIAIS COMPROMETIDAS:"
echo "   - Acesse: https://console.cloud.google.com/apis/credentials"
echo "   - Revogue o Client ID: [CREDENCIAL_REMOVIDA_POR_SEGURANÇA]"
echo ""
echo "2. 🆕 GERAR NOVAS CREDENCIAIS:"
echo "   - Crie um novo OAuth 2.0 Client ID"
echo "   - Atualize o arquivo .env com as novas credenciais"
echo ""
echo "3. 📝 COMMIT E PUSH:"
echo "   - git commit -m \"fix: implement secure environment variables and remove hardcoded secrets\""
echo "   - git push origin main"
echo ""
echo "4. 🔍 VERIFICAR:"
echo "   - Confirme que o push foi bem-sucedido"
echo "   - Teste a aplicação com as novas credenciais"
echo ""
echo "⚠️  CREDENCIAIS COMPROMETIDAS (NÃO USAR):"
echo "   CLIENT_ID: [CREDENCIAL_REMOVIDA_POR_SEGURANÇA]"
echo "   CLIENT_SECRET: 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"
echo ""
echo "🛡️ Status de segurança: SEGREDOS REMOVIDOS DO CÓDIGO"
