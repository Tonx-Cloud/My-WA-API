# Script para testar o novo fluxo OAuth corrigido

Write-Host "TESTANDO FLUXO OAUTH CORRIGIDO" -ForegroundColor Cyan
Write-Host ""

# 1. Testar página de callback OAuth
Write-Host "1. Testando pagina callback..." -NoNewline
try {
    $callbackPage = Invoke-WebRequest -Uri "http://localhost:3001/oauth/callback?token=test123" -UseBasicParsing
    if ($callbackPage.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: Status $($callbackPage.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar endpoint OAuth Backend  
Write-Host "2. Testando OAuth backend..." -NoNewline
try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/auth/google" -MaximumRedirection 0 -ErrorAction Stop
    Write-Host " Nao deveria retornar aqui" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host " OK (Redirecionamento esperado)" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Testar frontend OAuth proxy
Write-Host "3. Testando frontend OAuth..." -NoNewline  
try {
    Invoke-WebRequest -Uri "http://localhost:3001/api/auth/google" -MaximumRedirection 0 -ErrorAction Stop
    Write-Host " Nao deveria retornar aqui" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 307) {
        Write-Host " OK (Proxy funcionando)" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "NOVO FLUXO OAUTH:" -ForegroundColor Cyan
Write-Host "1. Usuario clica Login Google" -ForegroundColor Yellow
Write-Host "2. Frontend redireciona para Backend" -ForegroundColor Yellow  
Write-Host "3. Backend redireciona para Google OAuth" -ForegroundColor Yellow
Write-Host "4. Google redireciona para Backend callback" -ForegroundColor Yellow
Write-Host "5. Backend gera JWT e redireciona para /oauth/callback" -ForegroundColor Yellow
Write-Host "6. Frontend processa token e vai para dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "CORRECAO APLICADA: Middleware nao bloqueia /oauth/callback" -ForegroundColor Green
Write-Host "CORRECAO APLICADA: Pagina callback dedicada para JWT" -ForegroundColor Green
