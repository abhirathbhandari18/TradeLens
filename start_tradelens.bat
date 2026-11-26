@echo off
echo ========================================================
echo        TradeLens - One-Click Application Launcher
echo ========================================================
echo [1/2] Launching Java Backend Server (Port 8080)...
start "TradeLens Java Backend" cmd /k "cd /d %~dp0backend && call run.bat"

echo [2/2] Launching React Frontend (Port 5173)...
start "TradeLens React UI" cmd /k "cd /d %~dp0frontend && call start.bat"

echo.
echo TradeLens is booting up!
echo - Backend REST API: http://localhost:8080/api/
echo - Frontend UI:      http://localhost:5173/
echo ========================================================
pause
