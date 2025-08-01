#!/bin/bash

# Sistema de backup para cloud - My-WA-API
# Suporte para AWS S3 e Google Cloud Storage
# Implementa estratégia 3-2-1 de backup

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
BACKUP_DIR="$PROJECT_ROOT/backups"
CONFIG_FILE="$PROJECT_ROOT/.backup-config"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Função para logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$BACKUP_DIR/backup.log"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$BACKUP_DIR/backup.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$BACKUP_DIR/backup.log"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$BACKUP_DIR/backup.log"
}

# Função para carregar configurações
load_config() {
    # Carregar variáveis de ambiente
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Configurações padrão
    BACKUP_ENABLED=${BACKUP_ENABLED:-true}
    BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
    BACKUP_COMPRESSION=${BACKUP_COMPRESSION:-true}
    
    # AWS S3
    AWS_S3_ENABLED=${AWS_S3_ENABLED:-false}
    AWS_S3_BUCKET=${AWS_S3_BUCKET:-}
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    # Google Cloud Storage
    GCS_ENABLED=${GCS_ENABLED:-false}
    GCS_BUCKET=${GCS_BUCKET:-}
    GCS_PROJECT=${GCS_PROJECT:-}
    
    # Criptografia
    BACKUP_ENCRYPTION=${BACKUP_ENCRYPTION:-true}
    BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-}
    
    log "Configurações carregadas:"
    log "  Backup habilitado: $BACKUP_ENABLED"
    log "  Retenção: $BACKUP_RETENTION_DAYS dias"
    log "  Compressão: $BACKUP_COMPRESSION"
    log "  AWS S3: $AWS_S3_ENABLED"
    log "  Google Cloud: $GCS_ENABLED"
}

# Função para verificar dependências
check_dependencies() {
    log "Verificando dependências para backup em nuvem..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado!"
        return 1
    fi
    
    # AWS CLI (se S3 habilitado)
    if [[ "$AWS_S3_ENABLED" == "true" ]]; then
        if ! command -v aws &> /dev/null; then
            log "Instalando AWS CLI..."
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip -q awscliv2.zip
            sudo ./aws/install
            rm -rf aws awscliv2.zip
        fi
        
        # Verificar credenciais AWS
        if ! aws sts get-caller-identity > /dev/null 2>&1; then
            log_error "Credenciais AWS não configuradas!"
            log "Configure com: aws configure"
            return 1
        fi
        
        log_success "AWS CLI configurado"
    fi
    
    # Google Cloud SDK (se GCS habilitado)
    if [[ "$GCS_ENABLED" == "true" ]]; then
        if ! command -v gsutil &> /dev/null; then
            log "Instalando Google Cloud SDK..."
            curl https://sdk.cloud.google.com | bash
            exec -l $SHELL
            gcloud init
        fi
        
        # Verificar autenticação
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
            log_error "Google Cloud não autenticado!"
            log "Configure com: gcloud auth login"
            return 1
        fi
        
        log_success "Google Cloud SDK configurado"
    fi
    
    # Verificar ferramentas de criptografia
    if [[ "$BACKUP_ENCRYPTION" == "true" ]]; then
        if ! command -v gpg &> /dev/null; then
            log "Instalando GnuPG..."
            apt-get update && apt-get install -y gnupg
        fi
        log_success "Ferramentas de criptografia disponíveis"
    fi
}

# Função para criar backup local
create_local_backup() {
    local backup_name="my-wa-api-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Criando backup local: $backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup do banco de dados
    log "Fazendo backup do PostgreSQL..."
    docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U mywaapi mywaapi > "$backup_path/database.sql"
    
    # Backup dos dados do Redis (se necessário)
    log "Fazendo backup do Redis..."
    docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - > "$backup_path/redis.rdb"
    
    # Backup dos arquivos de sessão
    log "Fazendo backup das sessões..."
    if [[ -d "sessions" ]]; then
        tar -czf "$backup_path/sessions.tar.gz" sessions/
    fi
    
    # Backup dos uploads
    log "Fazendo backup dos uploads..."
    if [[ -d "uploads" ]]; then
        tar -czf "$backup_path/uploads.tar.gz" uploads/
    fi
    
    # Backup dos logs importantes
    log "Fazendo backup dos logs..."
    tar -czf "$backup_path/logs.tar.gz" logs/ --exclude="*.log.*"
    
    # Backup das configurações
    log "Fazendo backup das configurações..."
    cp .env.production "$backup_path/" 2>/dev/null || true
    cp docker-compose.production.yml "$backup_path/"
    tar -czf "$backup_path/docker-configs.tar.gz" docker/
    
    # Informações do backup
    cat > "$backup_path/backup-info.json" << EOF
{
    "backup_name": "$backup_name",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "${VERSION:-unknown}",
    "hostname": "$(hostname)",
    "components": [
        "database",
        "redis", 
        "sessions",
        "uploads",
        "logs",
        "configurations"
    ],
    "size_bytes": $(du -sb "$backup_path" | cut -f1)
}
EOF
    
    # Compressão se habilitada
    if [[ "$BACKUP_COMPRESSION" == "true" ]]; then
        log "Comprimindo backup..."
        tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$backup_name"
        rm -rf "$backup_path"
        backup_path="$backup_path.tar.gz"
    fi
    
    # Criptografia se habilitada
    if [[ "$BACKUP_ENCRYPTION" == "true" && -n "$BACKUP_ENCRYPTION_KEY" ]]; then
        log "Criptografando backup..."
        gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" "$backup_path"
        rm -f "$backup_path"
        backup_path="$backup_path.gpg"
    fi
    
    log_success "Backup local criado: $(basename $backup_path)"
    echo "$backup_path"
}

# Função para upload para AWS S3
upload_to_s3() {
    local backup_file="$1"
    local s3_path="s3://$AWS_S3_BUCKET/my-wa-api/$(basename $backup_file)"
    
    log "Enviando backup para AWS S3: $s3_path"
    
    # Upload com metadados
    aws s3 cp "$backup_file" "$s3_path" \
        --metadata "project=my-wa-api,date=$(date +%Y-%m-%d),retention=$BACKUP_RETENTION_DAYS" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    if [[ $? -eq 0 ]]; then
        log_success "Upload para S3 concluído"
        
        # Configurar lifecycle policy se não existir
        aws s3api get-bucket-lifecycle-configuration --bucket "$AWS_S3_BUCKET" > /dev/null 2>&1 || {
            log "Configurando política de ciclo de vida no S3..."
            cat > /tmp/s3-lifecycle.json << EOF
{
    "Rules": [
        {
            "ID": "my-wa-api-backup-lifecycle",
            "Status": "Enabled",
            "Filter": {"Prefix": "my-wa-api/"},
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 90,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": $((BACKUP_RETENTION_DAYS * 2))
            }
        }
    ]
}
EOF
            aws s3api put-bucket-lifecycle-configuration --bucket "$AWS_S3_BUCKET" --lifecycle-configuration file:///tmp/s3-lifecycle.json
            rm /tmp/s3-lifecycle.json
        }
    else
        log_error "Falha no upload para S3"
        return 1
    fi
}

# Função para upload para Google Cloud Storage
upload_to_gcs() {
    local backup_file="$1"
    local gcs_path="gs://$GCS_BUCKET/my-wa-api/$(basename $backup_file)"
    
    log "Enviando backup para Google Cloud Storage: $gcs_path"
    
    # Upload com metadados
    gsutil -m cp "$backup_file" "$gcs_path"
    gsutil setmeta -h "x-goog-meta-project:my-wa-api" \
                   -h "x-goog-meta-date:$(date +%Y-%m-%d)" \
                   -h "x-goog-meta-retention:$BACKUP_RETENTION_DAYS" \
                   "$gcs_path"
    
    if [[ $? -eq 0 ]]; then
        log_success "Upload para GCS concluído"
        
        # Configurar lifecycle policy se não existir
        if ! gsutil lifecycle get "gs://$GCS_BUCKET" | grep -q "my-wa-api"; then
            log "Configurando política de ciclo de vida no GCS..."
            cat > /tmp/gcs-lifecycle.json << EOF
{
    "rule": [
        {
            "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
            "condition": {
                "age": 30,
                "matchesPrefix": ["my-wa-api/"]
            }
        },
        {
            "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
            "condition": {
                "age": 90,
                "matchesPrefix": ["my-wa-api/"]
            }
        },
        {
            "action": {"type": "Delete"},
            "condition": {
                "age": $((BACKUP_RETENTION_DAYS * 2)),
                "matchesPrefix": ["my-wa-api/"]
            }
        }
    ]
}
EOF
            gsutil lifecycle set /tmp/gcs-lifecycle.json "gs://$GCS_BUCKET"
            rm /tmp/gcs-lifecycle.json
        fi
    else
        log_error "Falha no upload para GCS"
        return 1
    fi
}

# Função para verificar integridade do backup
verify_backup_integrity() {
    local backup_file="$1"
    
    log "Verificando integridade do backup..."
    
    # Verificar se arquivo existe e não está vazio
    if [[ ! -f "$backup_file" || ! -s "$backup_file" ]]; then
        log_error "Arquivo de backup inválido ou vazio"
        return 1
    fi
    
    # Verificar checksum
    local checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
    echo "$checksum" > "$backup_file.sha256"
    
    # Testar descompressão se for comprimido
    if [[ "$backup_file" == *.tar.gz ]]; then
        if tar -tzf "$backup_file" > /dev/null 2>&1; then
            log_success "Arquivo comprimido íntegro"
        else
            log_error "Arquivo comprimido corrompido"
            return 1
        fi
    fi
    
    log_success "Verificação de integridade concluída"
}

# Função para limpeza de backups antigos
cleanup_old_backups() {
    log "Limpando backups antigos (>${BACKUP_RETENTION_DAYS} dias)..."
    
    # Limpeza local
    find "$BACKUP_DIR" -name "my-wa-api-*" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Limpeza S3
    if [[ "$AWS_S3_ENABLED" == "true" ]]; then
        aws s3 ls "s3://$AWS_S3_BUCKET/my-wa-api/" --recursive | \
        while read -r line; do
            local date_str=$(echo $line | awk '{print $1" "$2}')
            local file_path=$(echo $line | awk '{$1=$2=$3=""; print $0}' | sed 's/^ *//')
            local file_date=$(date -d "$date_str" +%s)
            local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%s)
            
            if [[ $file_date -lt $cutoff_date ]]; then
                aws s3 rm "s3://$AWS_S3_BUCKET/$file_path"
                log "Removido do S3: $file_path"
            fi
        done
    fi
    
    # Limpeza GCS
    if [[ "$GCS_ENABLED" == "true" ]]; then
        gsutil ls -l "gs://$GCS_BUCKET/my-wa-api/**" | \
        while read -r line; do
            if [[ $line =~ ^[0-9]+ ]]; then
                local file_path=$(echo $line | awk '{print $3}')
                local file_date=$(echo $line | awk '{print $2}')
                local file_timestamp=$(date -d "$file_date" +%s)
                local cutoff_timestamp=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%s)
                
                if [[ $file_timestamp -lt $cutoff_timestamp ]]; then
                    gsutil rm "$file_path"
                    log "Removido do GCS: $file_path"
                fi
            fi
        done
    fi
    
    log_success "Limpeza de backups antigos concluída"
}

# Função para restaurar backup
restore_backup() {
    local backup_source="$1"
    local restore_type="${2:-full}"
    
    log "Iniciando restauração de backup..."
    log "Fonte: $backup_source"
    log "Tipo: $restore_type"
    
    # Baixar backup se for de cloud
    local local_backup="$backup_source"
    
    if [[ "$backup_source" =~ ^s3:// ]]; then
        log "Baixando backup do S3..."
        local_backup="$BACKUP_DIR/restore-$(basename $backup_source)"
        aws s3 cp "$backup_source" "$local_backup"
    elif [[ "$backup_source" =~ ^gs:// ]]; then
        log "Baixando backup do GCS..."
        local_backup="$BACKUP_DIR/restore-$(basename $backup_source)"
        gsutil cp "$backup_source" "$local_backup"
    fi
    
    # Descriptografar se necessário
    if [[ "$local_backup" == *.gpg ]]; then
        log "Descriptografando backup..."
        gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" "$local_backup" > "${local_backup%.gpg}"
        local_backup="${local_backup%.gpg}"
    fi
    
    # Descomprimir se necessário
    local restore_dir="$BACKUP_DIR/restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$restore_dir"
    
    if [[ "$local_backup" == *.tar.gz ]]; then
        log "Descomprimindo backup..."
        tar -xzf "$local_backup" -C "$restore_dir"
    else
        cp -r "$local_backup"/* "$restore_dir/"
    fi
    
    # Parar aplicação para restauração
    log "Parando aplicação para restauração..."
    docker-compose -f docker-compose.production.yml down
    
    # Restaurar componentes conforme tipo
    case "$restore_type" in
        "database")
            log "Restaurando apenas banco de dados..."
            docker-compose -f docker-compose.production.yml up -d postgres
            sleep 30
            docker-compose -f docker-compose.production.yml exec -T postgres psql -U mywaapi -d mywaapi < "$restore_dir/database.sql"
            ;;
        "files")
            log "Restaurando apenas arquivos..."
            [[ -f "$restore_dir/sessions.tar.gz" ]] && tar -xzf "$restore_dir/sessions.tar.gz"
            [[ -f "$restore_dir/uploads.tar.gz" ]] && tar -xzf "$restore_dir/uploads.tar.gz"
            ;;
        "full")
            log "Restauração completa..."
            # Restaurar banco
            docker-compose -f docker-compose.production.yml up -d postgres redis
            sleep 30
            docker-compose -f docker-compose.production.yml exec -T postgres psql -U mywaapi -d mywaapi < "$restore_dir/database.sql"
            
            # Restaurar Redis
            [[ -f "$restore_dir/redis.rdb" ]] && cp "$restore_dir/redis.rdb" data/redis/
            
            # Restaurar arquivos
            [[ -f "$restore_dir/sessions.tar.gz" ]] && tar -xzf "$restore_dir/sessions.tar.gz"
            [[ -f "$restore_dir/uploads.tar.gz" ]] && tar -xzf "$restore_dir/uploads.tar.gz"
            
            # Restaurar configurações
            [[ -f "$restore_dir/.env.production" ]] && cp "$restore_dir/.env.production" .
            ;;
    esac
    
    # Reiniciar aplicação
    log "Reiniciando aplicação..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Limpeza
    rm -rf "$restore_dir"
    
    log_success "Restauração concluída"
}

# Função para testar restauração
test_restore() {
    log "Executando teste de restauração..."
    
    # Criar backup de teste
    local test_backup=$(create_local_backup)
    
    # Criar ambiente de teste
    local test_dir="/tmp/my-wa-api-restore-test"
    mkdir -p "$test_dir"
    
    # Simular restauração
    if [[ "$test_backup" == *.tar.gz ]]; then
        tar -xzf "$test_backup" -C "$test_dir"
        
        # Verificar componentes críticos
        local components=("database.sql" "sessions.tar.gz" "backup-info.json")
        for component in "${components[@]}"; do
            if [[ -f "$test_dir"/*/"$component" ]]; then
                log_success "Componente encontrado: $component"
            else
                log_warning "Componente não encontrado: $component"
            fi
        done
    fi
    
    # Limpeza
    rm -rf "$test_dir"
    
    log_success "Teste de restauração concluído"
}

# Função principal de backup
run_backup() {
    log "🗄️ Iniciando processo de backup para cloud"
    
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_warning "Backup está desabilitado"
        return 0
    fi
    
    # Criar backup local
    local backup_file=$(create_local_backup)
    
    # Verificar integridade
    verify_backup_integrity "$backup_file"
    
    # Upload para clouds
    local upload_success=false
    
    if [[ "$AWS_S3_ENABLED" == "true" ]]; then
        if upload_to_s3 "$backup_file"; then
            upload_success=true
        fi
    fi
    
    if [[ "$GCS_ENABLED" == "true" ]]; then
        if upload_to_gcs "$backup_file"; then
            upload_success=true
        fi
    fi
    
    if [[ "$upload_success" == "false" && ("$AWS_S3_ENABLED" == "true" || "$GCS_ENABLED" == "true") ]]; then
        log_error "Falha no upload para cloud!"
        return 1
    fi
    
    # Limpeza de backups antigos
    cleanup_old_backups
    
    # Registrar sucesso
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$BACKUP_DIR/.last-backup"
    
    log_success "Processo de backup concluído com sucesso"
}

# Função principal
main() {
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"
    
    # Carregar configurações
    load_config
    
    case "${1:-backup}" in
        "backup")
            check_dependencies
            run_backup
            ;;
        "restore")
            local backup_source="${2:-}"
            local restore_type="${3:-full}"
            if [[ -z "$backup_source" ]]; then
                log_error "Especifique a fonte do backup"
                echo "Uso: $0 restore <fonte> [database|files|full]"
                exit 1
            fi
            restore_backup "$backup_source" "$restore_type"
            ;;
        "test")
            check_dependencies
            test_restore
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "list")
            log "Backups locais:"
            ls -la "$BACKUP_DIR"/my-wa-api-* 2>/dev/null || log "Nenhum backup local encontrado"
            
            if [[ "$AWS_S3_ENABLED" == "true" ]]; then
                log "Backups no S3:"
                aws s3 ls "s3://$AWS_S3_BUCKET/my-wa-api/" --recursive
            fi
            
            if [[ "$GCS_ENABLED" == "true" ]]; then
                log "Backups no GCS:"
                gsutil ls -l "gs://$GCS_BUCKET/my-wa-api/**"
            fi
            ;;
        "setup")
            check_dependencies
            log_success "Setup de backup para cloud concluído"
            ;;
        *)
            echo "Uso: $0 [backup|restore|test|cleanup|list|setup]"
            echo ""
            echo "Comandos:"
            echo "  backup              - Executar backup completo"
            echo "  restore <fonte>     - Restaurar backup de fonte específica"
            echo "  test                - Testar processo de backup/restore"
            echo "  cleanup             - Limpar backups antigos"
            echo "  list                - Listar backups disponíveis"
            echo "  setup               - Configurar dependências"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
