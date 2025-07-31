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
                # Ignorar PID 0 (processo Idle do sistema)
                if ($processId -eq 0) {
                    continue
                }
                
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
        Write-Host "Erro ao parar ${ServiceName}: $($_.Exception.Message)" -ForegroundColor Red
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

# Usar WMI para obter processos Node.js com linha de comando
$nodeProcesses = Get-WmiObject Win32_Process | Where-Object {
    $_.Name -eq "node.exe" -and 
    $_.CommandLine -like "*My-wa-api*"
}

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "Parando processo Node.js (PID: $($process.ProcessId))..." -ForegroundColor Yellow
        Write-Host "  Comando: $($process.CommandLine)" -ForegroundColor Gray
        try {
            if ($Force) {
                Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
            } else {
                Stop-Process -Id $process.ProcessId -ErrorAction Stop
            }
            Write-Host "  Processo parado!" -ForegroundColor Green
        } catch {
            Write-Host "  Erro ao parar processo: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Nenhum processo Node.js relacionado encontrado" -ForegroundColor Gray
}

# Aguardar um pouco para os processos terminarem
Start-Sleep -Seconds 2

# Verificar se ainda há processos rodando nas portas
Write-Host "Verificacao final de portas..." -ForegroundColor Yellow
$remainingProcesses = @()

# Verificar porta 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $remainingProcesses += "Backend (3000)"
}

# Verificar porta 3001
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port3001) {
    $remainingProcesses += "Frontend (3001)"
}

if ($remainingProcesses) {
    Write-Host "AVISO: Ainda há processos rodando nas portas: $($remainingProcesses -join ', ')" -ForegroundColor Red
    Write-Host "Execute novamente com -Force se necessário" -ForegroundColor Yellow
} else {
    Write-Host "Todas as portas foram liberadas!" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Todos os servicos foram parados!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
