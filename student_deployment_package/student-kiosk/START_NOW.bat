@echo off
COLOR 0B
echo ========================================
echo STARTING STUDENT KIOSK
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    COLOR 0E
    echo [WARNING] Not running as Administrator
    echo Shutdown feature will not work without admin rights
    echo.
    echo Continuing in 3 seconds...
    timeout /t 3 /nobreak >nul
)

echo Current directory: %CD%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    COLOR 0E
    echo [WARNING] Dependencies not installed!
    echo Installing now... (this takes 2-3 minutes)
    echo.
    call npm install
    if %errorLevel% neq 0 (
        COLOR 0C
        echo.
        echo [FAIL] npm install failed!
        pause
        exit /b 1
    )
)

echo.
echo Starting kiosk...
echo.

npm start

if %errorLevel% neq 0 (
    COLOR 0C
    echo.
    echo [FAIL] Kiosk failed to start!
    echo.
    echo Press any key to see troubleshooting tips...
    pause >nul
    echo.
    echo Common fixes:
    echo 1. Make sure Node.js is installed: node --version
    echo 2. Try: npm install
    echo 3. Check server is running on 192.168.1.100:5003
    echo 4. Check main-simple.js for correct SERVER_URL
    pause
)
