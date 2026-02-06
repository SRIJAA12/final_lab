@echo off
REM ============================================================
REM Lab Management System - One-Click Launcher
REM This will start the server and open admin dashboard
REM ============================================================

echo.
echo ============================================================
echo    LAB MANAGEMENT SYSTEM - ONE-CLICK LAUNCHER
echo ============================================================
echo.
echo [1/3] Starting server...
echo.

REM Change to server directory using FULL PATH
REM This works even when run from Windows Startup folder
cd /d "C:\Users\Administrator\Downloads\screen_mirror_deployment_my_laptop\central-admin\server"

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if app.js exists
if not exist "app.js" (
    echo.
    echo ERROR: app.js not found in central-admin\server!
    echo.
    pause
    exit /b 1
)

REM Start the server in a new window (stays open)
start "Lab Management Server" cmd /k "node app.js"

echo.
echo [2/3] Server starting... Please wait...
echo.

REM Wait 4 seconds for server to fully start
timeout /t 4 /nobreak >nul

echo.
echo [3/3] Opening admin dashboard...
echo.

REM Manually open the admin dashboard in default browser
REM Server will also try to auto-open, but this is a fallback
start "" "http://10.10.46.103:7401/admin-dashboard.html"

echo.
echo ============================================================
echo.
echo SUCCESS! System is now running.
echo.
echo - Server window: Running in separate window
echo - Admin dashboard: Opened in your default browser
echo - Keep the server window open while using the system
echo - This window can be closed safely now
echo.
echo ============================================================
echo.
echo Press any key to close this window...
pause >nul
