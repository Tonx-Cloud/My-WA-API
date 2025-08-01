#!/bin/bash

# Script de Automação Principal - My-WA-API
# Orquestra todos os sistemas: SSL, Deploy, Monitoramento, Backup e Alertas
# Implementa os "Próximos Passos Recomendados" completos

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUTOMATION_LOG="$PROJECT_ROOT/logs/automation.log"

# Função para logging principal
log_main() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} 🚀 $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AUTOMATION: $1" >> "$AUTOMATION_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$AUTOMATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$AUTOMATION_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$AUTOMATION_LOG"
}

log_phase() {
    echo -e "${PURPLE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} 🎯 FASE: $1"
    echo "=================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PHASE: $1" >> "$AUTOMATION_LOG"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log_phase "Verificando Pré-requisitos"
    
    local missing_deps=()
    
    # Verificar comandos essenciais
    local required_commands=("docker" "docker-compose" "curl" "jq" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Verificar arquivos de configuração
    local required_files=(".env.production" "docker-compose.production.yml")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            missing_deps+=("$file")
        fi
    done
    
    # Verificar scripts
    local required_scripts=("ssl-setup.sh" "deploy.sh" "monitoring-setup.sh" "cloud-backup.sh" "alert-system.sh")
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "$SCRIPT_DIR/$script" ]]; then
            missing_deps+=("$script")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing_deps[*]}"
        return 1
    fi
    
    log_success "Todos os pré-requisitos verificados"
}

# Função para configurar SSL
setup_ssl() {
    log_phase "Configurando SSL Automático"
    
    if [[ -f "$SCRIPT_DIR/ssl-setup.sh" ]]; then
        chmod +x "$SCRIPT_DIR/ssl-setup.sh"
        
        log_main "Executando configuração SSL..."
        if "$SCRIPT_DIR/ssl-setup.sh" setup; then
            log_success "SSL configurado com sucesso"
        else
            log_error "Falha na configuração SSL"
            return 1
        fi
    else
        log_error "Script SSL não encontrado"
        return 1
    fi
}

# Função para configurar monitoramento
setup_monitoring() {
    log_phase "Configurando Sistema de Monitoramento"
    
    if [[ -f "$SCRIPT_DIR/monitoring-setup.sh" ]]; then
        chmod +x "$SCRIPT_DIR/monitoring-setup.sh"
        
        log_main "Configurando stack de monitoramento..."
        if "$SCRIPT_DIR/monitoring-setup.sh" setup; then
            log_success "Monitoramento configurado com sucesso"
            
            log_main "Iniciando serviços de monitoramento..."
            if "$SCRIPT_DIR/monitoring-setup.sh" start; then
                log_success "Serviços de monitoramento iniciados"
            else
                log_warning "Falha ao iniciar alguns serviços de monitoramento"
            fi
        else
            log_error "Falha na configuração do monitoramento"
            return 1
        fi
    else
        log_error "Script de monitoramento não encontrado"
        return 1
    fi
}

# Função para configurar backup
setup_backup() {
    log_phase "Configurando Sistema de Backup"
    
    if [[ -f "$SCRIPT_DIR/cloud-backup.sh" ]]; then
        chmod +x "$SCRIPT_DIR/cloud-backup.sh"
        
        log_main "Configurando backup para cloud..."
        if "$SCRIPT_DIR/cloud-backup.sh" setup; then
            log_success "Sistema de backup configurado"
            
            # Executar backup inicial
            log_main "Executando backup inicial..."
            if "$SCRIPT_DIR/cloud-backup.sh" backup; then
                log_success "Backup inicial realizado com sucesso"
            else
                log_warning "Falha no backup inicial"
            fi
        else
            log_error "Falha na configuração do backup"
            return 1
        fi
    else
        log_error "Script de backup não encontrado"
        return 1
    fi
}

# Função para configurar alertas
setup_alerts() {
    log_phase "Configurando Sistema de Alertas"
    
    if [[ -f "$SCRIPT_DIR/alert-system.sh" ]]; then
        chmod +x "$SCRIPT_DIR/alert-system.sh"
        
        log_main "Configurando sistema de alertas..."
        if "$SCRIPT_DIR/alert-system.sh" setup; then
            log_success "Sistema de alertas configurado"
            
            # Testar alertas
            log_main "Testando sistema de alertas..."
            if "$SCRIPT_DIR/alert-system.sh" test; then
                log_success "Testes de alertas concluídos"
            else
                log_warning "Alguns testes de alertas falharam"
            fi
        else
            log_error "Falha na configuração dos alertas"
            return 1
        fi
    else
        log_error "Script de alertas não encontrado"
        return 1
    fi
}

# Função para deploy da aplicação
deploy_application() {
    log_phase "Fazendo Deploy da Aplicação"
    
    if [[ -f "$SCRIPT_DIR/deploy.sh" ]]; then
        chmod +x "$SCRIPT_DIR/deploy.sh"
        
        log_main "Executando deploy com estratégia blue-green..."
        if "$SCRIPT_DIR/deploy.sh" blue-green; then
            log_success "Deploy realizado com sucesso"
        else
            log_error "Falha no deploy"
            return 1
        fi
    else
        log_error "Script de deploy não encontrado"
        return 1
    fi
}

# Função para configurar cron jobs
setup_cron_jobs() {
    log_phase "Configurando Tarefas Automáticas (Cron)"
    
    # Backup cron
    local backup_cron="0 2 * * * $SCRIPT_DIR/cloud-backup.sh backup >> $PROJECT_ROOT/logs/backup-cron.log 2>&1"
    
    # SSL renewal cron
    local ssl_cron="0 0 * * 0 $SCRIPT_DIR/ssl-setup.sh renew >> $PROJECT_ROOT/logs/ssl-cron.log 2>&1"
    
    # Monitoring check cron
    local monitor_cron="*/5 * * * * $SCRIPT_DIR/monitoring-setup.sh status >> $PROJECT_ROOT/logs/monitor-cron.log 2>&1"
    
    # Alert escalation cron
    local escalation_cron="*/10 * * * * $SCRIPT_DIR/alert-system.sh escalations >> $PROJECT_ROOT/logs/escalation-cron.log 2>&1"
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "$backup_cron"; echo "$ssl_cron"; echo "$monitor_cron"; echo "$escalation_cron") | crontab -
    
    log_success "Cron jobs configurados:"
    log_main "  - Backup diário às 02:00"
    log_main "  - Renovação SSL semanal"
    log_main "  - Verificação de monitoramento a cada 5min"
    log_main "  - Verificação de escalação a cada 10min"
}

# Função para configurar systemd services
setup_systemd_services() {
    log_phase "Configurando Serviços Systemd"
    
    # Serviço para monitoramento de alertas
    cat > /tmp/mywaapi-alert-monitor.service << EOF
[Unit]
Description=My-WA-API Alert Monitor
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_ROOT
ExecStart=$SCRIPT_DIR/alert-system.sh monitor
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Serviço para backup automático
    cat > /tmp/mywaapi-backup.service << EOF
[Unit]
Description=My-WA-API Backup Service
After=network.target docker.service
Wants=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=$PROJECT_ROOT
ExecStart=$SCRIPT_DIR/cloud-backup.sh backup
StandardOutput=journal
StandardError=journal
EOF
    
    # Timer para backup
    cat > /tmp/mywaapi-backup.timer << EOF
[Unit]
Description=Run My-WA-API backup daily
Requires=mywaapi-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # Instalar serviços
    sudo cp /tmp/mywaapi-*.service /etc/systemd/system/
    sudo cp /tmp/mywaapi-*.timer /etc/systemd/system/
    sudo systemctl daemon-reload
    
    # Habilitar serviços
    sudo systemctl enable mywaapi-alert-monitor.service
    sudo systemctl enable mywaapi-backup.timer
    sudo systemctl start mywaapi-alert-monitor.service
    sudo systemctl start mywaapi-backup.timer
    
    # Limpeza
    rm -f /tmp/mywaapi-*
    
    log_success "Serviços systemd configurados e iniciados"
}

# Função para verificar saúde do sistema
health_check() {
    log_phase "Verificação de Saúde do Sistema"
    
    local issues=()
    
    # Verificar aplicação principal
    if ! curl -f -s http://localhost:3000/health > /dev/null; then
        issues+=("Aplicação principal não responde")
    fi
    
    # Verificar monitoramento
    if ! curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        issues+=("Prometheus não responde")
    fi
    
    if ! curl -f -s http://localhost:3001/api/health > /dev/null; then
        issues+=("Grafana não responde")
    fi
    
    # Verificar containers
    local containers=("mywaapi-api" "mywaapi-web" "postgres" "redis")
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$container"; then
            issues+=("Container $container não está rodando")
        fi
    done
    
    # Verificar espaço em disco
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        issues+=("Disco quase cheio: ${disk_usage}%")
    fi
    
    # Verificar memória
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
    if [[ $mem_usage -gt 90 ]]; then
        issues+=("Memória alta: ${mem_usage}%")
    fi
    
    # Reportar resultados
    if [[ ${#issues[@]} -eq 0 ]]; then
        log_success "Sistema está saudável ✅"
        
        # Enviar alerta de sucesso
        "$SCRIPT_DIR/alert-system.sh" send info \
            "Sistema Totalmente Operacional" \
            "Todos os componentes estão funcionando corretamente" \
            "Verificação automática de saúde concluída com sucesso"
    else
        log_error "Problemas detectados:"
        for issue in "${issues[@]}"; do
            log_error "  - $issue"
        done
        
        # Enviar alerta crítico
        "$SCRIPT_DIR/alert-system.sh" send critical \
            "Problemas no Sistema Detectados" \
            "Verificação de saúde encontrou ${#issues[@]} problema(s)" \
            "$(printf '%s\n' "${issues[@]}")"
        
        return 1
    fi
}

# Função para mostrar status completo
show_status() {
    log_phase "Status Completo do Sistema"
    
    echo ""
    echo "🌐 APLICAÇÃO PRINCIPAL"
    echo "===================="
    if curl -f -s http://localhost:3000/health > /dev/null; then
        echo "✅ API: Online (http://localhost:3000)"
    else
        echo "❌ API: Offline"
    fi
    
    if curl -f -s http://localhost:3001 > /dev/null; then
        echo "✅ Web: Online (http://localhost:3001)"
    else
        echo "❌ Web: Offline"
    fi
    
    echo ""
    echo "📊 MONITORAMENTO"
    echo "==============="
    if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        echo "✅ Prometheus: Online (http://localhost:9090)"
    else
        echo "❌ Prometheus: Offline"
    fi
    
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Grafana: Online (http://localhost:3001)"
    else
        echo "❌ Grafana: Offline"
    fi
    
    if curl -f -s http://localhost:9093/-/healthy > /dev/null; then
        echo "✅ Alertmanager: Online (http://localhost:9093)"
    else
        echo "❌ Alertmanager: Offline"
    fi
    
    echo ""
    echo "🗄️ BACKUP"
    echo "========="
    if [[ -f "$PROJECT_ROOT/backups/.last-backup" ]]; then
        local last_backup=$(cat "$PROJECT_ROOT/backups/.last-backup")
        echo "✅ Último backup: $last_backup"
    else
        echo "❌ Nenhum backup encontrado"
    fi
    
    echo ""
    echo "🚨 ALERTAS"
    echo "=========="
    local today_alerts=$(find "$PROJECT_ROOT/alerts/sent" -name "$(date +%Y%m%d)*.json" 2>/dev/null | wc -l)
    echo "📊 Alertas hoje: $today_alerts"
    
    echo ""
    echo "🐳 CONTAINERS DOCKER"
    echo "==================="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "💾 RECURSOS DO SISTEMA"
    echo "====================="
    echo "🔍 Espaço em disco:"
    df -h / | awk 'NR==2 {print "  Usado: " $3 " de " $2 " (" $5 ")"}'
    
    echo "🧠 Memória:"
    free -h | awk 'NR==2 {print "  Usado: " $3 " de " $2}'
    
    echo "⚡ CPU:"
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  Uso: " 100 - $1 "%"}'
    
    echo ""
    echo "🔗 ACESSO RÁPIDO"
    echo "================"
    echo "🌐 Aplicação: http://localhost:3001"
    echo "📊 Grafana: http://localhost:3000"
    echo "🔍 Prometheus: http://localhost:9090"
    echo "🚨 Alertmanager: http://localhost:9093"
    
    echo ""
}

# Função principal de setup completo
full_setup() {
    log_main "🚀 Iniciando Configuração Completa - Próximos Passos Recomendados"
    echo "=================================================================="
    
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Fase 1: Pré-requisitos
    if ! check_prerequisites; then
        log_error "Falha nos pré-requisitos. Abortando."
        exit 1
    fi
    
    # Fase 2: SSL
    if ! setup_ssl; then
        log_error "Falha na configuração SSL. Continuando..."
    fi
    
    # Fase 3: Monitoramento
    if ! setup_monitoring; then
        log_error "Falha na configuração do monitoramento. Continuando..."
    fi
    
    # Fase 4: Backup
    if ! setup_backup; then
        log_error "Falha na configuração do backup. Continuando..."
    fi
    
    # Fase 5: Alertas
    if ! setup_alerts; then
        log_error "Falha na configuração dos alertas. Continuando..."
    fi
    
    # Fase 6: Deploy
    if ! deploy_application; then
        log_error "Falha no deploy. Continuando..."
    fi
    
    # Fase 7: Automação
    setup_cron_jobs
    setup_systemd_services
    
    # Fase 8: Verificação final
    sleep 30  # Aguardar serviços estabilizarem
    health_check
    
    log_success "🎉 Configuração completa finalizada!"
    echo ""
    echo "🎯 PRÓXIMOS PASSOS IMPLEMENTADOS:"
    echo "================================="
    echo "✅ SSL automático com Let's Encrypt"
    echo "✅ Deploy blue-green automatizado"
    echo "✅ Monitoramento com Prometheus+Grafana"
    echo "✅ Backup para cloud (AWS S3/Google Cloud)"
    echo "✅ Alertas multi-canal (Slack/Discord/Email/WhatsApp)"
    echo "✅ Automação com cron e systemd"
    echo "✅ Verificação de saúde automática"
    echo ""
    echo "📋 Para acessar:"
    echo "  - Execute: $0 status"
    echo "  - Grafana: http://localhost:3000"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
}

# Função principal
main() {
    case "${1:-help}" in
        "setup"|"full-setup")
            full_setup
            ;;
        "ssl")
            setup_ssl
            ;;
        "monitoring")
            setup_monitoring
            ;;
        "backup")
            setup_backup
            ;;
        "alerts")
            setup_alerts
            ;;
        "deploy")
            deploy_application
            ;;
        "health")
            health_check
            ;;
        "status")
            show_status
            ;;
        "restart")
            log_main "Reiniciando todos os serviços..."
            docker-compose -f docker-compose.production.yml restart
            docker-compose -f docker-compose.monitoring.yml restart
            log_success "Serviços reiniciados"
            ;;
        "logs")
            local service="${2:-all}"
            if [[ "$service" == "all" ]]; then
                docker-compose -f docker-compose.production.yml logs -f
            else
                docker-compose -f docker-compose.production.yml logs -f "$service"
            fi
            ;;
        *)
            echo "🚀 Automação Completa - My-WA-API"
            echo "================================="
            echo ""
            echo "Uso: $0 <comando>"
            echo ""
            echo "📋 COMANDOS PRINCIPAIS:"
            echo "  setup         - Configuração completa (RECOMENDADO)"
            echo "  status        - Status completo do sistema"
            echo "  health        - Verificação de saúde"
            echo ""
            echo "⚙️ COMANDOS ESPECÍFICOS:"
            echo "  ssl           - Configurar apenas SSL"
            echo "  monitoring    - Configurar apenas monitoramento"
            echo "  backup        - Configurar apenas backup"
            echo "  alerts        - Configurar apenas alertas"
            echo "  deploy        - Deploy da aplicação"
            echo ""
            echo "🔧 COMANDOS DE MANUTENÇÃO:"
            echo "  restart       - Reiniciar todos os serviços"
            echo "  logs [serviço] - Ver logs (deixe vazio para todos)"
            echo ""
            echo "🎯 PARA COMEÇAR:"
            echo "  Execute: $0 setup"
            echo ""
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
