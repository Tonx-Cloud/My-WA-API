#!/bin/bash

# Sistema de alertas integrado - My-WA-API
# Suporte para Slack, Discord, Email e WhatsApp
# Integração com monitoramento e escalação automática

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
ALERTS_DIR="$PROJECT_ROOT/alerts"
CONFIG_FILE="$PROJECT_ROOT/.alerts-config"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Função para logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$ALERTS_DIR/alerts.log"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$ALERTS_DIR/alerts.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$ALERTS_DIR/alerts.log"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$ALERTS_DIR/alerts.log"
}

# Função para carregar configurações
load_config() {
    # Carregar variáveis de ambiente
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Configurações de alertas
    ALERTS_ENABLED=${ALERTS_ENABLED:-true}
    ALERTS_RATE_LIMIT=${ALERTS_RATE_LIMIT:-5} # máximo por hora
    
    # Slack
    SLACK_ENABLED=${SLACK_ENABLED:-false}
    SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}
    SLACK_CHANNEL=${SLACK_CHANNEL:-#alerts}
    
    # Discord
    DISCORD_ENABLED=${DISCORD_ENABLED:-false}
    DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL:-}
    
    # Email (SMTP)
    EMAIL_ENABLED=${EMAIL_ENABLED:-false}
    SMTP_HOST=${SMTP_HOST:-}
    SMTP_PORT=${SMTP_PORT:-587}
    SMTP_USER=${SMTP_USER:-}
    SMTP_PASS=${SMTP_PASS:-}
    EMAIL_FROM=${EMAIL_FROM:-alerts@mywaapi.com}
    EMAIL_TO=${EMAIL_TO:-admin@mywaapi.com}
    
    # WhatsApp (usando própria API)
    WHATSAPP_ENABLED=${WHATSAPP_ENABLED:-false}
    WHATSAPP_INSTANCE=${WHATSAPP_INSTANCE:-}
    WHATSAPP_NUMBER=${WHATSAPP_NUMBER:-}
    
    # Escalação
    ESCALATION_ENABLED=${ESCALATION_ENABLED:-true}
    ESCALATION_TIMEOUT=${ESCALATION_TIMEOUT:-30} # minutos
    
    log "Configurações de alertas carregadas:"
    log "  Alertas habilitados: $ALERTS_ENABLED"
    log "  Limite de taxa: $ALERTS_RATE_LIMIT/hora"
    log "  Slack: $SLACK_ENABLED"
    log "  Discord: $DISCORD_ENABLED"
    log "  Email: $EMAIL_ENABLED"
    log "  WhatsApp: $WHATSAPP_ENABLED"
}

# Função para verificar rate limiting
check_rate_limit() {
    local alert_type="$1"
    local rate_file="$ALERTS_DIR/.rate_${alert_type}"
    local current_hour=$(date +%Y%m%d%H)
    
    # Limpar contadores antigos
    if [[ -f "$rate_file" ]]; then
        local last_hour=$(cat "$rate_file" | head -n1)
        if [[ "$last_hour" != "$current_hour" ]]; then
            echo "$current_hour" > "$rate_file"
            echo "0" >> "$rate_file"
        fi
    else
        echo "$current_hour" > "$rate_file"
        echo "0" >> "$rate_file"
    fi
    
    # Verificar contador atual
    local count=$(tail -n1 "$rate_file")
    if [[ $count -ge $ALERTS_RATE_LIMIT ]]; then
        log_warning "Rate limit atingido para $alert_type ($count/$ALERTS_RATE_LIMIT)"
        return 1
    fi
    
    # Incrementar contador
    echo "$current_hour" > "$rate_file"
    echo $((count + 1)) >> "$rate_file"
    
    return 0
}

# Função para enviar alerta via Slack
send_slack_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local additional_data="$4"
    
    if [[ "$SLACK_ENABLED" != "true" || -z "$SLACK_WEBHOOK_URL" ]]; then
        return 0
    fi
    
    if ! check_rate_limit "slack"; then
        return 1
    fi
    
    # Definir cor baseada na severidade
    local color
    case "$severity" in
        "critical") color="danger" ;;
        "warning") color="warning" ;;
        "info") color="good" ;;
        *) color="#439FE0" ;;
    esac
    
    # Preparar payload
    local payload=$(cat << EOF
{
    "channel": "$SLACK_CHANNEL",
    "username": "My-WA-API Monitor",
    "icon_emoji": ":warning:",
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": [
                {
                    "title": "Severidade",
                    "value": "$severity",
                    "short": true
                },
                {
                    "title": "Timestamp", 
                    "value": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
                    "short": true
                },
                {
                    "title": "Servidor",
                    "value": "$(hostname)",
                    "short": true
                }
            ],
            "footer": "My-WA-API Monitoring",
            "ts": $(date +%s)
        }
    ]
}
EOF
    )
    
    # Adicionar dados extras se fornecidos
    if [[ -n "$additional_data" ]]; then
        payload=$(echo "$payload" | jq --arg data "$additional_data" '.attachments[0].fields += [{"title": "Detalhes", "value": $data, "short": false}]')
    fi
    
    # Enviar webhook
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$SLACK_WEBHOOK_URL")
    
    if [[ "$response" == "ok" ]]; then
        log_success "Alerta enviado para Slack"
    else
        log_error "Falha ao enviar para Slack: $response"
        return 1
    fi
}

# Função para enviar alerta via Discord
send_discord_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local additional_data="$4"
    
    if [[ "$DISCORD_ENABLED" != "true" || -z "$DISCORD_WEBHOOK_URL" ]]; then
        return 0
    fi
    
    if ! check_rate_limit "discord"; then
        return 1
    fi
    
    # Definir cor baseada na severidade
    local color
    case "$severity" in
        "critical") color=16711680 ;;  # Vermelho
        "warning") color=16776960 ;;   # Amarelo
        "info") color=65280 ;;         # Verde
        *) color=4474111 ;;            # Azul
    esac
    
    # Emoji baseado na severidade
    local emoji
    case "$severity" in
        "critical") emoji="🚨" ;;
        "warning") emoji="⚠️" ;;
        "info") emoji="ℹ️" ;;
        *) emoji="📊" ;;
    esac
    
    # Preparar embed
    local embed=$(cat << EOF
{
    "username": "My-WA-API Monitor",
    "avatar_url": "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/26a0.png",
    "embeds": [
        {
            "title": "$emoji $title",
            "description": "$message",
            "color": $color,
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "fields": [
                {
                    "name": "Severidade",
                    "value": "$severity",
                    "inline": true
                },
                {
                    "name": "Servidor",
                    "value": "$(hostname)",
                    "inline": true
                }
            ],
            "footer": {
                "text": "My-WA-API Monitoring System"
            }
        }
    ]
}
EOF
    )
    
    # Adicionar dados extras se fornecidos
    if [[ -n "$additional_data" ]]; then
        embed=$(echo "$embed" | jq --arg data "$additional_data" '.embeds[0].fields += [{"name": "Detalhes", "value": $data, "inline": false}]')
    fi
    
    # Enviar webhook
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$embed" \
        "$DISCORD_WEBHOOK_URL")
    
    if [[ -z "$response" ]]; then
        log_success "Alerta enviado para Discord"
    else
        log_error "Falha ao enviar para Discord: $response"
        return 1
    fi
}

# Função para enviar alerta via Email
send_email_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local additional_data="$4"
    
    if [[ "$EMAIL_ENABLED" != "true" || -z "$SMTP_HOST" ]]; then
        return 0
    fi
    
    if ! check_rate_limit "email"; then
        return 1
    fi
    
    # Preparar corpo do email
    local email_body=$(cat << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>$title</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .alert-critical { border-left: 5px solid #dc3545; }
        .alert-warning { border-left: 5px solid #ffc107; }
        .alert-info { border-left: 5px solid #17a2b8; }
        .details { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header alert-$severity">
        <h2>🚨 $title</h2>
        <p><strong>Severidade:</strong> $severity</p>
        <p><strong>Timestamp:</strong> $(date -u +%Y-%m-%dT%H:%M:%SZ)</p>
        <p><strong>Servidor:</strong> $(hostname)</p>
    </div>
    
    <div class="details">
        <h3>Mensagem</h3>
        <p>$message</p>
        
        $(if [[ -n "$additional_data" ]]; then
            echo "<h3>Detalhes Adicionais</h3><pre>$additional_data</pre>"
        fi)
    </div>
    
    <div class="footer">
        <p>Este alerta foi gerado automaticamente pelo sistema de monitoramento My-WA-API.</p>
        <p>Para mais informações, acesse o dashboard de monitoramento ou verifique os logs do sistema.</p>
    </div>
</body>
</html>
EOF
    )
    
    # Enviar email usando sendemail ou msmtp
    if command -v sendemail &> /dev/null; then
        echo "$email_body" | sendemail \
            -f "$EMAIL_FROM" \
            -t "$EMAIL_TO" \
            -u "[$severity] $title - My-WA-API" \
            -s "$SMTP_HOST:$SMTP_PORT" \
            -xu "$SMTP_USER" \
            -xp "$SMTP_PASS" \
            -o tls=yes \
            -o message-content-type=html
    elif command -v msmtp &> /dev/null; then
        (
            echo "To: $EMAIL_TO"
            echo "From: $EMAIL_FROM"
            echo "Subject: [$severity] $title - My-WA-API"
            echo "Content-Type: text/html; charset=utf-8"
            echo ""
            echo "$email_body"
        ) | msmtp "$EMAIL_TO"
    else
        log_error "Nenhum cliente de email encontrado (sendemail ou msmtp)"
        return 1
    fi
    
    if [[ $? -eq 0 ]]; then
        log_success "Alerta enviado por email"
    else
        log_error "Falha ao enviar email"
        return 1
    fi
}

# Função para enviar alerta via WhatsApp
send_whatsapp_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local additional_data="$4"
    
    if [[ "$WHATSAPP_ENABLED" != "true" || -z "$WHATSAPP_INSTANCE" || -z "$WHATSAPP_NUMBER" ]]; then
        return 0
    fi
    
    if ! check_rate_limit "whatsapp"; then
        return 1
    fi
    
    # Emoji baseado na severidade
    local emoji
    case "$severity" in
        "critical") emoji="🚨" ;;
        "warning") emoji="⚠️" ;;
        "info") emoji="ℹ️" ;;
        *) emoji="📊" ;;
    esac
    
    # Preparar mensagem
    local whatsapp_message="$emoji *$title*

*Severidade:* $severity
*Timestamp:* $(date -u +%Y-%m-%dT%H:%M:%SZ)
*Servidor:* $(hostname)

*Mensagem:*
$message"
    
    if [[ -n "$additional_data" ]]; then
        whatsapp_message="$whatsapp_message

*Detalhes:*
\`\`\`$additional_data\`\`\`"
    fi
    
    # Enviar via API local
    local response=$(curl -s -X POST \
        "http://localhost:3000/api/instances/$WHATSAPP_INSTANCE/messages" \
        -H "Content-Type: application/json" \
        -d "{
            \"number\": \"$WHATSAPP_NUMBER\",
            \"text\": \"$whatsapp_message\"
        }")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log_success "Alerta enviado via WhatsApp"
    else
        log_error "Falha ao enviar WhatsApp: $response"
        return 1
    fi
}

# Função para registrar escalação
register_escalation() {
    local alert_id="$1"
    local escalation_file="$ALERTS_DIR/.escalation_$alert_id"
    
    echo "$(date +%s)" > "$escalation_file"
    log "Escalação registrada para alerta: $alert_id"
}

# Função para verificar escalações pendentes
check_escalations() {
    log "Verificando escalações pendentes..."
    
    for escalation_file in "$ALERTS_DIR"/.escalation_*; do
        if [[ -f "$escalation_file" ]]; then
            local alert_id=$(basename "$escalation_file" | sed 's/\.escalation_//')
            local start_time=$(cat "$escalation_file")
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            local timeout_seconds=$((ESCALATION_TIMEOUT * 60))
            
            if [[ $elapsed -ge $timeout_seconds ]]; then
                log_warning "Escalação timeout para alerta: $alert_id"
                
                # Enviar alerta de escalação
                send_alert "critical" \
                    "Escalação de Alerta" \
                    "Alerta $alert_id não foi resolvido em $ESCALATION_TIMEOUT minutos" \
                    "Tempo decorrido: $((elapsed / 60)) minutos"
                
                # Remover arquivo de escalação
                rm -f "$escalation_file"
            fi
        fi
    done
}

# Função principal para enviar alertas
send_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local additional_data="$4"
    local alert_id="${5:-$(date +%s)-$(shuf -i 1000-9999 -n 1)}"
    
    if [[ "$ALERTS_ENABLED" != "true" ]]; then
        log_warning "Sistema de alertas está desabilitado"
        return 0
    fi
    
    log "📢 Enviando alerta: $title (Severidade: $severity)"
    
    # Registrar alerta
    local alert_record="$ALERTS_DIR/sent/$(date +%Y%m%d)_$alert_id.json"
    mkdir -p "$(dirname "$alert_record")"
    
    cat > "$alert_record" << EOF
{
    "id": "$alert_id",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "severity": "$severity",
    "title": "$title",
    "message": "$message",
    "additional_data": "$additional_data",
    "hostname": "$(hostname)",
    "sent_channels": []
}
EOF
    
    # Enviar para todos os canais habilitados
    local sent_channels=()
    
    # Slack
    if send_slack_alert "$severity" "$title" "$message" "$additional_data"; then
        sent_channels+=("slack")
    fi
    
    # Discord
    if send_discord_alert "$severity" "$title" "$message" "$additional_data"; then
        sent_channels+=("discord")
    fi
    
    # Email
    if send_email_alert "$severity" "$title" "$message" "$additional_data"; then
        sent_channels+=("email")
    fi
    
    # WhatsApp
    if send_whatsapp_alert "$severity" "$title" "$message" "$additional_data"; then
        sent_channels+=("whatsapp")
    fi
    
    # Atualizar registro com canais enviados
    local channels_json=$(printf '%s\n' "${sent_channels[@]}" | jq -R . | jq -s .)
    jq --argjson channels "$channels_json" '.sent_channels = $channels' "$alert_record" > "$alert_record.tmp" && mv "$alert_record.tmp" "$alert_record"
    
    # Registrar escalação se necessário
    if [[ "$severity" == "critical" && "$ESCALATION_ENABLED" == "true" ]]; then
        register_escalation "$alert_id"
    fi
    
    log_success "Alerta $alert_id enviado para ${#sent_channels[@]} canal(is)"
}

# Função para testar alertas
test_alerts() {
    log "🧪 Testando sistema de alertas..."
    
    # Teste básico
    send_alert "info" \
        "Teste do Sistema de Alertas" \
        "Este é um teste para verificar se o sistema de alertas está funcionando corretamente." \
        "Timestamp de teste: $(date)"
    
    # Teste de diferentes severidades
    sleep 5
    send_alert "warning" \
        "Teste de Alerta de Warning" \
        "Simulando um alerta de aviso." \
        "CPU: 85%, Memória: 78%"
    
    sleep 5
    send_alert "critical" \
        "Teste de Alerta Crítico" \
        "Simulando um alerta crítico para testar escalação." \
        "Serviço API offline há 2 minutos"
    
    log_success "Testes de alertas concluídos"
}

# Função para configurar webhooks
setup_webhooks() {
    log "⚙️ Configurando webhooks de alertas..."
    
    # Criar templates de configuração
    cat > "$ALERTS_DIR/slack-setup.md" << 'EOF'
# Configuração do Slack

1. Acesse https://api.slack.com/apps
2. Clique em "Create New App" > "From scratch"
3. Nome: "My-WA-API Monitor"
4. Selecione o workspace
5. Vá em "Incoming Webhooks" e ative
6. Clique em "Add New Webhook to Workspace"
7. Selecione o canal #alerts
8. Copie a URL do webhook
9. Adicione ao .env.production:
   SLACK_ENABLED=true
   SLACK_WEBHOOK_URL=sua_url_aqui
   SLACK_CHANNEL=#alerts
EOF
    
    cat > "$ALERTS_DIR/discord-setup.md" << 'EOF'
# Configuração do Discord

1. Acesse suas configurações de servidor no Discord
2. Vá em "Integrações" > "Webhooks"
3. Clique em "Criar Webhook"
4. Nome: "My-WA-API Monitor"
5. Selecione o canal #alerts
6. Copie a URL do webhook
7. Adicione ao .env.production:
   DISCORD_ENABLED=true
   DISCORD_WEBHOOK_URL=sua_url_aqui
EOF
    
    cat > "$ALERTS_DIR/email-setup.md" << 'EOF'
# Configuração do Email (SMTP)

Adicione ao .env.production:
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
EMAIL_FROM=alerts@mywaapi.com
EMAIL_TO=admin@mywaapi.com

Para Gmail, use senhas de app:
https://support.google.com/mail/answer/185833
EOF
    
    log_success "Templates de configuração criados em $ALERTS_DIR/"
    log "Consulte os arquivos *-setup.md para configurar cada canal"
}

# Função para monitorar alertas em tempo real
monitor_alerts() {
    log "👀 Iniciando monitoramento de alertas em tempo real..."
    
    # Monitorar logs de erro da aplicação
    (
        tail -f "$PROJECT_ROOT/logs/error.log" 2>/dev/null | while read line; do
            if echo "$line" | grep -i "error\|exception\|fatal" > /dev/null; then
                send_alert "warning" \
                    "Erro Detectado nos Logs" \
                    "Erro detectado na aplicação" \
                    "$line"
            fi
        done
    ) &
    
    # Verificar escalações periodicamente
    while true; do
        check_escalations
        sleep 300 # 5 minutos
    done
}

# Função principal
main() {
    # Criar diretório de alertas
    mkdir -p "$ALERTS_DIR/sent"
    
    # Carregar configurações
    load_config
    
    case "${1:-help}" in
        "send")
            local severity="${2:-info}"
            local title="${3:-Alerta Teste}"
            local message="${4:-Mensagem de teste}"
            local additional_data="${5:-}"
            send_alert "$severity" "$title" "$message" "$additional_data"
            ;;
        "test")
            test_alerts
            ;;
        "setup")
            setup_webhooks
            ;;
        "monitor")
            monitor_alerts
            ;;
        "escalations")
            check_escalations
            ;;
        "list")
            log "Alertas enviados hoje:"
            ls -la "$ALERTS_DIR/sent/$(date +%Y%m%d)"*.json 2>/dev/null || log "Nenhum alerta enviado hoje"
            ;;
        "stats")
            log "Estatísticas de alertas:"
            local total=$(find "$ALERTS_DIR/sent" -name "*.json" | wc -l)
            local today=$(find "$ALERTS_DIR/sent" -name "$(date +%Y%m%d)*.json" | wc -l)
            log "  Total: $total"
            log "  Hoje: $today"
            
            # Estatísticas por severidade
            for severity in critical warning info; do
                local count=$(find "$ALERTS_DIR/sent" -name "*.json" -exec grep -l "\"severity\": \"$severity\"" {} \; | wc -l)
                log "  $severity: $count"
            done
            ;;
        *)
            echo "Sistema de Alertas - My-WA-API"
            echo ""
            echo "Uso: $0 <comando> [argumentos]"
            echo ""
            echo "Comandos:"
            echo "  send <severity> <título> <mensagem> [dados]  - Enviar alerta"
            echo "  test                                         - Testar sistema de alertas"
            echo "  setup                                        - Configurar webhooks"
            echo "  monitor                                      - Monitorar em tempo real"
            echo "  escalations                                  - Verificar escalações"
            echo "  list                                         - Listar alertas do dia"
            echo "  stats                                        - Estatísticas de alertas"
            echo ""
            echo "Severidades: critical, warning, info"
            echo ""
            echo "Exemplo:"
            echo "  $0 send warning 'API Lenta' 'Tempo de resposta acima de 2s'"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
