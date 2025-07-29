# My-wa-API - Script de Status dos Servicos
# Este script verifica o status de todos os servicos

param(
    [switch]$Detailed,
    [switch]$Continuous
)

$ErrorActionPreference = "Continue"

# Funcao para verificar se uma porta esta em uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Funcao para obter informacoes do processo por porta
function Get-ProcessByPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($processes) {
            $process = Get-Process -Id $processes[0] -ErrorAction SilentlyContinue
            return $process
        }
    } catch {
        return $null
    }
    return $null
}

# Funcao para exibir status
function Show-ServiceStatus {
    param(
        [string]$ServiceName,
        [int]$Port,
        [string]$Url,
        [string]$LogPath = ""
    )
    
    $isRunning = Test-Port -Port $Port
    $process = Get-ProcessByPort -Port $Port
    
    Write-Host "[$ServiceName]" -ForegroundColor Cyan
    if ($isRunning) {
        Write-Host "  Status: RODANDO" -ForegroundColor Green
        Write-Host "  Porta: $Port" -ForegroundColor Blue
        Write-Host "  URL: $Url" -ForegroundColor Blue
        
        if ($process -and $Detailed) {
            Write-Host "  PID: $($process.Id)" -ForegroundColor Gray
            Write-Host "  CPU: $($process.CPU)" -ForegroundColor Gray
            Write-Host "  Memoria: $([math]::Round($process.WorkingSet / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "  Inicio: $($process.StartTime)" -ForegroundColor Gray
        }
        
        if ($LogPath -and (Test-Path $LogPath) -and $Detailed) {
            $logSize = (Get-Item $LogPath).Length / 1KB
            Write-Host "  Log: $LogPath ($([math]::Round($logSize, 2)) KB)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Status: PARADO" -ForegroundColor Red
        Write-Host "  Porta: $Port (disponivel)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Banner
Write-Host "================================" -ForegroundColor Cyan
Write-Host "My-wa-API - Status dos Servicos" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Verificado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

do {
    # Verificar Backend
    Show-ServiceStatus -ServiceName "Backend API" -Port 3000 -Url "http://localhost:3000" -LogPath "apps\api\logs\api.log"
    
    # Verificar Frontend
    Show-ServiceStatus -ServiceName "Frontend Web" -Port 3001 -Url "http://localhost:3001" -LogPath "apps\web\logs\web.log"
    
    # Verificar conectividade do backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "[Backend Health Check]" -ForegroundColor Cyan
            Write-Host "  Status: OK" -ForegroundColor Green
            Write-Host "  Response: $($response.StatusCode)" -ForegroundColor Blue
        }
    } catch {
        Write-Host "[Backend Health Check]" -ForegroundColor Cyan
        Write-Host "  Status: FALHA" -ForegroundColor Red
        Write-Host "  Erro: Nao foi possivel conectar" -ForegroundColor Red
    }
    Write-Host ""
    
    # Resumo
    $backendRunning = Test-Port -Port 3000
    $frontendRunning = Test-Port -Port 3001
    
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "RESUMO:" -ForegroundColor Cyan
    if ($backendRunning -and $frontendRunning) {
        Write-Host "Todos os servicos estao RODANDO" -ForegroundColor Green
    } elseif ($backendRunning -or $frontendRunning) {
        Write-Host "Alguns servicos estao RODANDO" -ForegroundColor Yellow
    } else {
        Write-Host "Todos os servicos estao PARADOS" -ForegroundColor Red
    }
    Write-Host "================================" -ForegroundColor Cyan
    
    if ($Continuous) {
        Write-Host "Aguardando 10 segundos para proxima verificacao..." -ForegroundColor Gray
        Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Gray
        Start-Sleep -Seconds 10
        Clear-Host
    }
    
} while ($Continuous)
