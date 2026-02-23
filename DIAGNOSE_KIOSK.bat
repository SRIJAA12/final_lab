@echo off
COLOR 0A
echo ========================================
echo KIOSK DIAGNOSTIC TOOL
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [PASS] Running as Administrator
) else (
    COLOR 0C
    echo [FAIL] NOT running as Administrator!
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)
echo.

REM Check Node.js installation
echo Checking Node.js...
where node >nul 2>&1
if %errorLevel% == 0 (
    echo [PASS] Node.js found
    node --version
) else (
    COLOR 0C
    echo [FAIL] Node.js NOT found!
    echo Install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo.

REM Check npm
echo Checking npm...
where npm >nul 2>&1
if %errorLevel% == 0 (
    echo [PASS] npm found
    npm --version
) else (
    COLOR 0C
    echo [FAIL] npm NOT found!
    pause
    exit /b 1
)
echo.

REM Check if kiosk folder exists
echo Checking kiosk folder...
if exist "D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk" (
    echo [PASS] Kiosk folder exists
) else (
    COLOR 0C
    echo [FAIL] Kiosk folder NOT found!
    echo Expected: D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk
    pause
    exit /b 1
)
echo.

REM Change to kiosk directory
cd /d "D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk"

REM Check critical files
echo Checking critical files...
set MISSING=0

if exist "package.json" (echo [PASS] package.json) else (echo [FAIL] package.json MISSING & set MISSING=1)
if exist "main-simple.js" (echo [PASS] main-simple.js) else (echo [FAIL] main-simple.js MISSING & set MISSING=1)
if exist "student-interface.html" (echo [PASS] student-interface.html) else (echo [FAIL] student-interface.html MISSING & set MISSING=1)
if exist "preload.js" (echo [PASS] preload.js) else (echo [FAIL] preload.js MISSING & set MISSING=1)

if %MISSING%==1 (
    COLOR 0C
    echo.
    echo [FAIL] Critical files missing!
    pause
    exit /b 1
)
echo.

REM Check node_modules
echo Checking dependencies...
if exist "node_modules" (
    echo [PASS] node_modules folder exists
) else (
    COLOR 0E
    echo [WARN] node_modules NOT found - dependencies not installed
    echo Installing dependencies now...
    echo.
    call npm install
    if %errorLevel% neq 0 (
        COLOR 0C
        echo [FAIL] npm install failed!
        pause
        exit /b 1
    )
    echo [PASS] Dependencies installed successfully
)
echo.

REM Check Electron
echo Checking Electron...
if exist "node_modules\electron\dist\electron.exe" (
    echo [PASS] Electron installed
) else (
    COLOR 0C
    echo [FAIL] Electron NOT installed!
    echo Run: npm install
    pause
    exit /b 1
)
echo.

REM Check server connectivity
echo Checking server connectivity...
ping -n 1 192.168.1.100 >nul 2>&1
if %errorLevel% == 0 (
    echo [PASS] Server 192.168.1.100 is reachable
) else (
    COLOR 0E
    echo [WARN] Cannot ping server 192.168.1.100
    echo Check if server is running and firewall allows connection
)
echo.

REM Check port 5003
echo Checking if port 5003 is accessible...
powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('192.168.1.100', 5003); $client.Close(); exit 0 } catch { exit 1 }"
if %errorLevel% == 0 (
    echo [PASS] Port 5003 on server is accessible
) else (
    COLOR 0E
    echo [WARN] Cannot connect to server port 5003
    echo Make sure the server application is running
)
echo.

REM Display configuration
echo Current Configuration:
echo.
echo Kiosk Path: %CD%
echo.

REM Find system number
findstr /C:"const SYSTEM_NUMBER" main-simple.js
echo.

REM Find server URL
findstr /C:"const SERVER_URL" main-simple.js
echo.

echo ========================================
echo DIAGNOSIS COMPLETE
echo ========================================
echo.
echo Press any key to attempt starting kiosk...
pause >nul

REM Try to start kiosk
echo.
echo Starting kiosk...
echo.
npm start

pause
