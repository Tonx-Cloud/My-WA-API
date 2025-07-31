@echo off
REM Deploy script para My WhatsApp API (Windows)
REM Usage: deploy.bat [environment]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production
set PROJECT_NAME=my-wa-api
set API_DIR=apps\api

echo 🚀 Iniciando deploy do %PROJECT_NAME% para ambiente: %ENVIRONMENT%

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Execute este script na raiz do projeto (onde está o package.json principal)
    exit /b 1
)

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado. Instale o Node.js >= 20.17.0
    exit /b 1
)

REM Navegar para o diretório da API
cd %API_DIR%

echo 📦 Instalando dependências...
call npm ci --production=false
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependências
    exit /b 1
)

echo 🔧 Executando verificações de tipo...
call npm run typecheck
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro na verificação de tipos
    exit /b 1
)

echo 🏗️  Compilando aplicação...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro na compilação
    exit /b 1
)

if "%ENVIRONMENT%"=="production" (
    echo 🧹 Limpando dependências de desenvolvimento...
    call npm ci --production=true
    
    echo 🔍 Verificando estrutura de build...
    if not exist "dist\index.js" (
        echo ❌ Build falhou - arquivo principal não encontrado
        exit /b 1
    )
    
    echo 🎯 Configurando ambiente de produção...
    set NODE_ENV=production
    
    REM Verificar se PM2 está instalado globalmente
    where pm2 >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📊 Iniciando com PM2...
        pm2 stop %PROJECT_NAME% 2>nul
        pm2 delete %PROJECT_NAME% 2>nul
        pm2 start ecosystem.config.json --env production
        pm2 save
        
        echo ✅ Deploy concluído com PM2!
        echo 📊 Use 'pm2 status' para verificar o status
        echo 📝 Use 'pm2 logs %PROJECT_NAME%' para ver os logs
    ) else (
        echo ⚠️  PM2 não encontrado. Iniciando em modo simples...
        echo 💡 Para produção, recomenda-se instalar PM2: npm install -g pm2
        start /B npm run start:prod
        echo ✅ Deploy concluído!
    )
) else (
    echo 🚀 Iniciando em modo desenvolvimento...
    start /B npm run start
    echo ✅ Deploy de desenvolvimento concluído!
)

echo.
echo 🌐 API disponível em: http://localhost:3000
echo 📚 Documentação: http://localhost:3000/api-docs
echo 💊 Health check: http://localhost:3000/health
echo.

REM Voltar para o diretório raiz
cd ..\..

echo ✨ Deploy finalizado com sucesso!
pause
