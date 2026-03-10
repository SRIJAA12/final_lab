@echo off
REM ================================================================
REM RUN KIOSK KEY BLOCKER WITH ADMIN RIGHTS
REM ================================================================
REM This ensures the Python script can modify registry for
REM OS-level Windows key blocking
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         STARTING KIOSK KEY BLOCKER                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
)

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Not running as Administrator
    echo    Requesting admin privileges...
    echo.
    
    REM Re-run this script as administrator
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %CD% && %~f0' -Verb RunAs"
    exit /b
)

echo ✅ Running with Administrator privileges
echo.
echo Starting Python key blocker...
echo (Press Ctrl+C in the Python window to stop)
echo.

REM Run Python script
python "%~dp0kiosk_key_blocker.py"

echo.
echo Key blocker stopped.
pause
