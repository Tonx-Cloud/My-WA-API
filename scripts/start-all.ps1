# My-wa-API - Script de Inicialização Completa
# PowerShell Script para iniciar todos os serviços

Write-Host "=== MY-WA-API START-ALL SCRIPT ===" -ForegroundColor Yellow
Write-Host ""

# Definir diretório do projeto
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Write-Host "Diretório do projeto: $ProjectRoot" -ForegroundColor Gray

# Verificar se estamos no diretório correto
if (-not (Test-Path "$ProjectRoot\package.json")) {
    Write-Host "ERRO: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de estar executando do diretório do projeto." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Iniciando sistema My-wa-API..." -ForegroundColor Green
Write-Host ""

# Opção 1: Usar Turbo (recomendado)
Write-Host "Método 1: Usando Turbo Monorepo (Recomendado)" -ForegroundColor Cyan
Write-Host "Comando: npm run dev" -ForegroundColor Gray
Write-Host ""

# Opção 2: Scripts separados
Write-Host "Método 2: Scripts separados" -ForegroundColor Cyan
Write-Host "Backend: .\scripts\start-backend.bat" -ForegroundColor Gray
Write-Host "Frontend: .\scripts\start-frontend.bat" -ForegroundColor Gray
Write-Host ""

# Perguntar ao usuário qual método prefere
$choice = Read-Host "Escolha o método (1 para Turbo, 2 para separado, ENTER para Turbo)"

if ($choice -eq "2") {
    Write-Host ""
    Write-Host "Iniciando serviços separadamente..." -ForegroundColor Yellow
    
    # Iniciar backend
    Write-Host "Iniciando Backend API..." -ForegroundColor Green
    Start-Process cmd -ArgumentList "/c", "cd /d `"$ProjectRoot`" && .\scripts\start-backend.bat" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    # Iniciar frontend
    Write-Host "Iniciando Frontend Web..." -ForegroundColor Blue
    Start-Process cmd -ArgumentList "/c", "cd /d `"$ProjectRoot`" && .\scripts\start-frontend.bat" -WindowStyle Normal
    
    Write-Host ""
    Write-Host "Serviços iniciados em janelas separadas!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Iniciando com Turbo Monorepo..." -ForegroundColor Yellow
    
    # Mudar para o diretório do projeto
    Set-Location $ProjectRoot
    
    # Executar npm run dev
    Write-Host "Executando: npm run dev" -ForegroundColor Gray
    npm run dev
}

Write-Host ""
Write-Host "=== SERVIÇOS DISPONÍVEIS ===" -ForegroundColor Yellow
Write-Host "🚀 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌐 Frontend Web: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Dashboard: http://localhost:3001/dashboard" -ForegroundColor Cyan
Write-Host "📱 Instâncias: http://localhost:3001/dashboard/instances" -ForegroundColor Cyan
Write-Host "💬 Mensagens: http://localhost:3001/dashboard/messages" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Sistema My-wa-API iniciado com sucesso!" -ForegroundColor Green
