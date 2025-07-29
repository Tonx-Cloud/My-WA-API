# My-wa-API - Script de Parada de Todos os Servicos
# Este script para todos os servicos (backend + frontend)

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Banner
Write-Host "================================" -ForegroundColor Red
Write-Host "My-wa-API - Parar Servicos" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red
Write-Host ""

# Funcao para matar processos por porta
function Stop-ProcessByPort {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        
        if ($processes) {
            foreach ($processId in $processes) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Parando $ServiceName (PID: $processId)..." -ForegroundColor Yellow
                    if ($Force) {
                        Stop-Process -Id $processId -Force
                    } else {
                        Stop-Process -Id $processId
                    }
                    Write-Host "$ServiceName parado!" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "$ServiceName nao esta rodando na porta $Port" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Erro ao parar $ServiceName: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Parar Frontend (porta 3001)
Write-Host "Parando Frontend (porta 3001)..." -ForegroundColor Yellow
Stop-ProcessByPort -Port 3001 -ServiceName "Frontend"

# Parar Backend (porta 3000)
Write-Host "Parando Backend (porta 3000)..." -ForegroundColor Yellow
Stop-ProcessByPort -Port 3000 -ServiceName "Backend"

# Parar processos Node.js relacionados ao projeto
Write-Host "Verificando processos Node.js relacionados..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.MainModule.FileName -like "*My-wa-api*" -or
    $_.CommandLine -like "*My-wa-api*"
}

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "Parando processo Node.js (PID: $($process.Id))..." -ForegroundColor Yellow
        if ($Force) {
            Stop-Process -Id $process.Id -Force
        } else {
            Stop-Process -Id $process.Id
        }
    }
} else {
    Write-Host "Nenhum processo Node.js relacionado encontrado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Todos os servicos foram parados!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
