@echo off
:: ============================================
:: BLOCK Windows key, Alt+Tab, Taskbar
:: Used during kiosk LOGIN screen ONLY
:: ============================================

:: Kill any existing blocker first
for /f "tokens=2" %%a in ('wmic process where "commandline like '%%block_keys.ps1%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do taskkill /f /pid %%a >nul 2>&1

:: Find the script (same folder as this bat file)
set "SCRIPT=%~dp0block_keys.ps1"

if not exist "%SCRIPT%" (
    echo ERROR: block_keys.ps1 not found at %SCRIPT%
    echo Copy block_keys.ps1 to the same folder as this bat file.
    pause
    exit /b 1
)

echo Starting key blocker...
start "" /B powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%SCRIPT%"
echo.
echo ==========================================
echo  Windows key   = BLOCKED
echo  Alt+Tab       = BLOCKED
echo  Taskbar       = HIDDEN
echo ==========================================
echo.
echo To UNBLOCK, run UNBLOCK_KEYS.bat
