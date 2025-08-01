#!/bin/bash

# Script de configuração SSL automatizada - My-WA-API
# Implementa certificados Let's Encrypt com Certbot e renovação automática

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
SSL_DIR="$PROJECT_ROOT/docker/nginx/ssl"
DOMAINS_FILE="$PROJECT_ROOT/.domains"
CLOUDFLARE_CREDENTIALS="$PROJECT_ROOT/.cloudflare"

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
    log "Verificando dependências para SSL..."
    
    # Verificar se está rodando como root
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script precisa ser executado como root para instalar certificados"
        exit 1
    fi
    
    # Instalar certbot se não existir
    if ! command -v certbot &> /dev/null; then
        log "Instalando Certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx python3-certbot-dns-cloudflare
    fi
    
    # Verificar openssl
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL não encontrado!"
        exit 1
    fi
    
    # Verificar dig
    if ! command -v dig &> /dev/null; then
        log "Instalando dnsutils..."
        apt-get install -y dnsutils
    fi
    
    log_success "Dependências verificadas"
}

# Função para carregar configuração de domínios
load_domains() {
    if [[ ! -f "$DOMAINS_FILE" ]]; then
        log_warning "Arquivo .domains não encontrado. Criando exemplo..."
        cat > "$DOMAINS_FILE" << EOF
# Configuração de domínios para SSL
# Um domínio por linha, formato: tipo:dominio
# Tipos disponíveis: api, web, both

api:api.seudominio.com
web:app.seudominio.com
web:www.seudominio.com
EOF
        log_error "Configure os domínios em $DOMAINS_FILE e execute novamente"
        exit 1
    fi
    
    # Carregar domínios do arquivo
    API_DOMAINS=()
    WEB_DOMAINS=()
    ALL_DOMAINS=()
    
    while IFS=: read -r type domain; do
        # Ignorar linhas vazias e comentários
        [[ -z "$domain" || "$domain" =~ ^#.*$ ]] && continue
        
        domain=$(echo "$domain" | xargs) # Trim spaces
        ALL_DOMAINS+=("$domain")
        
        case "$type" in
            "api")
                API_DOMAINS+=("$domain")
                ;;
            "web")
                WEB_DOMAINS+=("$domain")
                ;;
            "both")
                API_DOMAINS+=("$domain")
                WEB_DOMAINS+=("$domain")
                ;;
        esac
    done < "$DOMAINS_FILE"
    
    log "Domínios carregados:"
    log "  API: ${API_DOMAINS[*]}"
    log "  Web: ${WEB_DOMAINS[*]}"
    log "  Total: ${#ALL_DOMAINS[@]} domínios"
}

# Função para verificar DNS
verify_dns() {
    log "Verificando resolução DNS..."
    
    local failed=false
    
    for domain in "${ALL_DOMAINS[@]}"; do
        log "Verificando $domain..."
        
        # Verificar registro A
        if dig +short A "$domain" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' > /dev/null; then
            local ip=$(dig +short A "$domain" | head -1)
            log_success "$domain -> $ip"
        else
            log_error "$domain não resolve para IP válido"
            failed=true
        fi
        
        # Verificar TTL
        local ttl=$(dig "$domain" | grep -E "^$domain" | awk '{print $2}' | head -1)
        if [[ -n "$ttl" && "$ttl" -gt 300 ]]; then
            log_warning "$domain tem TTL alto ($ttl). Recomendado: ≤300 durante migração"
        fi
    done
    
    if [[ "$failed" == "true" ]]; then
        log_error "Falha na verificação DNS. Configure os registros antes de prosseguir"
        exit 1
    fi
    
    log_success "Verificação DNS concluída"
}

# Função para configurar Cloudflare (se disponível)
setup_cloudflare() {
    if [[ -f "$CLOUDFLARE_CREDENTIALS" ]]; then
        log "Configuração Cloudflare encontrada"
        export CLOUDFLARE_DNS_API_TOKEN=$(grep "dns_cloudflare_api_token" "$CLOUDFLARE_CREDENTIALS" | cut -d'=' -f2 | xargs)
        return 0
    else
        log_warning "Arquivo de credenciais Cloudflare não encontrado"
        cat > "$CLOUDFLARE_CREDENTIALS.example" << EOF
# Configurações Cloudflare para Certbot
# Renomeie para .cloudflare e configure suas credenciais

dns_cloudflare_api_token = your_cloudflare_api_token_here
EOF
        return 1
    fi
}

# Função para gerar certificado Let's Encrypt
generate_letsencrypt() {
    log "Gerando certificados Let's Encrypt..."
    
    # Criar diretório SSL
    mkdir -p "$SSL_DIR"
    
    # Preparar lista de domínios
    local domain_args=""
    for domain in "${ALL_DOMAINS[@]}"; do
        domain_args="$domain_args -d $domain"
    done
    
    # Tentar usar DNS challenge se Cloudflare estiver configurado
    if setup_cloudflare; then
        log "Usando DNS challenge com Cloudflare..."
        certbot certonly \
            --dns-cloudflare \
            --dns-cloudflare-credentials "$CLOUDFLARE_CREDENTIALS" \
            --dns-cloudflare-propagation-seconds 60 \
            $domain_args \
            --agree-tos \
            --non-interactive \
            --email "admin@${ALL_DOMAINS[0]}" \
            --cert-name my-wa-api
    else
        # Fallback para webroot ou standalone
        log "Usando standalone challenge..."
        log_warning "Certifique-se de que as portas 80 e 443 estão acessíveis"
        
        certbot certonly \
            --standalone \
            $domain_args \
            --agree-tos \
            --non-interactive \
            --email "admin@${ALL_DOMAINS[0]}" \
            --cert-name my-wa-api
    fi
    
    # Copiar certificados para diretório do projeto
    if [[ -d "/etc/letsencrypt/live/my-wa-api" ]]; then
        cp "/etc/letsencrypt/live/my-wa-api/fullchain.pem" "$SSL_DIR/cert.pem"
        cp "/etc/letsencrypt/live/my-wa-api/privkey.pem" "$SSL_DIR/key.pem"
        
        # Definir permissões corretas
        chmod 644 "$SSL_DIR/cert.pem"
        chmod 600 "$SSL_DIR/key.pem"
        
        log_success "Certificados Let's Encrypt gerados e copiados"
    else
        log_error "Falha na geração dos certificados Let's Encrypt"
        return 1
    fi
}

# Função para gerar certificados auto-assinados
generate_selfsigned() {
    log "Gerando certificados auto-assinados para desenvolvimento..."
    
    mkdir -p "$SSL_DIR"
    
    # Gerar certificado principal
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=MyWAAPI/CN=${ALL_DOMAINS[0]}" \
        -extensions v3_req \
        -config <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=BR
ST=SP
L=SaoPaulo
O=MyWAAPI
CN=${ALL_DOMAINS[0]}

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
$(for i in "${!ALL_DOMAINS[@]}"; do echo "DNS.$((i+1))=${ALL_DOMAINS[i]}"; done)
EOF
)
    
    # Gerar certificado padrão
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/default-key.pem" \
        -out "$SSL_DIR/default.pem" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=MyWAAPI/CN=default"
    
    # Definir permissões
    chmod 644 "$SSL_DIR"/*.pem
    chmod 600 "$SSL_DIR"/*key*.pem
    
    log_success "Certificados auto-assinados gerados"
}

# Função para verificar certificados
verify_certificates() {
    log "Verificando certificados SSL..."
    
    if [[ ! -f "$SSL_DIR/cert.pem" || ! -f "$SSL_DIR/key.pem" ]]; then
        log_error "Certificados não encontrados em $SSL_DIR"
        return 1
    fi
    
    # Verificar validade do certificado
    local cert_info=$(openssl x509 -in "$SSL_DIR/cert.pem" -text -noout)
    local expiry_date=$(echo "$cert_info" | grep "Not After" | sed 's/.*Not After : //')
    local common_name=$(echo "$cert_info" | grep "Subject:" | sed 's/.*CN = //' | cut -d',' -f1)
    
    log "Informações do certificado:"
    log "  CN: $common_name"
    log "  Expira em: $expiry_date"
    
    # Verificar SAN (Subject Alternative Names)
    local san_domains=$(echo "$cert_info" | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g' | sed 's/, /\n/g')
    log "  Domínios SAN:"
    echo "$san_domains" | while read -r domain; do
        [[ -n "$domain" ]] && log "    - $domain"
    done
    
    # Testar se chave e certificado combinam
    local cert_hash=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -modulus | openssl md5)
    local key_hash=$(openssl rsa -in "$SSL_DIR/key.pem" -noout -modulus | openssl md5)
    
    if [[ "$cert_hash" == "$key_hash" ]]; then
        log_success "Certificado e chave privada são compatíveis"
    else
        log_error "Certificado e chave privada NÃO são compatíveis"
        return 1
    fi
}

# Função para configurar renovação automática
setup_auto_renewal() {
    log "Configurando renovação automática..."
    
    # Criar script de renovação
    cat > "/usr/local/bin/my-wa-api-cert-renewal.sh" << 'EOF'
#!/bin/bash
# Script de renovação automática para My-WA-API

# Renovar certificados
/usr/bin/certbot renew --quiet

# Se renovação foi bem-sucedida, copiar certificados
if [[ $? -eq 0 ]]; then
    SCRIPT_DIR="/opt/my-wa-api"
    SSL_DIR="$SCRIPT_DIR/docker/nginx/ssl"
    
    if [[ -d "/etc/letsencrypt/live/my-wa-api" ]]; then
        cp "/etc/letsencrypt/live/my-wa-api/fullchain.pem" "$SSL_DIR/cert.pem"
        cp "/etc/letsencrypt/live/my-wa-api/privkey.pem" "$SSL_DIR/key.pem"
        
        # Recarregar Nginx
        docker-compose -f "$SCRIPT_DIR/docker-compose.production.yml" exec nginx nginx -s reload
        
        echo "$(date): Certificados renovados e Nginx recarregado" >> /var/log/my-wa-api-cert-renewal.log
    fi
fi
EOF
    
    chmod +x "/usr/local/bin/my-wa-api-cert-renewal.sh"
    
    # Configurar cron job
    (crontab -l 2>/dev/null; echo "0 3 */15 * * /usr/local/bin/my-wa-api-cert-renewal.sh") | crontab -
    
    log_success "Renovação automática configurada (cron job a cada 15 dias às 3h)"
}

# Função para testar SSL
test_ssl() {
    log "Testando configuração SSL..."
    
    for domain in "${ALL_DOMAINS[@]}"; do
        log "Testando $domain..."
        
        # Testar se o domínio resolve
        if ! dig +short A "$domain" > /dev/null; then
            log_warning "$domain não resolve, pulando teste SSL"
            continue
        fi
        
        # Testar conexão SSL
        local ssl_test=$(echo | timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null)
        
        if echo "$ssl_test" | grep -q "Verify return code: 0"; then
            log_success "$domain - SSL válido"
        elif echo "$ssl_test" | grep -q "self signed certificate"; then
            log_warning "$domain - Certificado auto-assinado"
        else
            log_error "$domain - Problema SSL"
        fi
    done
}

# Função principal
main() {
    log "🔒 Configuração SSL automatizada - My-WA-API"
    
    case "${1:-auto}" in
        "check")
            load_domains
            verify_dns
            verify_certificates
            test_ssl
            ;;
        "letsencrypt")
            check_dependencies
            load_domains
            verify_dns
            generate_letsencrypt
            verify_certificates
            setup_auto_renewal
            test_ssl
            ;;
        "selfsigned")
            load_domains
            generate_selfsigned
            verify_certificates
            ;;
        "renew")
            /usr/local/bin/my-wa-api-cert-renewal.sh
            ;;
        "auto")
            check_dependencies
            load_domains
            verify_dns
            
            # Tentar Let's Encrypt primeiro
            if generate_letsencrypt; then
                setup_auto_renewal
            else
                log_warning "Falha no Let's Encrypt, usando certificados auto-assinados"
                generate_selfsigned
            fi
            
            verify_certificates
            test_ssl
            ;;
        *)
            echo "Uso: $0 [check|letsencrypt|selfsigned|renew|auto]"
            echo ""
            echo "Comandos:"
            echo "  check       - Verificar DNS e certificados existentes"
            echo "  letsencrypt - Gerar certificados Let's Encrypt"
            echo "  selfsigned  - Gerar certificados auto-assinados"
            echo "  renew       - Renovar certificados"
            echo "  auto        - Configuração automática (padrão)"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
