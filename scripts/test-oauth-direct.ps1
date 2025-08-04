Write-Host "=== TESTE OAuth com Redirecionamento Direto ===" -ForegroundColor Cyan
Write-Host "Testando fluxo OAuth atualizado..." -ForegroundColor Yellow

# 1. Testar página de callback OAuth
Write-Host "`n1. Testando página OAuth callback..." -ForegroundColor Green
try {
    $callbackResponse = Invoke-WebRequest -Uri "http://localhost:3001/oauth/callback" -Method GET -UseBasicParsing
    Write-Host "   Status: $($callbackResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar redirecionamento OAuth do backend
Write-Host "`n2. Testando redirecionamento OAuth backend..." -ForegroundColor Green
try {
    $redirectResponse = Invoke-WebRequest -Uri "http://localhost:3000/auth/google" -Method GET -MaximumRedirection 0 -ErrorAction SilentlyContinue
    Write-Host "   Status: $($redirectResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Redirecionamento para: $($redirectResponse.Headers.Location)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "   Status: 302 (Redirecionamento OK)" -ForegroundColor Green
        Write-Host "   Location: $($_.Exception.Response.Headers.Location)" -ForegroundColor Yellow
    } else {
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Testar endpoint de validação de token
Write-Host "`n3. Testando endpoint de validação de token..." -ForegroundColor Green
try {
    $body = @{
        token = "test-token"
    } | ConvertTo-Json
    
    $tokenResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/backend-login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($tokenResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($tokenResponse.Content)" -ForegroundColor Yellow
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "   Resposta esperada para token inválido" -ForegroundColor Gray
}

# 4. Verificar middleware de rota protegida
Write-Host "`n4. Testando acesso a rota protegida sem autenticação..." -ForegroundColor Green
try {
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3001/dashboard/instances" -Method GET -UseBasicParsing
    Write-Host "   Status: $($dashboardResponse.StatusCode)" -ForegroundColor Green
    if ($dashboardResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Acesso direto permitido" -ForegroundColor Green
    }
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    if ($_.Exception.Response.StatusCode -eq 302) {
        Write-Host "   🔄 Redirecionado (middleware ativo)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Cyan
Write-Host "Para testar OAuth completo:" -ForegroundColor White
Write-Host "1. Abra http://localhost:3001/login" -ForegroundColor Gray
Write-Host "2. Clique em 'Login com Google'" -ForegroundColor Gray
Write-Host "3. Verifique se redireciona para /dashboard/instances após login" -ForegroundColor Gray
