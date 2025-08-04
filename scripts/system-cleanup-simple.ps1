# MY-WA-API - SCRIPT DE LIMPEZA DO SISTEMA
# Criado: 2025-08-03

Write-Host "INICIANDO LIMPEZA COMPLETA DO SISTEMA" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Parar processos em execucao
Write-Host "Parando processos em execucao..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*My-wa-api*" } | Stop-Process -Force
Get-Process -Name "tsx" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "Processos finalizados" -ForegroundColor Green

# Limpar logs antigos
Write-Host "`nLimpando logs antigos..." -ForegroundColor Yellow
$logDirs = @(".\logs", ".\apps\api\logs", ".\apps\web\logs")
foreach ($logDir in $logDirs) {
    if (Test-Path $logDir) {
        Get-ChildItem -Path $logDir -Recurse -File | Where-Object { 
            $_.LastWriteTime -lt (Get-Date).AddDays(-3) -and $_.Extension -in @(".log", ".txt") 
        } | Remove-Item -Force -ErrorAction SilentlyContinue
        
        Get-ChildItem -Path $logDir -Recurse -File | Where-Object { 
            $_.Length -gt 50MB -and $_.Extension -in @(".log", ".txt")
        } | ForEach-Object {
            Write-Host "Truncando log grande: $($_.Name)" -ForegroundColor DarkYellow
            Clear-Content $_.FullName -Force
        }
    }
}
Write-Host "Logs antigos limpos" -ForegroundColor Green

# Limpar sessoes WhatsApp orfas
Write-Host "`nLimpando sessoes WhatsApp orfas..." -ForegroundColor Yellow
$cutoffDate = (Get-Date).AddDays(-7)
$sessionDirs = @(".\apps\api\sessions", ".\apps\api\.wwebjs_auth", ".\sessions")
foreach ($sessionDir in $sessionDirs) {
    if (Test-Path $sessionDir) {
        Get-ChildItem -Path $sessionDir -Directory | Where-Object { 
            $_.LastWriteTime -lt $cutoffDate -and $_.Name -notlike "*demo*"
        } | ForEach-Object {
            Write-Host "Removendo sessao antiga: $($_.Name)" -ForegroundColor DarkYellow
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "Sessoes orfas limpas" -ForegroundColor Green

# Limpar caches
Write-Host "`nLimpando caches..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Directory -Name ".turbo" -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "Limpando cache Turbo: $_" -ForegroundColor DarkYellow
        Remove-Item -Path "$_\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Get-ChildItem -Path . -Recurse -Directory -Name ".next" -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "Limpando cache Next.js: $_" -ForegroundColor DarkYellow
        Remove-Item -Path "$_\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Caches limpos" -ForegroundColor Green

# Limpar arquivos temporarios
Write-Host "`nLimpando arquivos temporarios..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -File -Name "*.tmp" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Recurse -File -Name "*.temp" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Recurse -File -Name "chrome_debug.log" -ErrorAction SilentlyContinue | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-1)
} | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Arquivos temporarios removidos" -ForegroundColor Green

# Verificacao final
Write-Host "`nVerificacao final..." -ForegroundColor Yellow
$ports = @(3000, 3001, 27017)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "Porta $port ainda em uso" -ForegroundColor Yellow
    } else {
        Write-Host "Porta $port livre" -ForegroundColor Green
    }
}

Write-Host "`nLIMPEZA COMPLETA FINALIZADA!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "Sistema otimizado e pronto para uso" -ForegroundColor Green
Write-Host "`nPara reiniciar os servicos, execute:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor White
