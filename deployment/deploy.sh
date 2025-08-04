#!/bin/bash

# Deploy script para My WhatsApp API
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="my-wa-api"
API_DIR="apps/api"

echo "🚀 Iniciando deploy do $PROJECT_NAME para ambiente: $ENVIRONMENT"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto (onde está o package.json principal)"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js >= 20.17.0"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="20.17.0"

if ! node -p "require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION')" 2>/dev/null; then
    echo "⚠️  Versão do Node.js ($NODE_VERSION) pode ser incompatível. Recomendado: >= $REQUIRED_VERSION"
fi

# Navegaar para o diretório da API
cd $API_DIR

echo "📦 Instalando dependências..."
npm ci --production=false

echo "🔧 Executando verificações de tipo..."
npm run typecheck

echo "🏗️  Compilando aplicação..."
npm run build

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🧹 Limpando dependências de desenvolvimento..."
    npm ci --production=true
    
    echo "🔍 Verificando estrutura de build..."
    if [ ! -f "dist/index.js" ]; then
        echo "❌ Build falhou - arquivo principal não encontrado"
        exit 1
    fi
    
    echo "🎯 Configurando ambiente de produção..."
    export NODE_ENV=production
    
    # Verificar se PM2 está instalado globalmente
    if command -v pm2 &> /dev/null; then
        echo "📊 Iniciando com PM2..."
        pm2 stop $PROJECT_NAME 2>/dev/null || true
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        pm2 start ecosystem.config.json --env production
        pm2 save
        
        echo "✅ Deploy concluído com PM2!"
        echo "📊 Use 'pm2 status' para verificar o status"
        echo "📝 Use 'pm2 logs $PROJECT_NAME' para ver os logs"
    else
        echo "⚠️  PM2 não encontrado. Iniciando em modo simples..."
        echo "💡 Para produção, recomenda-se instalar PM2: npm install -g pm2"
        npm run start:prod &
        echo "✅ Deploy concluído!"
    fi
else
    echo "🚀 Iniciando em modo desenvolvimento..."
    npm run start &
    echo "✅ Deploy de desenvolvimento concluído!"
fi

echo ""
echo "🌐 API disponível em: http://localhost:3000"
echo "📚 Documentação: http://localhost:3000/api-docs"
echo "💊 Health check: http://localhost:3000/health"
echo ""

# Voltar para o diretório raiz
cd ../..

echo "✨ Deploy finalizado com sucesso!"
