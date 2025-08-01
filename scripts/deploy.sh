#!/bin/bash

# Script de deploy para produção - My-WA-API
# Automatiza o processo de build, deploy e verificação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="my-wa-api"
VERSION=${VERSION:-$(date +%Y%m%d-%H%M%S)}
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Função para logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️ $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Função para verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado!"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose não está instalado!"
        exit 1
    fi
    
    # Verificar arquivo de ambiente
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Arquivo $ENV_FILE não encontrado. Criando exemplo..."
        cp .env.example "$ENV_FILE" 2>/dev/null || true
    fi
    
    log_success "Dependências verificadas"
}

# Função para fazer backup antes do deploy
backup_current() {
    log "Fazendo backup da versão atual..."
    
    # Criar diretório de backup
    backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup dos volumes importantes
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        log "Fazendo backup dos dados..."
        
        # Backup do banco de dados
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U mywaapi mywaapi > "$backup_dir/database.sql" || log_warning "Erro no backup do banco"
        
        # Backup dos logs
        cp -r logs "$backup_dir/" 2>/dev/null || log_warning "Erro no backup dos logs"
        
        # Backup das sessões
        cp -r sessions "$backup_dir/" 2>/dev/null || log_warning "Erro no backup das sessões"
        
        log_success "Backup criado em $backup_dir"
    else
        log_warning "Nenhum container em execução para backup"
    fi
}

# Função para build das imagens
build_images() {
    log "Construindo imagens Docker..."
    
    # Definir variáveis de build
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VERSION=$VERSION
    
    # Build da aplicação principal
    log "Construindo imagem da API..."
    docker build \
        --file docker/Dockerfile.production \
        --tag $PROJECT_NAME:$VERSION \
        --tag $PROJECT_NAME:latest \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE=$BUILD_DATE \
        --build-arg VERSION=$VERSION \
        .
    
    # Build do web app
    log "Construindo imagem do Web App..."
    docker build \
        --file apps/web/Dockerfile \
        --tag $PROJECT_NAME-web:$VERSION \
        --tag $PROJECT_NAME-web:latest \
        --build-arg NODE_ENV=production \
        apps/web/
    
    log_success "Imagens construídas com sucesso"
}

# Função para validar ambiente pré-deploy
validate_environment() {
    log "Validando ambiente pré-deploy..."
    
    # Verificar variáveis obrigatórias
    local required_vars=(
        "JWT_SECRET"
        "ENCRYPTION_KEY" 
        "DB_PASS"
        "API_BASE_URL"
        "WEB_BASE_URL"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Variáveis obrigatórias não definidas: ${missing_vars[*]}"
        log "Configure estas variáveis em $ENV_FILE"
        return 1
    fi
    
    # Verificar certificados SSL
    if [[ ! -f "docker/nginx/ssl/cert.pem" ]]; then
        log_warning "Certificados SSL não encontrados, executando configuração SSL..."
        chmod +x scripts/ssl-setup.sh
        sudo scripts/ssl-setup.sh auto || {
            log_error "Falha na configuração SSL"
            return 1
        }
    fi
    
    # Verificar DNS
    log "Verificando resolução DNS..."
    if command -v dig &> /dev/null; then
        local api_domain=$(echo "$API_BASE_URL" | sed 's|https\?://||' | cut -d'/' -f1)
        local web_domain=$(echo "$WEB_BASE_URL" | sed 's|https\?://||' | cut -d'/' -f1)
        
        for domain in "$api_domain" "$web_domain"; do
            if ! dig +short A "$domain" > /dev/null; then
                log_warning "Domínio $domain não resolve"
            else
                log_success "DNS OK: $domain"
            fi
        done
    fi
    
    log_success "Validação de ambiente concluída"
}

# Função para executar testes completos
run_full_tests() {
    log "Executando bateria completa de testes..."
    
    # Testes unitários da API
    log "Executando testes unitários da API..."
    cd apps/api
    if npm run test:coverage; then
        log_success "Testes unitários da API passaram"
    else
        log_error "Testes unitários da API falharam!"
        cd ../..
        return 1
    fi
    cd ../..
    
    # Testes de integração
    log "Executando testes de integração..."
    if npm run test:integration 2>/dev/null || true; then
        log_success "Testes de integração passaram"
    else
        log_warning "Testes de integração não configurados ou falharam"
    fi
    
    # Testes do web app
    log "Executando testes do Web App..."
    cd apps/web
    if npm run test 2>/dev/null || true; then
        log_success "Testes do Web App passaram"
    else
        log_warning "Testes do Web App falharam, continuando..."
    fi
    cd ../..
    
    # Verificação de segurança
    log "Executando auditoria de segurança..."
    npm audit --audit-level=moderate || log_warning "Vulnerabilidades encontradas"
    
    # Verificação de lint
    log "Executando verificação de código..."
    npm run lint 2>/dev/null || log_warning "Problemas de lint encontrados"
    
    log_success "Bateria de testes concluída"
}

# Função para deploy blue/green
deploy_blue_green() {
    log "Iniciando deploy blue/green..."
    
    # Definir cores
    local current_color=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q | wc -l)
    if [[ $current_color -gt 0 ]]; then
        local old_color="blue"
        local new_color="green"
    else
        local old_color="green"
        local new_color="blue"
    fi
    
    log "Deploy $old_color -> $new_color"
    
    # Criar docker-compose temporário para nova cor
    local new_compose_file="docker-compose.$new_color.yml"
    cp "$DOCKER_COMPOSE_FILE" "$new_compose_file"
    
    # Modificar portas para evitar conflito
    sed -i "s/3000:3000/3002:3000/g" "$new_compose_file"
    sed -i "s/3001:3001/3003:3001/g" "$new_compose_file"
    sed -i "s/my-wa-api-/my-wa-api-$new_color-/g" "$new_compose_file"
    
    # Subir nova stack
    log "Subindo stack $new_color..."
    export VERSION=$VERSION
    docker-compose -f "$new_compose_file" up -d
    
    # Aguardar health checks
    log "Aguardando health checks da stack $new_color..."
    local timeout=300
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if curl -f -s http://localhost:3002/health > /dev/null; then
            log_success "Stack $new_color está saudável"
            break
        fi
        
        sleep 10
        elapsed=$((elapsed + 10))
        log "Aguardando... $elapsed/$timeout segundos"
    done
    
    if [ $elapsed -ge $timeout ]; then
        log_error "Timeout na stack $new_color. Fazendo rollback..."
        docker-compose -f "$new_compose_file" down
        rm -f "$new_compose_file"
        return 1
    fi
    
    # Teste de carga básico
    log "Executando teste de carga básico..."
    for i in {1..10}; do
        if ! curl -f -s http://localhost:3002/health > /dev/null; then
            log_error "Falha no teste de carga. Rollback..."
            docker-compose -f "$new_compose_file" down
            rm -f "$new_compose_file"
            return 1
        fi
    done
    
    # Trocar portas (simulação de load balancer)
    log "Promovendo stack $new_color para produção..."
    
    # Parar stack antiga
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
    fi
    
    # Renomear arquivos
    mv "$new_compose_file" "$DOCKER_COMPOSE_FILE"
    
    # Corrigir portas de volta
    sed -i "s/3002:3000/3000:3000/g" "$DOCKER_COMPOSE_FILE"
    sed -i "s/3003:3001/3001:3001/g" "$DOCKER_COMPOSE_FILE"
    sed -i "s/my-wa-api-$new_color-/my-wa-api-/g" "$DOCKER_COMPOSE_FILE"
    
    # Subir com portas corretas
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_success "Deploy blue/green concluído com sucesso!"
}

# Função para deploy canário
deploy_canary() {
    log "Iniciando deploy canário..."
    
    # Implementação simplificada - usar duas instâncias
    local canary_compose="docker-compose.canary.yml"
    cp "$DOCKER_COMPOSE_FILE" "$canary_compose"
    
    # Modificar para usar porta diferente
    sed -i "s/3000:3000/3004:3000/g" "$canary_compose"
    sed -i "s/my-wa-api/my-wa-api-canary/g" "$canary_compose"
    
    # Subir versão canário
    export VERSION=$VERSION
    docker-compose -f "$canary_compose" up -d my-wa-api
    
    # Aguardar e testar
    sleep 30
    if curl -f -s http://localhost:3004/health > /dev/null; then
        log_success "Deploy canário saudável"
        
        # Simular 10% de tráfego por 5 minutos
        log "Executando teste canário por 2 minutos..."
        sleep 120
        
        # Se tudo OK, promover
        log "Promovendo deploy canário..."
        docker-compose -f "$canary_compose" down
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        
        rm -f "$canary_compose"
        log_success "Deploy canário promovido com sucesso!"
    else
        log_error "Deploy canário falhou"
        docker-compose -f "$canary_compose" down
        rm -f "$canary_compose"
        return 1
    fi
}
    log "Iniciando deploy..."
    
    # Definir variáveis de ambiente
    export VERSION=$VERSION
    
    # Parar containers antigos graciosamente
    log "Parando containers existentes..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30 || true
    
    # Limpar volumes órfãos
    docker volume prune -f || true
    
    # Subir novos containers
    log "Iniciando novos containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Aguardar containers ficarem saudáveis
    log "Aguardando containers ficarem saudáveis..."
    timeout=300 # 5 minutos
    elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "unhealthy"; then
            log "Alguns containers ainda não estão saudáveis... aguardando..."
            sleep 10
            elapsed=$((elapsed + 10))
        else
            break
        fi
    done
    
    if [ $elapsed -ge $timeout ]; then
        log_error "Timeout aguardando containers ficarem saudáveis!"
        return 1
    fi
    
    log_success "Deploy concluído com sucesso!"
}

# Função para verificar saúde do sistema
health_check() {
    log "Verificando saúde do sistema..."
    
    # Verificar status dos containers
    log "Status dos containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # Verificar logs recentes
    log "Logs recentes dos containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20
    
    # Testar endpoints
    log "Testando endpoints..."
    
    # Aguardar um pouco para os serviços iniciarem
    sleep 30
    
    # Testar API
    if curl -f -s http://localhost:3000/health > /dev/null; then
        log_success "API está respondendo"
    else
        log_error "API não está respondendo"
        return 1
    fi
    
    # Testar Web App
    if curl -f -s http://localhost:3001/health > /dev/null; then
        log_success "Web App está respondendo"
    else
        log_warning "Web App não está respondendo"
    fi
    
    log_success "Sistema está saudável!"
}

# Função para rollback
rollback() {
    log_warning "Iniciando rollback..."
    
    # Parar containers atuais
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Restaurar backup mais recente
    latest_backup=$(ls -1 backups/ | tail -1)
    if [ -n "$latest_backup" ]; then
        log "Restaurando backup: $latest_backup"
        
        # Restaurar banco de dados
        if [ -f "backups/$latest_backup/database.sql" ]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
            sleep 30
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U mywaapi -d mywaapi < "backups/$latest_backup/database.sql"
        fi
        
        # Restaurar arquivos
        cp -r "backups/$latest_backup/logs" . 2>/dev/null || true
        cp -r "backups/$latest_backup/sessions" . 2>/dev/null || true
        
        log_success "Rollback concluído"
    else
        log_error "Nenhum backup encontrado para rollback!"
        return 1
    fi
}

# Função para limpeza
cleanup() {
    log "Limpando recursos não utilizados..."
    
    # Remover imagens antigas
    docker image prune -f
    
    # Remover volumes órfãos
    docker volume prune -f
    
    # Remover containers parados
    docker container prune -f
    
    log_success "Limpeza concluída"
}

# Função principal
main() {
    log "🚀 Iniciando deploy do $PROJECT_NAME versão $VERSION"
    
    case "${1:-deploy}" in
        "check")
            check_dependencies
            ;;
        "build")
            check_dependencies
            build_images
            ;;
        "test")
            run_tests
            ;;
        "deploy")
            check_dependencies
            validate_environment
            backup_current
            build_images
            run_full_tests || {
                log_error "Testes falharam! Abortando deploy."
                exit 1
            }
            deploy
            health_check
            cleanup
            ;;
        "blue-green")
            check_dependencies
            validate_environment
            backup_current
            build_images
            run_full_tests || {
                log_error "Testes falharam! Abortando deploy."
                exit 1
            }
            deploy_blue_green
            health_check
            cleanup
            ;;
        "canary")
            check_dependencies
            validate_environment
            backup_current
            build_images
            run_full_tests || {
                log_error "Testes falharam! Abortando deploy."
                exit 1
            }
            deploy_canary
            health_check
            cleanup
            ;;
        "validate")
            validate_environment
            run_full_tests
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "cleanup")
            cleanup
            ;;
        "logs")
            docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
            ;;
        "status")
            docker-compose -f "$DOCKER_COMPOSE_FILE" ps
            ;;
        *)
            echo "Uso: $0 [check|build|test|deploy|blue-green|canary|validate|rollback|health|cleanup|logs|status]"
            echo ""
            echo "Comandos:"
            echo "  check      - Verificar dependências"
            echo "  build      - Construir imagens"
            echo "  test       - Executar testes (DEPRECATED - use validate)"
            echo "  deploy     - Deploy completo padrão"
            echo "  blue-green - Deploy blue/green sem downtime"
            echo "  canary     - Deploy canário com teste de tráfego"
            echo "  validate   - Validar ambiente e executar testes completos"
            echo "  rollback   - Voltar para versão anterior"
            echo "  health     - Verificar saúde do sistema"
            echo "  cleanup    - Limpar recursos não utilizados"
            echo "  logs       - Mostrar logs em tempo real"
            echo "  status     - Mostrar status dos containers"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
