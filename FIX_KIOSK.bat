@echo off
COLOR 0E
echo ========================================
echo KIOSK REPAIR TOOL
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    COLOR 0C
    echo ERROR: This script must run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo This will:
echo 1. Clean node_modules
echo 2. Reinstall all dependencies
echo 3. Test the kiosk
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

cd /d "D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk"

echo.
echo [1/4] Cleaning old dependencies...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo Removed node_modules
)

if exist "package-lock.json" (
    del /q package-lock.json
    echo Removed package-lock.json
)

echo.
echo [2/4] Clearing npm cache...
call npm cache clean --force

echo.
echo [3/4] Installing dependencies (this may take 2-3 minutes)...
call npm install

if %errorLevel% neq 0 (
    COLOR 0C
    echo.
    echo [FAIL] npm install failed!
    echo.
    echo Common fixes:
    echo - Check internet connection
    echo - Disable antivirus temporarily
    echo - Run: npm cache clean --force
    pause
    exit /b 1
)

echo.
echo [4/4] Testing kiosk startup...
timeout /t 2 /nobreak >nul

COLOR 0A
echo.
echo ========================================
echo REPAIR COMPLETE!
echo ========================================
echo.
echo Press any key to start kiosk...
pause >nul

npm start
