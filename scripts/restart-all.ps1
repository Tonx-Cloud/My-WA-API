# My-wa-API - Script de Reinicializacao de Todos os Servicos
# Este script para e reinicia todos os servicos (backend + frontend)
# Agora integrado com o sistema de restart JavaScript

param(
    [switch]$SkipChecks,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Banner
Write-Host "================================" -ForegroundColor Magenta
Write-Host "My-wa-API - Reinicializador" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Usar o sistema de restart JavaScript integrado
Write-Host "Executando sistema de restart integrado..." -ForegroundColor Green

$restartArgs = @()
if ($SkipChecks) {
    $restartArgs += "--skip-health-checks"
}

$restartScriptPath = Join-Path $PSScriptRoot "restart-system.js"
if (Test-Path $restartScriptPath) {
    Write-Host "Usando restart-system.js..." -ForegroundColor Cyan
    if ($restartArgs.Count -gt 0) {
        & node $restartScriptPath $restartArgs
    } else {
        & node $restartScriptPath
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Reinicializacao concluida com sucesso!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Falha na reinicializacao" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Arquivo restart-system.js nao encontrado, usando metodo legado..." -ForegroundColor Yellow
}

# Parar todos os servicos
Write-Host "Parando todos os servicos..." -ForegroundColor Yellow
& "$PSScriptRoot\stop-all.ps1" -Force

# Aguardar um pouco para garantir que os processos foram finalizados
Write-Host "Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar todos os servicos novamente
Write-Host "Iniciando todos os servicos..." -ForegroundColor Green
if ($SkipChecks) {
    & "$PSScriptRoot\start-all.ps1" -SkipChecks
} else {
    & "$PSScriptRoot\start-all.ps1"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Reinicializacao concluida!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
