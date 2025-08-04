@echo off
echo ========================================
echo     MY-WA-API - INICIALIZACAO FRONTEND
echo ========================================
echo.

echo [INFO] Navegando para pasta da web...
cd /d "C:\Projetos\My-wa-api\apps\web"
echo [INFO] Pasta atual: %cd%
echo.

echo [INFO] Verificando dependencias...
if not exist "node_modules" (
    echo [WARN] Dependencias nao encontradas. Instalando...
    npm install
    echo.
)

echo [INFO] Verificando arquivo .env.local...
if not exist ".env.local" (
    echo [WARN] Arquivo .env.local nao encontrado. Copiando exemplo...
    copy ".env.example" ".env.local"
    echo [ALERT] Configure as variaveis de ambiente no arquivo .env.local
    echo.
)

echo [INFO] Iniciando servidor frontend...
echo [INFO] Servidor sera executado na porta 3001
echo [INFO] Frontend: http://localhost:3001
echo [INFO] Login: http://localhost:3001/login
echo [INFO] Dashboard: http://localhost:3001/dashboard
echo [INFO] Para parar, pressione Ctrl+C
echo.
echo ========================================
npm run dev
