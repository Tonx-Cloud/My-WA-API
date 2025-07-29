# Script para parar todos os servicos
Write-Host 'Parando todos os servicos...' -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force
Write-Host 'Servicos parados!' -ForegroundColor Green
