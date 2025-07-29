# My-wa-API - Script de Reinicializacao de Todos os Servicos
# Este script para e reinicia todos os servicos (backend + frontend)

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
