# Script de Diagnóstico Git para GitHub Push
param()

Write-Host "🔍 DIAGNÓSTICO GIT - PROBLEMAS DE PUSH PARA GITHUB" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 1. STATUS DO REPOSITÓRIO:" -ForegroundColor Yellow
git status --porcelain

Write-Host "`n📋 2. CONFIGURAÇÃO REMOTA:" -ForegroundColor Yellow
git remote -v

Write-Host "`n📋 3. BRANCH ATUAL E TRACKING:" -ForegroundColor Yellow
git branch -vv

Write-Host "`n📋 4. ÚLTIMOS COMMITS:" -ForegroundColor Yellow
git log --oneline -5

Write-Host "`n📋 5. CONFIGURAÇÃO DO USUÁRIO:" -ForegroundColor Yellow
Write-Host "User: $(git config user.name)"
Write-Host "Email: $(git config user.email)"

Write-Host "`n📋 6. CONFIGURAÇÃO DE CREDENCIAIS:" -ForegroundColor Yellow
Write-Host "Credential Helper: $(git config credential.helper)"

Write-Host "`n📋 7. CONECTIVIDADE COM GITHUB:" -ForegroundColor Yellow
try {
    $connection = Test-NetConnection github.com -Port 443 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Conectividade com GitHub: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha na conectividade com GitHub" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao testar conectividade: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 8. CREDENCIAIS ARMAZENADAS:" -ForegroundColor Yellow
try {
    $creds = cmdkey /list:git:https://github.com 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Credenciais encontradas para GitHub" -ForegroundColor Green
    } else {
        Write-Host "❌ Nenhuma credencial encontrada para GitHub" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar credenciais" -ForegroundColor Red
}

Write-Host "`n📋 9. TESTE DE FETCH:" -ForegroundColor Yellow
$fetchOutput = git fetch origin --dry-run 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fetch test: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Fetch test falhou:" -ForegroundColor Red
    Write-Host $fetchOutput -ForegroundColor Red
}

Write-Host "`n📋 10. TESTE DE PUSH (DRY-RUN):" -ForegroundColor Yellow
$pushOutput = git push origin main --dry-run 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push dry-run: OK" -ForegroundColor Green
    Write-Host $pushOutput -ForegroundColor Gray
} else {
    Write-Host "❌ Push dry-run falhou:" -ForegroundColor Red
    Write-Host $pushOutput -ForegroundColor Red
}

Write-Host "`n📋 11. TAMANHO DO REPOSITÓRIO:" -ForegroundColor Yellow
$repoSize = (Get-ChildItem -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Tamanho total: $([math]::Round($repoSize, 2)) MB"

$gitSize = (Get-ChildItem .git -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Tamanho .git: $([math]::Round($gitSize, 2)) MB"

Write-Host "`n📋 12. ARQUIVOS GRANDES:" -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 50MB } | Sort-Object Length -Descending | Select-Object -First 5
if ($largeFiles) {
    Write-Host "Arquivos > 50MB encontrados:" -ForegroundColor Red
    $largeFiles | ForEach-Object { 
        $sizeInMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.FullName): $sizeInMB MB" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Nenhum arquivo > 50MB encontrado" -ForegroundColor Green
}

Write-Host "`n📋 13. HOOKS CONFIGURADOS:" -ForegroundColor Yellow
$hooks = Get-ChildItem .git/hooks -ErrorAction SilentlyContinue
if ($hooks) {
    Write-Host "Hooks encontrados:"
    $hooks | ForEach-Object { Write-Host "  $($_.Name)" }
} else {
    Write-Host "Nenhum hook configurado"
}

Write-Host "`n🏁 DIAGNÓSTICO CONCLUÍDO" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
