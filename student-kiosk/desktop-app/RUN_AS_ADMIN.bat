@echo off
echo ========================================
echo   STUDENT KIOSK - ADMIN LAUNCHER
echo ========================================
echo.
echo This script launches the kiosk with administrator privileges
echo Required for shutdown functionality to work properly
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Navigate to the directory
cd /d "%SCRIPT_DIR%"

echo Starting kiosk with admin privileges...
echo.

REM Check if npm start works (development mode)
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Running in DEVELOPMENT mode with npm...
    powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"%SCRIPT_DIR%\" && npm start' -Verb RunAs"
) else (
    REM Look for the built EXE file
    if exist "dist\student-kiosk.exe" (
        echo Running PRODUCTION EXE...
        powershell -Command "Start-Process '%SCRIPT_DIR%dist\student-kiosk.exe' -Verb RunAs"
    ) else if exist "..\..\dist\student-kiosk.exe" (
        echo Running PRODUCTION EXE from parent dist...
        powershell -Command "Start-Process '%SCRIPT_DIR%..\..\dist\student-kiosk.exe' -Verb RunAs"
    ) else (
        echo ERROR: Cannot find kiosk application!
        echo.
        echo Please either:
        echo   1. Install Node.js and run: npm install then npm start
        echo   2. Build the EXE: npm run build-win
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Kiosk should now be starting with admin privileges...
echo UAC prompt may appear - click YES to allow
echo.
pause
