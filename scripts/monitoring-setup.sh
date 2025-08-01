#!/bin/bash

# Script de configuração de monitoramento - My-WA-API
# Configura stack completa Prometheus + Grafana + Alertmanager

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
ENV_FILE="$PROJECT_ROOT/.env.production"

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
    log "Verificando dependências do monitoramento..."
    
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
    
    # Verificar se a aplicação principal está rodando
    if ! docker ps | grep -q "my-wa-api"; then
        log_warning "Aplicação principal não está rodando. Execute primeiro o deploy principal."
    fi
    
    log_success "Dependências verificadas"
}

# Função para criar estrutura de diretórios
create_directory_structure() {
    log "Criando estrutura de diretórios..."
    
    # Diretórios necessários
    local dirs=(
        "$MONITORING_DIR/grafana/provisioning/datasources"
        "$MONITORING_DIR/grafana/provisioning/dashboards"
        "$MONITORING_DIR/grafana/dashboards"
        "$MONITORING_DIR/prometheus/rules"
        "$MONITORING_DIR/alertmanager/templates"
        "$MONITORING_DIR/blackbox"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log "Criado: $dir"
    done
    
    log_success "Estrutura de diretórios criada"
}

# Função para configurar datasources do Grafana
setup_grafana_datasources() {
    log "Configurando datasources do Grafana..."
    
    cat > "$MONITORING_DIR/grafana/provisioning/datasources/datasources.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: GET
      manageAlerts: true
      alertmanagerUid: alertmanager

  - name: Alertmanager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    uid: alertmanager
    editable: true
    jsonData:
      implementation: prometheus
EOF
    
    log_success "Datasources configurados"
}

# Função para configurar dashboards do Grafana
setup_grafana_dashboards() {
    log "Configurando dashboards do Grafana..."
    
    # Configuração de provisioning
    cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboards.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'my-wa-api'
    orgId: 1
    folder: 'My-WA-API'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    # Dashboard principal da API
    cat > "$MONITORING_DIR/grafana/dashboards/api-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "My-WA-API - Visão Geral",
    "tags": ["my-wa-api", "overview"],
    "timezone": "America/Sao_Paulo",
    "panels": [
      {
        "id": 1,
        "title": "Status da API",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"my-wa-api\"}",
            "legendFormat": "API Status"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Requests por Segundo",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "RPS"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    log_success "Dashboards configurados"
}

# Função para configurar alertas customizados
setup_custom_alerts() {
    log "Configurando alertas customizados..."
    
    # Template de alerta para Slack
    cat > "$MONITORING_DIR/alertmanager/templates/slack.tmpl" << 'EOF'
{{ define "slack.my-wa-api.title" }}
[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}
{{ end }}

{{ define "slack.my-wa-api.text" }}
{{ range .Alerts }}
*Alerta:* {{ .Annotations.summary }}
*Descrição:* {{ .Annotations.description }}
*Severidade:* {{ .Labels.severity }}
*Serviço:* {{ .Labels.service }}
*Horário:* {{ .StartsAt.Format "15:04:05 02/01/2006" }}
{{ if .Labels.instance }}*Instância:* {{ .Labels.instance }}{{ end }}
{{ end }}
{{ end }}
EOF
    
    log_success "Alertas customizados configurados"
}

# Função para validar configurações
validate_configurations() {
    log "Validando configurações..."
    
    # Validar Prometheus config
    if docker run --rm -v "$MONITORING_DIR/prometheus:/etc/prometheus" prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml; then
        log_success "Configuração do Prometheus válida"
    else
        log_error "Configuração do Prometheus inválida!"
        return 1
    fi
    
    # Validar regras de alerta
    if docker run --rm -v "$MONITORING_DIR/prometheus:/etc/prometheus" prom/prometheus:latest promtool check rules /etc/prometheus/rules/*.yml; then
        log_success "Regras de alerta válidas"
    else
        log_error "Regras de alerta inválidas!"
        return 1
    fi
    
    # Validar Alertmanager config
    if docker run --rm -v "$MONITORING_DIR/alertmanager:/etc/alertmanager" prom/alertmanager:latest amtool check-config /etc/alertmanager/alertmanager.yml; then
        log_success "Configuração do Alertmanager válida"
    else
        log_error "Configuração do Alertmanager inválida!"
        return 1
    fi
}

# Função para iniciar monitoramento
start_monitoring() {
    log "Iniciando stack de monitoramento..."
    
    cd "$PROJECT_ROOT"
    
    # Carregar variáveis de ambiente
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Definir senhas padrão se não existirem
    export GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"admin123"}
    export PROMETHEUS_PORT=${PROMETHEUS_PORT:-"9090"}
    export GRAFANA_PORT=${GRAFANA_PORT:-"3030"}
    
    # Subir stack de monitoramento
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços iniciarem..."
    sleep 30
    
    # Verificar se serviços estão respondendo
    local services=("prometheus:9090" "grafana:3030" "alertmanager:9093")
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -f -s "http://localhost:$port" > /dev/null; then
            log_success "$name está respondendo"
        else
            log_warning "$name pode não estar totalmente pronto ainda"
        fi
    done
    
    log_success "Stack de monitoramento iniciada"
}

# Função para mostrar informações de acesso
show_access_info() {
    log "📊 Informações de acesso:"
    echo ""
    echo "🔍 Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
    echo "📈 Grafana: http://localhost:${GRAFANA_PORT:-3030}"
    echo "   Usuário: ${GRAFANA_ADMIN_USER:-admin}"
    echo "   Senha: ${GRAFANA_ADMIN_PASSWORD:-admin123}"
    echo ""
    echo "🚨 Alertmanager: http://localhost:9093"
    echo "📊 Node Exporter: http://localhost:9100"
    echo "🐳 cAdvisor: http://localhost:8080"
    echo ""
    echo "📋 Para ver logs: docker-compose -f docker-compose.monitoring.yml logs -f"
    echo "🛑 Para parar: docker-compose -f docker-compose.monitoring.yml down"
}

# Função para testar alertas
test_alerts() {
    log "Testando sistema de alertas..."
    
    # Criar alerta de teste
    curl -XPOST http://localhost:9093/api/v1/alerts \
        -H "Content-Type: application/json" \
        -d '[{
            "labels": {
                "alertname": "TestAlert",
                "severity": "warning",
                "service": "test"
            },
            "annotations": {
                "summary": "Teste de alerta do My-WA-API",
                "description": "Este é um alerta de teste para verificar a configuração"
            },
            "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "generatorURL": "http://localhost:9090/graph"
        }]'
    
    log_success "Alerta de teste enviado. Verifique os canais configurados."
}

# Função principal
main() {
    log "🚀 Configuração de monitoramento - My-WA-API"
    
    case "${1:-setup}" in
        "setup")
            check_dependencies
            create_directory_structure
            setup_grafana_datasources
            setup_grafana_dashboards
            setup_custom_alerts
            validate_configurations
            start_monitoring
            show_access_info
            ;;
        "start")
            start_monitoring
            show_access_info
            ;;
        "stop")
            log "Parando stack de monitoramento..."
            docker-compose -f docker-compose.monitoring.yml down
            log_success "Stack de monitoramento parada"
            ;;
        "restart")
            docker-compose -f docker-compose.monitoring.yml restart
            log_success "Stack de monitoramento reiniciada"
            ;;
        "logs")
            docker-compose -f docker-compose.monitoring.yml logs -f
            ;;
        "test-alerts")
            test_alerts
            ;;
        "validate")
            validate_configurations
            ;;
        "status")
            docker-compose -f docker-compose.monitoring.yml ps
            ;;
        *)
            echo "Uso: $0 [setup|start|stop|restart|logs|test-alerts|validate|status]"
            echo ""
            echo "Comandos:"
            echo "  setup       - Configuração completa inicial (padrão)"
            echo "  start       - Iniciar stack de monitoramento"
            echo "  stop        - Parar stack de monitoramento"
            echo "  restart     - Reiniciar stack de monitoramento"
            echo "  logs        - Mostrar logs em tempo real"
            echo "  test-alerts - Enviar alerta de teste"
            echo "  validate    - Validar configurações"
            echo "  status      - Mostrar status dos containers"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
