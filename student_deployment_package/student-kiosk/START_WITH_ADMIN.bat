@echo off
echo ========================================
echo  STARTING STUDENT KIOSK WITH ADMIN RIGHTS
echo ========================================
echo.
echo This will launch the kiosk with administrator privileges
echo Required for shutdown functionality to work properly
echo.
echo Press any key to continue or close this window to cancel...
pause >nul

REM Get the directory where this batch file is located
cd /d "%~dp0"

REM Check if we're already running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Already running with administrator privileges
    echo Starting kiosk...
    npm start
) else (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"%~dp0\" && npm start' -Verb RunAs"
)
