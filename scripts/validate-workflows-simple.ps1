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
        [bool]$TestResult
    )
    
    Write-Host "Verificando $CheckName... " -NoNewline
    $script:TotalChecks++
    
    if ($TestResult) {
        Write-Host "✓ PASSOU" -ForegroundColor Green
        $script:PassedChecks++
        return $true
    } else {
        Write-Host "✗ FALHOU" -ForegroundColor Red
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
    $content = Get-Content $file.FullName -Raw
    
    # Verificação básica de YAML
    $hasName = $content -match "^\s*name\s*:"
    $hasOn = $content -match "^\s*on\s*:"
    $hasJobs = $content -match "^\s*jobs\s*:"
    
    $result = $hasName -and $hasOn -and $hasJobs
    Invoke-Check "YAML Syntax: $filename" $result
}

Write-Host ""

# 2. Verificação de boas práticas
Write-Host "=== 2. Verificação de Boas Práticas ===" -ForegroundColor Cyan

# Verificar permissões explícitas
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    $hasPermissions = $content -match "permissions\s*:"
    Invoke-Check "Permissões explícitas: $filename" $hasPermissions
}

# Verificar se usa versões pinadas das actions
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $lines = Get-Content $file.FullName
    $usesLines = $lines | Where-Object { $_ -match "^\s*uses\s*:" }
    
    $allPinned = $true
    foreach ($line in $usesLines) {
        if ($line -notmatch "@v\d+" -and $line -notmatch "@[a-f0-9]{7,40}") {
            $allPinned = $false
            break
        }
    }
    
    Invoke-Check "Versões pinadas: $filename" $allPinned
}

# Verificar se não há secrets em URLs de forma insegura
foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $lines = Get-Content $file.FullName
    
    $hasInsecureSecrets = $false
    foreach ($line in $lines) {
        if ($line -match "curl.*secrets\." -and $line -notmatch "env:") {
            $hasInsecureSecrets = $true
            break
        }
    }
    
    Invoke-Check "Secrets seguros em URLs: $filename" (-not $hasInsecureSecrets)
}

Write-Host ""

# 3. Verificação de estrutura
Write-Host "=== 3. Verificação de Estrutura ===" -ForegroundColor Cyan

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    # Verificar se tem estrutura básica
    $hasJobsAndRuns = ($content -match "jobs\s*:") -and ($content -match "runs-on\s*:")
    Invoke-Check "Estrutura básica: $filename" $hasJobsAndRuns
}

Write-Host ""

# 4. Resumo final
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
    Write-Host "3. Configure todos os secrets necessários no GitHub"
    Write-Host "4. Teste os workflows em um ambiente de desenvolvimento"
    
    exit 1
}
