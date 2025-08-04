#!/bin/bash

# Script de Validação dos Workflows GitHub Actions
# Este script valida a sintaxe e segurança dos workflows

echo "=== GitHub Actions Workflows Validation ==="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para executar verificação
run_check() {
    local check_name="$1"
    local command="$2"
    
    echo -n "Verificando $check_name... "
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSOU${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Verificar se estamos no diretório correto
if [ ! -d ".github/workflows" ]; then
    echo -e "${RED}Erro: Execute este script na raiz do projeto (onde está .github/workflows)${NC}"
    exit 1
fi

echo "Diretório: $(pwd)"
echo "Workflows encontrados:"
ls -la .github/workflows/*.yml | awk '{print "  " $9}'
echo ""

# 1. Verificação de sintaxe YAML
echo "=== 1. Verificação de Sintaxe YAML ==="
if command_exists yamllint; then
    for file in .github/workflows/*.yml; do
        filename=$(basename "$file")
        run_check "YAML Syntax: $filename" "yamllint '$file'"
    done
else
    echo -e "${YELLOW}⚠ yamllint não encontrado. Instalando...${NC}"
    if command_exists pip; then
        pip install yamllint
    elif command_exists pip3; then
        pip3 install yamllint
    else
        echo -e "${RED}Erro: pip não encontrado. Instale yamllint manualmente.${NC}"
    fi
fi

echo ""

# 2. Verificação específica do GitHub Actions
echo "=== 2. Verificação GitHub Actions ==="
if command_exists actionlint; then
    for file in .github/workflows/*.yml; do
        filename=$(basename "$file")
        run_check "GitHub Actions: $filename" "actionlint '$file'"
    done
else
    echo -e "${YELLOW}⚠ actionlint não encontrado.${NC}"
    echo "Para instalar:"
    echo "  bash <(curl https://raw.githubusercontent.com/rhymond/actionlint/main/scripts/download-actionlint.bash)"
    echo "  Ou: go install github.com/rhymond/actionlint/cmd/actionlint@latest"
fi

echo ""

# 3. Verificação de segurança
echo "=== 3. Verificação de Segurança ==="
if command_exists checkov; then
    run_check "Segurança com Checkov" "checkov -d .github/workflows --framework github_actions"
else
    echo -e "${YELLOW}⚠ checkov não encontrado.${NC}"
    echo "Para instalar: pip install checkov"
fi

echo ""

# 4. Verificações manuais de boas práticas
echo "=== 4. Verificações de Boas Práticas ==="

# Verificar permissões explícitas
for file in .github/workflows/*.yml; do
    filename=$(basename "$file")
    if grep -q "permissions:" "$file"; then
        run_check "Permissões explícitas: $filename" "true"
    else
        run_check "Permissões explícitas: $filename" "false"
    fi
done

# Verificar se usa versões pinadas das actions
for file in .github/workflows/*.yml; do
    filename=$(basename "$file")
    if grep -E "uses:.*@v[0-9]+" "$file" >/dev/null; then
        run_check "Versões pinadas: $filename" "true"
    else
        run_check "Versões pinadas: $filename" "false"
    fi
done

# Verificar se não há secrets em URLs
for file in .github/workflows/*.yml; do
    filename=$(basename "$file")
    if grep -E "curl.*\\\$.*secrets\." "$file" >/dev/null; then
        run_check "Secrets em URLs: $filename" "false"
    else
        run_check "Secrets em URLs: $filename" "true"
    fi
done

echo ""

# 5. Resumo final
echo "=== RESUMO FINAL ==="
echo -e "Total de verificações: $TOTAL_CHECKS"
echo -e "${GREEN}Passaram: $PASSED_CHECKS${NC}"
echo -e "${RED}Falharam: $FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Todos os workflows estão em conformidade!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Alguns problemas foram encontrados. Verifique os logs acima.${NC}"
    exit 1
fi
