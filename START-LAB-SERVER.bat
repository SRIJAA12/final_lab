@echo off
REM ========================================
REM COLLEGE LAB - START SERVER
REM ========================================
echo.
echo ========================================
echo   COLLEGE LAB SERVER STARTUP
echo ========================================
echo.

REM Check if MongoDB service is running
echo [1/4] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ MongoDB is already running
) else (
    echo       ⚠️  MongoDB is not running, attempting to start...
    net start MongoDB
    if %ERRORLEVEL% EQU 0 (
        echo       ✅ MongoDB started successfully
    ) else (
        echo       ❌ Failed to start MongoDB
        echo       Please ensure MongoDB is installed as a service
        pause
        exit /b 1
    )
)

echo.
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo       ❌ Node.js is not installed
    echo       Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo       ✅ Node.js is installed
)

echo.
echo [3/4] Navigating to server directory...
cd /d "%~dp0central-admin\server"
if %ERRORLEVEL% NEQ 0 (
    echo       ❌ Server directory not found
    pause
    exit /b 1
) else (
    echo       ✅ Server directory found
)

echo.
echo [4/4] Starting server...
echo.
echo ========================================
echo   SERVER IS NOW RUNNING
echo ========================================
echo.
echo 📊 Admin Dashboard: http://localhost:7401/dashboard/admin-dashboard.html
echo 👥 Student Management: Open student-management-system.html in browser
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node app.js

REM If server exits, pause to show error messages
echo.
echo ⚠️  Server has stopped
pause
