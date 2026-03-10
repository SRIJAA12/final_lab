@echo off
REM ================================================================
REM START KIOSK WITH FULL SECURITY (Python Blocker + Electron)
REM ================================================================
REM This starts both the Python key blocker AND the Electron kiosk
REM providing maximum security against all key combinations
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         STARTING SECURE KIOSK SYSTEM                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Need Administrator privileges for full security!
    echo    Requesting admin rights...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %CD% && %~f0' -Verb RunAs"
    exit /b
)

echo ✅ Running with Administrator privileges
echo.

REM Step 1: Start Python key blocker in background
echo [1/2] Starting Python key blocker...
start /MIN python "%~dp0kiosk_key_blocker.py"
timeout /t 2 /nobreak >nul
echo ✅ Key blocker started (hidden)
echo.

REM Step 2: Start Electron kiosk without CMD window
echo [2/2] Starting Electron kiosk...
cd /d C:\StudentKiosk
start /MIN cmd /c "npm start"
timeout /t 3 /nobreak >nul
echo ✅ Kiosk started
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ SECURE KIOSK RUNNING
echo ════════════════════════════════════════════════════════════════
echo.
echo Security Features Active:
echo   ✅ Windows key BLOCKED (OS-level + hook)
echo   ✅ Escape key BLOCKED
echo   ✅ Start button BLOCKED
echo   ✅ Taskbar HIDDEN
echo   ✅ Win+D, Win+E, Win+R, Win+L BLOCKED
echo   ✅ Ctrl+Esc BLOCKED
echo.
echo To stop everything:
echo   1. Close the kiosk window
echo   2. Run: STOP_SECURE_KIOSK.bat
echo.
echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul
exit
