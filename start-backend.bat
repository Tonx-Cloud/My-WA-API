@echo off
echo ========================================
echo     MY-WA-API - INICIALIZACAO BACKEND
echo ========================================
echo.

echo [INFO] Navegando para pasta da API...
cd /d "C:\Projetos\My-wa-api\apps\api"
echo [INFO] Pasta atual: %cd%
echo.

echo [INFO] Verificando dependencias...
if not exist "node_modules" (
    echo [WARN] Dependencias nao encontradas. Instalando...
    npm install
    echo.
)

echo [INFO] Verificando arquivo .env...
if not exist ".env" (
    echo [WARN] Arquivo .env nao encontrado. Copiando exemplo...
    copy ".env.example" ".env"
    echo [ALERT] Configure as variaveis de ambiente no arquivo .env
    echo.
)

echo [INFO] Iniciando servidor backend...
echo [INFO] Servidor sera executado na porta 3000
echo [INFO] Health check: http://localhost:3000/health
echo [INFO] API docs: http://localhost:3000/api-docs
echo [INFO] Para parar, pressione Ctrl+C
echo.
echo ========================================
npm run dev
