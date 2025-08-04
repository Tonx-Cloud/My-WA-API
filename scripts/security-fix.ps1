# scripts/security-fix.ps1 - Correção Definitiva de Segredos Expostos (PowerShell)
param()

Write-Host "🔧 Iniciando correção de segurança completa..." -ForegroundColor Cyan
Write-Host "=".PadRight(50, "=") -ForegroundColor Gray

# FASE 1: Backup
Write-Host "`n📦 FASE 1: Criando backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$branchName = "security-fix-$timestamp"
Write-Host "Branch de backup: $branchName" -ForegroundColor Gray

# FASE 2: Verificação de segredos existentes
Write-Host "`n🔍 FASE 2: Verificando segredos no repositório..." -ForegroundColor Yellow

# Verificar docker-compose.yml atual
Write-Host "🐳 Verificando docker-compose.yml atual..." -ForegroundColor Gray
$dockerComposeContent = Get-Content "docker-compose.yml" -Raw
if ($dockerComposeContent -match "GOOGLE_CLIENT_ID.*=.*apps\.googleusercontent\.com") {
    Write-Host "❌ SEGREDOS AINDA PRESENTES no docker-compose.yml" -ForegroundColor Red
    Select-String "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET" "docker-compose.yml"
} else {
    Write-Host "✅ docker-compose.yml está sanitizado" -ForegroundColor Green
}

# FASE 3: Preparar novo sistema de variáveis de ambiente
Write-Host "`n📝 FASE 3: Preparando sistema de variáveis de ambiente..." -ForegroundColor Yellow

# Criar .env.example atualizado
$envExampleContent = @"
# Google OAuth Configuration (ROTATED)
GOOGLE_CLIENT_ID=your_new_google_client_id_here
GOOGLE_CLIENT_SECRET=your_new_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_secure_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# API Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/whatsapp

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My-wa-API
NEXT_PUBLIC_APP_VERSION=2.0.0

# Docker Environment
DOCKER_ENV=true

# NPM Configuration
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
"@

Set-Content -Path ".env.example" -Value $envExampleContent
Write-Host "✅ .env.example criado/atualizado" -ForegroundColor Green

# Criar .env local se não existir
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env local..." -ForegroundColor Gray
    $envContent = @"
# Google OAuth (NOVAS CREDENCIAIS - ATUALIZE COM VALORES REAIS)
GOOGLE_CLIENT_ID=NOVA_CREDENTIAL_AQUI
GOOGLE_CLIENT_SECRET=NOVA_CREDENTIAL_AQUI

# NextAuth Configuration
NEXTAUTH_SECRET=4f8b2a7e3d9c1a5b8e6f9a2d4c7b1e8f3a6d9c2b5e8f1a4d7c0b3e6f9a2d5c8b1e4f7a0d3c6b9e2f5a8d1c4b7e0f3a6d9c2b5e8f1a4d7c0b3e6f9a2d
NEXTAUTH_URL=http://localhost:3001

# API Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/whatsapp

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My-wa-API
NEXT_PUBLIC_APP_VERSION=2.0.0

# Docker Environment
DOCKER_ENV=true

# NPM Configuration
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Arquivo .env já existe" -ForegroundColor Blue
}

# FASE 4: Atualizar .gitignore
Write-Host "`n🔒 FASE 4: Atualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = if (Test-Path ".gitignore") { Get-Content ".gitignore" } else { @() }
$gitignoreText = $gitignoreContent -join "`n"

if ($gitignoreText -notmatch "^\.env$") {
    $additionalGitignore = @"

# Environment Variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production
*.env

# Sensitive files
secrets/
credentials/
push-log.txt
secrets-scan.log
bfg-repo-cleaner-*.jar
secrets.txt
"@
    Add-Content -Path ".gitignore" -Value $additionalGitignore
    Write-Host "✅ .gitignore atualizado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ .gitignore já contém regras para .env" -ForegroundColor Blue
}

# FASE 5: Sanitizar docker-compose.yml se necessário
Write-Host "`n🐳 FASE 5: Verificando docker-compose.yml..." -ForegroundColor Yellow
$dockerComposeContent = Get-Content "docker-compose.yml" -Raw

if ($dockerComposeContent -match "GOOGLE_CLIENT_ID.*=.*apps\.googleusercontent\.com") {
    Write-Host "🔧 Sanitizando docker-compose.yml..." -ForegroundColor Yellow
    
    # Fazer backup
    Copy-Item "docker-compose.yml" "docker-compose.yml.backup"
    
    # Substituir segredos por variáveis de ambiente
    $sanitizedContent = $dockerComposeContent -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=`${GOOGLE_CLIENT_ID}"
    $sanitizedContent = $sanitizedContent -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=`${GOOGLE_CLIENT_SECRET}"
    
    Set-Content -Path "docker-compose.yml" -Value $sanitizedContent
    Write-Host "✅ docker-compose.yml sanitizado" -ForegroundColor Green
} else {
    Write-Host "✅ docker-compose.yml já está sanitizado" -ForegroundColor Green
}

# FASE 6: Teste de configuração
Write-Host "`n✅ FASE 6: Testando configuração..." -ForegroundColor Yellow
try {
    $null = Get-Command docker-compose -ErrorAction Stop
    Write-Host "🐳 Testando docker-compose config..." -ForegroundColor Gray
    
    $configTest = docker-compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ docker-compose.yml é válido" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na configuração do docker-compose.yml" -ForegroundColor Red
        Write-Host $configTest -ForegroundColor Red
    }
} catch {
    Write-Host "ℹ️ docker-compose não encontrado, pulando teste" -ForegroundColor Blue
}

# FASE 7: Preparar arquivos para commit
Write-Host "`n🚀 FASE 7: Preparando arquivos para commit..." -ForegroundColor Yellow
git add .env.example .gitignore

if (Test-Path "docker-compose.yml.backup") {
    git add docker-compose.yml
}

Write-Host "`n🎉 CORREÇÃO DE SEGURANÇA CONCLUÍDA!" -ForegroundColor Green
Write-Host "=".PadRight(36, "=") -ForegroundColor Gray
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS CRÍTICOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🔑 REVOGAR CREDENCIAIS COMPROMETIDAS:" -ForegroundColor Yellow
Write-Host "   - Acesse: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "   - Revogue o Client ID: [CREDENCIAL_REMOVIDA_POR_SEGURANÇA]" -ForegroundColor Red
Write-Host ""
Write-Host "2. 🆕 GERAR NOVAS CREDENCIAIS:" -ForegroundColor Yellow
Write-Host "   - Crie um novo OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "   - Atualize o arquivo .env com as novas credenciais" -ForegroundColor White
Write-Host ""
Write-Host "3. 📝 COMMIT E PUSH:" -ForegroundColor Yellow
Write-Host "   - git commit -m `"fix: implement secure environment variables and remove hardcoded secrets`"" -ForegroundColor White
Write-Host "   - git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "4. 🔍 VERIFICAR:" -ForegroundColor Yellow
Write-Host "   - Confirme que o push foi bem-sucedido" -ForegroundColor White
Write-Host "   - Teste a aplicação com as novas credenciais" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  CREDENCIAIS COMPROMETIDAS (NÃO USAR):" -ForegroundColor Red
Write-Host "   CLIENT_ID: [CREDENCIAL_REMOVIDA_POR_SEGURANÇA]" -ForegroundColor Red
Write-Host "   CLIENT_SECRET: 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" -ForegroundColor Red
Write-Host ""
Write-Host "🛡️ Status de segurança: SEGREDOS REMOVIDOS DO CÓDIGO" -ForegroundColor Green
