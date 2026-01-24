@echo off
title Wake-on-LAN Service Launcher
color 0B

echo.
echo ============================================================
echo   Starting Wake-on-LAN Service
echo ============================================================
echo.

cd /d "%~dp0central-admin\server"

echo Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo Starting Wake-on-LAN service on port 3002...
echo.
node wake-on-lan-service.js

pause
