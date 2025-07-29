# My-wa-API - Script de Inicializacao Completa
Write-Host 'Iniciando Backend...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass', '-File', 'C:\Projetos\My-wa-api\scripts\start-backend.ps1' -WindowStyle Minimized
Start-Sleep -Seconds 5
Write-Host 'Iniciando Frontend...' -ForegroundColor Blue  
Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass', '-File', 'C:\Projetos\My-wa-api\scripts\start-frontend.ps1' -WindowStyle Minimized
Write-Host 'Servicos iniciados!' -ForegroundColor Green
Write-Host 'Backend: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'Frontend: http://localhost:3001' -ForegroundColor Cyan
