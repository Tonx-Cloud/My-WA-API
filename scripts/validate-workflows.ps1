# GitHub Actions Workflows Validation Script (PowerShell)
# Este script valida a sintaxe e segurança dos workflows

param(
    [switch]$Verbose = $false
)

Write-Host "=== GitHub Actions Workflows Validation ===" -ForegroundColor Yellow
Write-Host ""

# Contadores
$TotalChecks = 0
$PassedChecks = 0
$FailedChecks = 0

# Função para verificar se um comando existe
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Função para executar verificação
function Invoke-Check {
    param(
        [string]$CheckName,
        [scriptblock]$Command
    )
    
    Write-Host "Verificando $CheckName... " -NoNewline
    $script:TotalChecks++
    
    try {
        $result = & $Command
        if ($result -eq $true -or $LASTEXITCODE -eq 0) {
            Write-Host "✓ PASSOU" -ForegroundColor Green
            $script:PassedChecks++
            return $true
        } else {
            Write-Host "✗ FALHOU" -ForegroundColor Red
            $script:FailedChecks++
            return $false
        }
    } catch {
        Write-Host "✗ FALHOU" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "Erro: $_" -ForegroundColor Red
        }
        $script:FailedChecks++
        return $false
    }
}

# Verificar se estamos no diretório correto
if (-not (Test-Path ".github\workflows")) {
    Write-Host "Erro: Execute este script na raiz do projeto (onde está .github\workflows)" -ForegroundColor Red
    exit 1
}

Write-Host "Diretório: $(Get-Location)"
Write-Host "Workflows encontrados:"
Get-ChildItem ".github\workflows\*.yml" | ForEach-Object {
    Write-Host "  $($_.Name)"
}
Write-Host ""

# 1. Verificação de sintaxe YAML
Write-Host "=== 1. Verificação de Sintaxe YAML ===" -ForegroundColor Cyan

$yamlFiles = Get-ChildItem ".github\workflows\*.yml"

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    
    # Verificação básica de YAML com PowerShell
    $checkResult = Invoke-Check "YAML Syntax: $filename" {
        try {
            $content = Get-Content $file.FullName -Raw
            # Verificações básicas de sintaxe YAML
            if ($content -match "^\s*name\s*:" -and 
                $content -match "^\s*on\s*:" -and 
                $content -match "^\s*jobs\s*:") {
                return $true
            }
            return $false
        } catch {
            return $false
        }
    }
}

Write-Host ""

# 2. Verificação específica do GitHub Actions
Write-Host "=== 2. Verificação GitHub Actions ===" -ForegroundColor Cyan

if (Test-CommandExists "actionlint") {
    foreach ($file in $yamlFiles) {
        $filename = $file.Name
        Invoke-Check "GitHub Actions: $filename" {
            & actionlint $file.FullName
            return $LASTEXITCODE -eq 0
        }
    }
} else {
    Write-Host "⚠ actionlint não encontrado." -ForegroundColor Yellow
    Write-Host "Para instalar visite: https://github.com/rhymond/actionlint"
}

Write-Host ""

# 3. Verificação de segurança
Write-Host "=== 3. Verificação de Segurança ===" -ForegroundColor Cyan

if (Test-CommandExists "checkov") {
    Invoke-Check "Segurança com Checkov" {
        & checkov -d .github\workflows --framework github_actions --quiet
        return $LASTEXITCODE -eq 0
    }
} else {
    Write-Host "⚠ checkov não encontrado." -ForegroundColor Yellow
    Write-Host "Para instalar: pip install checkov"
}

Write-Host ""

# 4. Verificações manuais de boas práticas
Write-Host "=== 4. Verificações de Boas Práticas ===" -ForegroundColor Cyan

# Verificar permissões explícitas
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    Invoke-Check "Permissões explícitas: $filename" {
        return $content -match "permissions\s*:"
    }
}

# Verificar se usa versões pinadas das actions
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    Invoke-Check "Versões pinadas: $filename" {
        $lines = Get-Content $file.FullName
        $usesLines = $lines | Where-Object { $_ -match "^\s*uses\s*:" }
        
        foreach ($line in $usesLines) {
            if ($line -notmatch "@v\d+" -and $line -notmatch "@[a-f0-9]{40}") {
                return $false
            }
        }
        return $true
    }
}

# Verificar se não há secrets em URLs
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    Invoke-Check "Secrets seguros em URLs: $filename" {
        # Verificar se curl não está expondo secrets diretamente
        $lines = Get-Content $file.FullName
        $curlLines = $lines | Where-Object { $_ -match "curl.*secrets\." }
        
        foreach ($line in $curlLines) {
            # Se encontrar curl com secrets na URL (não em env), falha
            if ($line -match "curl.*\\\$.*secrets\." -and $line -notmatch "env:") {
                return $false
            }
        }
        return $true
    }
}

Write-Host ""

# 5. Verificação de estrutura dos workflows
Write-Host "=== 5. Verificação de Estrutura ===" -ForegroundColor Cyan

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    # Verificar se tem jobs
    Invoke-Check "Estrutura básica: $filename" {
        return ($content -match "jobs\s*:" -and $content -match "runs-on\s*:")
    }
    
    # Verificar se não tem strings desnecessariamente quoted
    Invoke-Check "Strings sem quotes desnecessárias: $filename" {
        $lines = Get-Content $file.FullName
        $unnecessaryQuotes = $lines | Where-Object { 
            $_ -match ":\s*'[^']*'\s*$" -and 
            $_ -notmatch "\*" -and 
            $_ -notmatch "node-version|cache"
        }
        return $unnecessaryQuotes.Count -eq 0
    }
}

Write-Host ""

# 6. Resumo final
Write-Host "=== RESUMO FINAL ===" -ForegroundColor Yellow
Write-Host "Total de verificações: $TotalChecks"
Write-Host "Passaram: $PassedChecks" -ForegroundColor Green
Write-Host "Falharam: $FailedChecks" -ForegroundColor Red

if ($FailedChecks -eq 0) {
    Write-Host ""
    Write-Host "🎉 Todos os workflows estão em conformidade!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Alguns problemas foram encontrados. Verifique os detalhes acima." -ForegroundColor Red
    
    Write-Host ""
    Write-Host "=== PRÓXIMOS PASSOS ===" -ForegroundColor Yellow
    Write-Host "1. Corrija os problemas identificados nos workflows"
    Write-Host "2. Execute novamente este script para validar"
    Write-Host "3. Teste os workflows em um ambiente de desenvolvimento"
    Write-Host "4. Configure todos os secrets necessários no GitHub"
    
    exit 1
}
