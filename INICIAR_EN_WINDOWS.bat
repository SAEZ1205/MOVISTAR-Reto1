@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Instala Node.js 22 desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias por primera vez...
  call npm install
)

if not exist ".env.local" (
  echo Falta la configuracion inicial.
  call npm run configurar
)

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"
echo Abriendo Mi Movistar - Entiende tu recibo...
call npm run dev
pause
