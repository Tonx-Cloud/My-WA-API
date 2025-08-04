# Validation script for GitHub Actions workflows
param([switch]$Verbose = $false)

Write-Host "=== GitHub Actions Workflows Validation ===" -ForegroundColor Yellow
Write-Host ""

$TotalChecks = 0
$PassedChecks = 0
$FailedChecks = 0

function CheckWorkflow {
    param($CheckName, $TestResult)
    
    Write-Host "Verificando $CheckName... " -NoNewline
    $script:TotalChecks++
    
    if ($TestResult) {
        Write-Host "PASSOU" -ForegroundColor Green
        $script:PassedChecks++
        return $true
    } else {
        Write-Host "FALHOU" -ForegroundColor Red
        $script:FailedChecks++
        return $false
    }
}

if (-not (Test-Path ".github\workflows")) {
    Write-Host "Erro: Execute na raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "Workflows encontrados:"
Get-ChildItem ".github\workflows\*.yml" | ForEach-Object {
    Write-Host "  $($_.Name)"
}
Write-Host ""

$yamlFiles = Get-ChildItem ".github\workflows\*.yml"

# Verificacao de sintaxe basica
Write-Host "=== Verificacao de Sintaxe ===" -ForegroundColor Cyan

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    $hasName = $content -match "name:"
    $hasOn = $content -match "on:"
    $hasJobs = $content -match "jobs:"
    
    $result = $hasName -and $hasOn -and $hasJobs
    CheckWorkflow "YAML Syntax: $filename" $result
}

# Verificacao de permissoes
Write-Host ""
Write-Host "=== Verificacao de Permissoes ===" -ForegroundColor Cyan

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $content = Get-Content $file.FullName -Raw
    
    $hasPermissions = $content -match "permissions:"
    CheckWorkflow "Permissoes: $filename" $hasPermissions
}

# Verificacao de versoes pinadas
Write-Host ""
Write-Host "=== Verificacao de Versoes ===" -ForegroundColor Cyan

foreach ($file in $yamlFiles) {
    $filename = $file.Name
    $lines = Get-Content $file.FullName
    $usesLines = $lines | Where-Object { $_ -match "uses:" }
    
    $allPinned = $true
    foreach ($line in $usesLines) {
        if ($line -notmatch "@v\d+" -and $line -notmatch "@[a-f0-9]") {
            $allPinned = $false
            break
        }
    }
    
    CheckWorkflow "Versoes pinadas: $filename" $allPinned
}

# Resumo
Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Yellow
Write-Host "Total: $TotalChecks"
Write-Host "Passou: $PassedChecks" -ForegroundColor Green
Write-Host "Falhou: $FailedChecks" -ForegroundColor Red

if ($FailedChecks -eq 0) {
    Write-Host ""
    Write-Host "Todos os workflows estao em conformidade!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "Alguns problemas encontrados." -ForegroundColor Red
    exit 1
}
