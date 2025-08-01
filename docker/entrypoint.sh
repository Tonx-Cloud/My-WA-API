#!/bin/sh

set -e

# Script de entrypoint para container Docker
# Configurações iniciais e preparação do ambiente

echo "🚀 Iniciando container My-WA-API..."

# Variáveis de ambiente
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"
export TZ="${TZ:-America/Sao_Paulo}"

# Configurar timezone
if [ "$TZ" != "UTC" ]; then
    echo "🌍 Configurando timezone para: $TZ"
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
    echo $TZ > /etc/timezone
fi

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    # Verificar se Node.js está disponível
    if ! command -v node >/dev/null 2>&1; then
        log "❌ Node.js não encontrado!"
        exit 1
    fi
    
    # Verificar se npm está disponível
    if ! command -v npm >/dev/null 2>&1; then
        log "❌ npm não encontrado!"
        exit 1
    fi
    
    log "✅ Dependências verificadas"
}

# Função para criar diretórios necessários
create_directories() {
    log "📁 Criando diretórios necessários..."
    
    # Lista de diretórios necessários
    dirs="logs data sessions uploads temp"
    
    for dir in $dirs; do
        if [ ! -d "/app/$dir" ]; then
            mkdir -p "/app/$dir"
            chown mywaapi:nodejs "/app/$dir"
            chmod 755 "/app/$dir"
            log "✅ Diretório criado: $dir"
        fi
    done
}

# Função para verificar permissões
check_permissions() {
    log "🔐 Verificando permissões..."
    
    # Arquivos críticos que precisam de permissão de execução
    critical_files="apps/api/dist/index.js"
    
    for file in $critical_files; do
        if [ -f "/app/$file" ]; then
            chmod +x "/app/$file"
            log "✅ Permissão de execução definida para: $file"
        fi
    done
    
    # Verificar se o usuário atual pode escrever nos diretórios
    test_dirs="logs data sessions"
    for dir in $test_dirs; do
        if [ -d "/app/$dir" ] && [ ! -w "/app/$dir" ]; then
            log "❌ Sem permissão de escrita em: $dir"
            exit 1
        fi
    done
}

# Função para aguardar dependências externas
wait_for_dependencies() {
    log "⏳ Aguardando dependências externas..."
    
    # Se houver banco de dados configurado, aguardar conexão
    if [ ! -z "$DATABASE_URL" ]; then
        log "🗄️ Aguardando conexão com banco de dados..."
        # Aqui você pode adicionar lógica específica para aguardar o banco
    fi
    
    # Se houver Redis configurado, aguardar conexão
    if [ ! -z "$REDIS_URL" ]; then
        log "🔴 Aguardando conexão com Redis..."
        # Aqui você pode adicionar lógica específica para aguardar o Redis
    fi
}

# Função para validar configuração
validate_config() {
    log "⚙️ Validando configuração..."
    
    # Verificar variáveis obrigatórias
    required_vars="NODE_ENV PORT"
    
    for var in $required_vars; do
        eval value=\$$var
        if [ -z "$value" ]; then
            log "❌ Variável obrigatória não definida: $var"
            exit 1
        fi
        log "✅ $var=$value"
    done
}

# Função para executar migrações/inicializações
run_initialization() {
    log "🔄 Executando inicializações..."
    
    # Se houver migrações de banco, executar aqui
    if [ -f "package.json" ] && grep -q "migrate" package.json; then
        log "📊 Executando migrações de banco..."
        npm run migrate 2>/dev/null || log "⚠️ Nenhuma migração encontrada"
    fi
    
    # Verificar integridade da aplicação
    if [ -f "apps/api/dist/index.js" ]; then
        log "✅ Aplicação compilada encontrada"
    else
        log "❌ Aplicação não encontrada em apps/api/dist/index.js"
        exit 1
    fi
}

# Função para cleanup em caso de sinal
cleanup() {
    log "🧹 Executando cleanup..."
    
    # Finalizar processos filhos graciosamente
    if [ ! -z "$MAIN_PID" ]; then
        log "🛑 Enviando SIGTERM para processo principal ($MAIN_PID)..."
        kill -TERM "$MAIN_PID" 2>/dev/null || true
        
        # Aguardar até 30 segundos para finalização graciosa
        timeout=30
        while [ $timeout -gt 0 ] && kill -0 "$MAIN_PID" 2>/dev/null; do
            sleep 1
            timeout=$((timeout - 1))
        done
        
        # Se ainda estiver rodando, forçar finalização
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            log "🔨 Forçando finalização do processo principal..."
            kill -KILL "$MAIN_PID" 2>/dev/null || true
        fi
    fi
    
    log "👋 Container finalizado"
    exit 0
}

# Configurar handlers de sinal
trap cleanup SIGTERM SIGINT SIGQUIT

# Executar verificações iniciais
log "🔧 Configurando ambiente de produção..."
check_dependencies
create_directories
check_permissions
validate_config
wait_for_dependencies
run_initialization

# Informações do sistema
log "📋 Informações do sistema:"
log "   - Node.js: $(node --version)"
log "   - npm: $(npm --version)"
log "   - Ambiente: $NODE_ENV"
log "   - Porta: $PORT"
log "   - Host: $HOST"
log "   - Timezone: $TZ"
log "   - Usuário: $(whoami)"
log "   - Diretório: $(pwd)"

# Se nenhum comando foi passado, executar aplicação principal
if [ $# -eq 0 ]; then
    log "🚀 Iniciando aplicação My-WA-API..."
    
    # Executar aplicação em background para capturar PID
    exec node apps/api/dist/index.js &
    MAIN_PID=$!
    
    log "✅ Aplicação iniciada com PID: $MAIN_PID"
    
    # Aguardar o processo principal
    wait $MAIN_PID
else
    # Executar comando personalizado
    log "⚡ Executando comando customizado: $*"
    exec "$@"
fi
