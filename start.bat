@echo off
echo ============================================
echo    ZOOBO - Starting Servers...
echo ============================================
echo.

echo [1/2] Starting Backend Server on port 5000...
start "ZOOBO Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Dev Server...
start "ZOOBO Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo  Both servers are starting!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo ============================================
echo.
echo You can close this window now.
timeout /t 5 /nobreak >nul
