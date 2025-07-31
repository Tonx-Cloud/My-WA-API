# Script PowerShell para Execução Completa de Testes
# Complementa o script Node.js principal com funcionalidades específicas do Windows

param(
    [switch]$SkipHealthChecks,
    [switch]$SkipCoverage,
    [switch]$Verbose,
    [string]$OutputFormat = "both" # json, txt, both
)

# Configuração de cores
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$ForegroundColor = "White"
    )
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "=" * 80 -ForegroundColor Cyan
    Write-ColorOutput "  $Title" -ForegroundColor Yellow
    Write-ColorOutput "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step)
    Write-ColorOutput "🔄 $Step" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" -ForegroundColor Red
}

# Verificar pré-requisitos
function Test-Prerequisites {
    Write-Step "Verificando pré-requisitos..."
    
    $issues = @()
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js encontrado: $nodeVersion"
        } else {
            $issues += "Node.js não encontrado"
        }
    } catch {
        $issues += "Node.js não encontrado"
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm encontrado: $npmVersion"
        } else {
            $issues += "npm não encontrado"
        }
    } catch {
        $issues += "npm não encontrado"
    }
    
    # Verificar curl (para health checks)
    try {
        $curlVersion = curl --version 2>$null
        if ($curlVersion) {
            Write-Success "curl encontrado"
        } else {
            Write-Warning "curl não encontrado - health checks podem falhar"
        }
    } catch {
        Write-Warning "curl não encontrado - health checks podem falhar"
    }
    
    if ($issues.Count -gt 0) {
        Write-Error-Custom "Pré-requisitos não atendidos:"
        $issues | ForEach-Object { Write-Error-Custom "  - $_" }
        exit 1
    }
    
    Write-Success "Todos os pré-requisitos atendidos!"
}

# Verificar status dos serviços
function Test-Services {
    Write-Step "Verificando status dos serviços..."
    
    $services = @(
        @{ Name = "API Backend"; Port = 3000; Url = "http://localhost:3000/health" },
        @{ Name = "Web Frontend"; Port = 3001; Url = "http://localhost:3001" }
    )
    
    $serviceStatus = @{}
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -UseBasicParsing 2>$null
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                Write-Success "$($service.Name) está ativo (porta $($service.Port))"
                $serviceStatus[$service.Name] = $true
            } else {
                Write-Warning "$($service.Name) retornou status $($response.StatusCode)"
                $serviceStatus[$service.Name] = $false
            }
        } catch {
            Write-Warning "$($service.Name) não está respondendo na porta $($service.Port)"
            $serviceStatus[$service.Name] = $false
        }
    }
    
    return $serviceStatus
}

# Limpeza de arquivos temporários
function Clear-TempFiles {
    Write-Step "Limpando arquivos temporários..."
    
    $tempPaths = @(
        "apps/api/coverage",
        "apps/web/coverage", 
        "logs/*.tmp",
        "*.tmp"
    )
    
    foreach ($path in $tempPaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Removido: $path"
        }
    }
}

# Backup de logs anteriores
function Backup-PreviousLogs {
    Write-Step "Fazendo backup de logs anteriores..."
    
    $logDir = "logs"
    $backupDir = "logs/backup/$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
    
    if (Test-Path $logDir) {
        $logFiles = Get-ChildItem -Path $logDir -Filter "*.log" -ErrorAction SilentlyContinue
        
        if ($logFiles.Count -gt 0) {
            New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
            
            foreach ($file in $logFiles) {
                Copy-Item $file.FullName $backupDir -ErrorAction SilentlyContinue
            }
            
            Write-Success "Backup criado em: $backupDir"
        }
    }
}

# Executar o script principal Node.js
function Invoke-MainTestScript {
    Write-Step "Executando script principal de testes..."
    
    $scriptPath = "scripts/run-full-tests.js"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Error-Custom "Script principal não encontrado: $scriptPath"
        exit 1
    }
    
    try {
        # Executar o script Node.js
        $process = Start-Process -FilePath "node" -ArgumentList $scriptPath -NoNewWindow -PassThru -Wait
        
        if ($process.ExitCode -eq 0) {
            Write-Success "Script principal executado com sucesso!"
            return $true
        } else {
            Write-Error-Custom "Script principal falhou com código: $($process.ExitCode)"
            return $false
        }
    } catch {
        Write-Error-Custom "Erro ao executar script principal: $($_.Exception.Message)"
        return $false
    }
}

# Gerar relatório adicional PowerShell
function New-PowerShellReport {
    param([bool]$TestsSucceeded)
    
    Write-Step "Gerando relatório adicional PowerShell..."
    
    $reportData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Platform = "Windows PowerShell"
        PSVersion = $PSVersionTable.PSVersion.ToString()
        OSVersion = [System.Environment]::OSVersion.ToString()
        TestsSucceeded = $TestsSucceeded
        Parameters = @{
            SkipHealthChecks = $SkipHealthChecks.IsPresent
            SkipCoverage = $SkipCoverage.IsPresent
            Verbose = $Verbose.IsPresent
            OutputFormat = $OutputFormat
        }
        SystemInfo = @{
            Processor = (Get-WmiObject -Class Win32_Processor).Name
            TotalRAM = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
            AvailableRAM = [math]::Round((Get-Counter -Counter "\Memory\Available MBytes").CounterSamples[0].CookedValue / 1024, 2)
        }
    }
    
    # Salvar em JSON
    if ($OutputFormat -in @("json", "both")) {
        $jsonPath = "logs/powershell-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
        $reportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
        Write-Success "Relatório JSON salvo: $jsonPath"
    }
    
    # Salvar em TXT
    if ($OutputFormat -in @("txt", "both")) {
        $txtPath = "logs/powershell-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').txt"
        
        $textReport = @"
RELATÓRIO POWERSHELL - TESTES AUTOMATIZADOS
===========================================

Data/Hora: $($reportData.Timestamp)
Plataforma: $($reportData.Platform)
PowerShell: $($reportData.PSVersion)
OS: $($reportData.OSVersion)

RESULTADO DOS TESTES
-------------------
Sucesso: $($reportData.TestsSucceeded)

PARÂMETROS UTILIZADOS
--------------------
Skip Health Checks: $($reportData.Parameters.SkipHealthChecks)
Skip Coverage: $($reportData.Parameters.SkipCoverage)
Verbose: $($reportData.Parameters.Verbose)
Output Format: $($reportData.Parameters.OutputFormat)

INFORMAÇÕES DO SISTEMA
---------------------
Processador: $($reportData.SystemInfo.Processor)
RAM Total: $($reportData.SystemInfo.TotalRAM) GB
RAM Disponível: $($reportData.SystemInfo.AvailableRAM) GB

"@
        
        $textReport | Out-File -FilePath $txtPath -Encoding UTF8
        Write-Success "Relatório TXT salvo: $txtPath"
    }
}

# Monitoramento de recursos durante os testes
function Start-ResourceMonitoring {
    if (-not $Verbose) { return }
    
    Write-Step "Iniciando monitoramento de recursos..."
    
    $job = Start-Job -ScriptBlock {
        $logPath = "logs/resource-monitor-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"
        
        while ($true) {
            $cpu = (Get-Counter -Counter "\Processor(_Total)\% Processor Time").CounterSamples[0].CookedValue
            $memory = Get-Counter -Counter "\Memory\Available MBytes"
            $availableMemoryMB = $memory.CounterSamples[0].CookedValue
            
            $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - CPU: $([math]::Round($cpu, 2))% - Available Memory: $([math]::Round($availableMemoryMB, 2)) MB"
            
            Add-Content -Path $logPath -Value $logEntry
            Start-Sleep -Seconds 5
        }
    }
    
    return $job
}

# Função principal
function Main {
    $startTime = Get-Date
    
    Write-Header "SISTEMA DE TESTES AUTOMATIZADOS - POWERSHELL"
    
    try {
        # 1. Verificar pré-requisitos
        Test-Prerequisites
        
        # 2. Limpeza e backup
        Clear-TempFiles
        Backup-PreviousLogs
        
        # 3. Verificar serviços
        $serviceStatus = Test-Services
        
        # 4. Iniciar monitoramento (se verbose)
        $monitorJob = $null
        if ($Verbose) {
            $monitorJob = Start-ResourceMonitoring
        }
        
        # 5. Executar script principal
        $testsSucceeded = Invoke-MainTestScript
        
        # 6. Parar monitoramento
        if ($monitorJob) {
            Stop-Job $monitorJob -ErrorAction SilentlyContinue
            Remove-Job $monitorJob -ErrorAction SilentlyContinue
            Write-Success "Monitoramento de recursos finalizado"
        }
        
        # 7. Gerar relatório PowerShell
        New-PowerShellReport -TestsSucceeded $testsSucceeded
        
        # 8. Resumo final
        $duration = (Get-Date) - $startTime
        Write-Header "EXECUÇÃO FINALIZADA"
        
        if ($testsSucceeded) {
            Write-Success "Todos os testes foram executados com sucesso!"
        } else {
            Write-Error-Custom "Alguns testes falharam. Verifique os logs para detalhes."
        }
        
        Write-ColorOutput "Duração total: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
        Write-ColorOutput "Logs disponíveis em: logs/" -ForegroundColor Cyan
        
        # Exit code apropriado
        if ($testsSucceeded) {
            exit 0
        } else {
            exit 1
        }
        
    } catch {
        Write-Error-Custom "Erro crítico durante a execução: $($_.Exception.Message)"
        if ($Verbose) {
            Write-Error-Custom "Stack trace: $($_.Exception.StackTrace)"
        }
        exit 1
    }
}

# Execução
if ($MyInvocation.InvocationName -ne '.') {
    Main
}
