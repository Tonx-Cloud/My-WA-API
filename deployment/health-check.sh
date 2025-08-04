#!/bin/bash

# Health Check Script para My WhatsApp API
# Usage: ./health-check.sh

set -e

PROJECT_NAME="my-wa-api"
API_URL="http://localhost:3000"
WEB_URL="http://localhost:3001"

echo "🔍 Verificando saúde do sistema $PROJECT_NAME..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se um serviço está respondendo
check_service() {
    local url=$1
    local service_name=$2
    
    echo -n "Verificando $service_name ($url)... "
    
    if curl -f -s "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        return 1
    fi
}

# Função para verificar porta
check_port() {
    local port=$1
    local service_name=$2
    
    echo -n "Verificando porta $port ($service_name)... "
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ ABERTA${NC}"
        return 0
    else
        echo -e "${RED}❌ FECHADA${NC}"
        return 1
    fi
}

# Função para verificar processo PM2
check_pm2() {
    echo -n "Verificando processos PM2... "
    
    if command -v pm2 &> /dev/null; then
        local pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[].pm2_env.status' 2>/dev/null || echo "error")
        
        if [[ "$pm2_status" == *"online"* ]]; then
            echo -e "${GREEN}✅ ONLINE${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  OFFLINE OU NÃO ENCONTRADO${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  PM2 NÃO INSTALADO${NC}"
        return 1
    fi
}

# Função para verificar logs
check_logs() {
    echo -n "Verificando logs... "
    
    if [ -d "logs" ]; then
        local error_count=$(find logs -name "*.log" -mtime -1 -exec grep -l "ERROR\|FATAL" {} \; 2>/dev/null | wc -l)
        
        if [ "$error_count" -eq 0 ]; then
            echo -e "${GREEN}✅ SEM ERROS RECENTES${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $error_count ARQUIVO(S) COM ERROS${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  DIRETÓRIO DE LOGS NÃO ENCONTRADO${NC}"
        return 1
    fi
}

# Função para verificar dependências
check_dependencies() {
    echo -e "${BLUE}📦 Verificando dependências...${NC}"
    
    local node_version=$(node -v 2>/dev/null || echo "não instalado")
    local npm_version=$(npm -v 2>/dev/null || echo "não instalado")
    
    echo "Node.js: $node_version"
    echo "NPM: $npm_version"
    
    if command -v pm2 &> /dev/null; then
        local pm2_version=$(pm2 -v 2>/dev/null || echo "erro")
        echo "PM2: $pm2_version"
    else
        echo -e "PM2: ${YELLOW}não instalado${NC}"
    fi
    
    if command -v docker &> /dev/null; then
        local docker_version=$(docker -v 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo "erro")
        echo "Docker: $docker_version"
    else
        echo -e "Docker: ${YELLOW}não instalado${NC}"
    fi
}

# Função principal
main() {
    echo -e "${BLUE}=== RELATÓRIO DE SAÚDE DO SISTEMA ===${NC}\n"
    
    # Verificar dependências
    check_dependencies
    echo ""
    
    # Verificar portas
    echo -e "${BLUE}🔌 Verificando portas...${NC}"
    api_port_ok=false
    web_port_ok=false
    
    if check_port 3000 "API"; then
        api_port_ok=true
    fi
    
    if check_port 3001 "Web"; then
        web_port_ok=true
    fi
    echo ""
    
    # Verificar serviços
    echo -e "${BLUE}🌐 Verificando serviços...${NC}"
    api_service_ok=false
    web_service_ok=false
    
    if $api_port_ok && check_service "$API_URL" "API"; then
        api_service_ok=true
    fi
    
    if $web_port_ok && check_service "$WEB_URL" "Web Dashboard"; then
        web_service_ok=true
    fi
    echo ""
    
    # Verificar PM2
    echo -e "${BLUE}📊 Verificando gerenciador de processos...${NC}"
    check_pm2
    echo ""
    
    # Verificar logs
    echo -e "${BLUE}📝 Verificando logs...${NC}"
    check_logs
    echo ""
    
    # Verificar APIs específicas
    if $api_service_ok; then
        echo -e "${BLUE}🔍 Verificando endpoints da API...${NC}"
        
        endpoints=(
            "/api/dashboard/stats"
            "/api/dashboard/overview"
            "/api/instances"
        )
        
        for endpoint in "${endpoints[@]}"; do
            echo -n "Testando $endpoint... "
            if curl -f -s "$API_URL$endpoint" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ OK${NC}"
            else
                echo -e "${RED}❌ FALHOU${NC}"
            fi
        done
        echo ""
    fi
    
    # Resumo final
    echo -e "${BLUE}=== RESUMO FINAL ===${NC}"
    
    if $api_service_ok && $web_service_ok; then
        echo -e "${GREEN}🎉 Sistema funcionando perfeitamente!${NC}"
        echo -e "API: $API_URL"
        echo -e "Dashboard: $WEB_URL"
        echo -e "Documentação: $API_URL/api-docs"
        exit 0
    elif $api_service_ok; then
        echo -e "${YELLOW}⚠️  API OK, mas Dashboard com problemas${NC}"
        exit 1
    elif $web_service_ok; then
        echo -e "${YELLOW}⚠️  Dashboard OK, mas API com problemas${NC}"
        exit 1
    else
        echo -e "${RED}❌ Sistema com problemas críticos${NC}"
        echo ""
        echo -e "${BLUE}💡 Sugestões:${NC}"
        echo "1. Verifique se os serviços estão rodando: npm run dev"
        echo "2. Verifique os logs: tail -f logs/*.log"
        echo "3. Reinicie os serviços: pm2 restart all"
        echo "4. Verifique a configuração: cat .env"
        exit 2
    fi
}

# Executar verificação
main "$@"
