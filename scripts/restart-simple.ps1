# Script para reiniciar todos os servicos
Write-Host 'Reiniciando My-wa-API...' -ForegroundColor Magenta
Write-Host 'Parando servicos...' -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force
Start-Sleep -Seconds 3
Write-Host 'Iniciando servicos...' -ForegroundColor Green
& 'C:\Projetos\My-wa-api\scripts\start-all.ps1'
