@echo off
echo ========================================
echo        MY-WA-API - INICIALIZACAO COMPLETA
echo ========================================
echo.

echo [INFO] Iniciando backend e frontend em paralelo...
echo [INFO] Backend: http://localhost:3000
echo [INFO] Frontend: http://localhost:3001
echo [INFO] Para parar, feche ambas as janelas do terminal
echo.

echo [INFO] Abrindo terminal para backend...
start "MY-WA-API Backend" cmd /k "start-backend.bat"

echo [INFO] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo [INFO] Abrindo terminal para frontend...
start "MY-WA-API Frontend" cmd /k "start-frontend.bat"

echo.
echo [SUCCESS] Ambos os serviços foram iniciados!
echo [INFO] Aguarde alguns segundos para a inicializacao completa
echo.
echo ========================================
echo              URLS IMPORTANTES
echo ========================================
echo  Backend API: http://localhost:3000/api
echo  Health Check: http://localhost:3000/health
echo  API Docs: http://localhost:3000/api-docs
echo  Frontend: http://localhost:3001
echo  Login: http://localhost:3001/login
echo  Dashboard: http://localhost:3001/dashboard
echo ========================================
echo.

pause
