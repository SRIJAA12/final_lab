@echo off
echo ============================================
echo  SDC Kiosk - Deploy Key Blocker Update
echo ============================================
echo.

:: Set paths
set SOURCE=%~dp0
set TARGET=C:\StudentKiosk\student-kiosk

:: Check target exists
if not exist "%TARGET%" (
    echo ERROR: %TARGET% does not exist!
    echo Make sure the student kiosk is installed first.
    pause
    exit /b 1
)

:: Stop any running kiosk and blocker
echo [1/4] Stopping running kiosk...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im kiosk_blocker.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Copy files
echo [2/4] Copying main-simple.js...
copy /Y "%SOURCE%main-simple.js" "%TARGET%\main-simple.js"
if errorlevel 1 (
    echo FAILED to copy main-simple.js!
    pause
    exit /b 1
)

echo [3/4] Copying kiosk_blocker.exe...
copy /Y "%SOURCE%kiosk_blocker.exe" "%TARGET%\kiosk_blocker.exe"
if errorlevel 1 (
    echo FAILED to copy kiosk_blocker.exe!
    pause
    exit /b 1
)

:: Restart kiosk
echo [4/4] Starting kiosk...
cd /d "%TARGET%"
if exist "node_modules\.bin\electron.cmd" (
    start "" "node_modules\.bin\electron.cmd" main-simple.js
) else if exist "..\node_modules\.bin\electron.cmd" (
    start "" "..\node_modules\.bin\electron.cmd" main-simple.js
) else (
    echo WARNING: Could not find electron.cmd to restart kiosk.
    echo You may need to restart manually or reboot.
)

echo.
echo ============================================
echo  DONE! Files deployed:
echo    - main-simple.js
echo    - kiosk_blocker.exe
echo ============================================
echo.
echo The kiosk should restart with Windows key
echo and Alt+Tab BLOCKED on the login screen.
echo.
pause
