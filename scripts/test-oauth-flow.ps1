# 🔐 Teste de Login OAuth Google
# Script para testar o fluxo completo de autenticação

Write-Host "🔐 TESTANDO FLUXO DE LOGIN OAUTH GOOGLE" -ForegroundColor Cyan
Write-Host ""

# 1. Testar página de login
Write-Host "1. Testando página de login..." -NoNewline
try {
    $loginPage = Invoke-WebRequest -Uri "http://localhost:3001/login" -UseBasicParsing
    if ($loginPage.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
    } else {
        Write-Host " ❌ ERRO: Status $($loginPage.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar endpoint de OAuth Google
Write-Host "2. Testando endpoint OAuth..." -NoNewline
try {
    $oauthResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/google" -MaximumRedirection 0 -ErrorAction Stop
    Write-Host " ❌ Não deveria retornar aqui" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host " ✅ OK (Redirecionamento esperado)" -ForegroundColor Green
        $redirectLocation = $_.Exception.Response.Headers.Location
        Write-Host "   📍 Redirecionando para: $redirectLocation" -ForegroundColor Yellow
    } else {
        Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Testar dashboard com token simulado
Write-Host "3. Testando dashboard com token simulado..." -NoNewline
try {
    $dashboardWithToken = Invoke-WebRequest -Uri "http://localhost:3001/dashboard?token=test123" -UseBasicParsing
    if ($dashboardWithToken.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
        if ($dashboardWithToken.Content -like "*OAuth*" -or $dashboardWithToken.Content -like "*Processando*") {
            Write-Host "   📱 OAuth Handler detectado na página!" -ForegroundColor Green
        }
    } else {
        Write-Host " ❌ ERRO: Status $($dashboardWithToken.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar welcome com token simulado  
Write-Host "4. Testando welcome com token simulado..." -NoNewline
try {
    $welcomeWithToken = Invoke-WebRequest -Uri "http://localhost:3001/welcome?token=test123" -UseBasicParsing
    if ($welcomeWithToken.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
    } else {
        Write-Host " ❌ ERRO: Status $($welcomeWithToken.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 INSTRUÇÕES PARA TESTE MANUAL:" -ForegroundColor Cyan
Write-Host "1. Abra: http://localhost:3001/login" -ForegroundColor Yellow
Write-Host "2. Clique em 'Continuar com Google'" -ForegroundColor Yellow  
Write-Host "3. Complete o OAuth no Google" -ForegroundColor Yellow
Write-Host "4. Verifique se redireciona para dashboard automaticamente" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 RESULTADO ESPERADO:" -ForegroundColor Cyan
Write-Host "- Login OAuth deve redirecionar para /dashboard ou /welcome com token" -ForegroundColor Green
Write-Host "- OAuth Handler deve processar token e redirecionar para /dashboard/instances" -ForegroundColor Green
Write-Host "- Não deve voltar para página de login" -ForegroundColor Green
